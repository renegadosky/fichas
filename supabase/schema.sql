create table profiles (id uuid primary key references auth.users on delete cascade, role text not null default 'player' check (role in ('player','gm')));
create table sheets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade default auth.uid(),
  data jsonb not null, version int not null default 1,
  shared boolean not null default false, updated_by uuid, updated_at timestamptz not null default now());
alter table profiles enable row level security;
alter table sheets enable row level security;
create function is_gm() returns boolean language sql security definer stable as $$ select exists(select 1 from profiles where id=auth.uid() and role='gm') $$;
create function new_user() returns trigger language plpgsql security definer as $$ begin insert into profiles(id) values(new.id); return new; end $$;
create trigger on_signup after insert on auth.users for each row execute function new_user();
create policy "perfil proprio" on profiles for select using (id=auth.uid());
create policy "dono total" on sheets for all using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy "mestre le compartilhadas" on sheets for select using (shared and is_gm());
create policy "mestre edita compartilhadas" on sheets for update using (shared and is_gm()) with check (shared and is_gm());
create function guard() returns trigger language plpgsql as $$ begin
  if auth.uid() is distinct from old.owner_id and (new.owner_id<>old.owner_id or new.shared<>old.shared) then raise exception 'sem permissao'; end if;
  if jsonb_typeof(new.data)<>'object' then raise exception 'dados invalidos'; end if;
  new.updated_by=auth.uid(); new.updated_at=now(); return new; end $$;
create trigger sheets_guard before update on sheets for each row execute function guard();
alter publication supabase_realtime add table sheets;
-- Para tornar alguém mestre: update profiles set role='gm' where id='UUID-DO-MESTRE';
