# Ficha digital de RPG
React + TypeScript + Vite + Supabase (Auth, Postgres com RLS, Realtime).
## Configuração
1. Crie um projeto em supabase.com e execute `supabase/schema.sql` no SQL Editor.
2. Em Authentication, habilite e-mail/senha. Copie `.env.example` para `.env` e preencha URL e chave **anon** (nunca use a service_role).
3. Torne-se mestre: `update profiles set role='gm' where id='SEU-UUID';` (UUID em Authentication > Users).
4. `npm install`, `npm run dev`, `npm test`.
## Publicação (GitHub Pages)
Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` como secrets/variáveis do repositório e publique `dist/` (`VITE_BASE=/NOME-DO-REPO/ npm run build`). A chave anon é pública por design; a segurança vem das políticas RLS.
## Regras
Todas as fórmulas ficam em `src/rules.ts`, com testes em `src/rules.test.ts`.
