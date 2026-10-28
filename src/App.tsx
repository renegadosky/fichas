import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import { normalize, emptySheet, type Sheet } from './rules'
import { SheetView } from './SheetView'

const ok = (m:string) => confirm(m)

type Rec = { id:string; owner_id:string; data:Sheet; version:number; shared:boolean }
function Editor({ rec, onBack, isOwner }: { rec:Rec; onBack:()=>void; isOwner:boolean }) {
  const [s, setS] = useState<Sheet>(() => normalize({ ...emptySheet(), ...rec.data }))
  const [status, setStatus] = useState('Salvo'); const [shared, setShared] = useState(rec.shared)
  const ver = useRef(rec.version); const dirty = useRef(false); const timer = useRef<any>(); const latest = useRef(s)
  const [conflict, setConflict] = useState(false)
  const save = async () => {
    setStatus('Salvando…')
    const { data, error } = await supabase.from('sheets').update({ data:latest.current, version:ver.current+1 }).eq('id',rec.id).eq('version',ver.current).select('version')
    if (error) return setStatus('Erro ao salvar: '+error.message+' — tentando de novo…') , void (timer.current = setTimeout(save, 4000))
    if (!data?.length) { setConflict(true); setStatus('Conflito'); return }
    ver.current = data[0].version; dirty.current = false; setStatus('Salvo às '+new Date().toLocaleTimeString())
  }
  const change = (f:(s:Sheet)=>Sheet) => { setS(prev => { const n = f(prev); latest.current = n; return n }); dirty.current = true; setStatus('Alterações não sincronizadas…'); clearTimeout(timer.current); timer.current = setTimeout(save, 700) }
  const reload = async () => { const { data } = await supabase.from('sheets').select('*').eq('id',rec.id).single(); if (data) { ver.current = data.version; latest.current = data.data; setS(data.data); dirty.current = false; setConflict(false); setStatus('Atualizado') } }
  useEffect(() => {
    const ch = supabase.channel('sheet-'+rec.id).on('postgres_changes',{ event:'UPDATE', schema:'public', table:'sheets', filter:`id=eq.${rec.id}` }, p => {
      const n = p.new as Rec; if (n.version <= ver.current) return
      if (dirty.current) setConflict(true); else { ver.current = n.version; latest.current = n.data; setS(n.data); setStatus('Atualizado por outro usuário'); setShared(n.shared) } }).subscribe()
    return () => { supabase.removeChannel(ch) } }, [])
  const share = async (v:boolean) => { const { error } = await supabase.from('sheets').update({ shared:v }).eq('id',rec.id); if (!error) setShared(v); else alert(error.message) }
  return <div className="wrap"><div className="row"><button onClick={onBack}>← Voltar</button>
    {isOwner && <label><input type="checkbox" checked={shared} onChange={e=>share(e.target.checked)}/> Compartilhar com o mestre</label>}</div>
    {conflict && <div className="warn">Esta ficha foi alterada por outra pessoa enquanto você editava. <button onClick={reload}>Carregar versão mais recente (descarta minhas alterações pendentes)</button></div>}
    <SheetView s={s} setS={change}/><div className="st">{status}</div></div>
}

export default function App() {
  const [user, setUser] = useState<any>(null); const [ready, setReady] = useState(false); const [gm, setGm] = useState(false)
  const [list, setList] = useState<Rec[]>([]); const [open, setOpen] = useState<Rec|null>(null); const [view, setView] = useState<'mine'|'gm'>('mine')
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [msg, setMsg] = useState('')
  useEffect(() => { supabase.auth.getSession().then(({data})=>{ setUser(data.session?.user??null); setReady(true) })
    const { data:sub } = supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user??null)); return () => sub.subscription.unsubscribe() }, [])
  const load = async () => { if (!user) return
    const { data:p } = await supabase.from('profiles').select('role').eq('id',user.id).single(); setGm(p?.role==='gm')
    const q = supabase.from('sheets').select('*').order('updated_at',{ascending:false})
    const { data, error } = await (view==='gm' ? q.eq('shared',true) : q.eq('owner_id',user.id)); if (error) setMsg(error.message); else setList(data as Rec[]) }
  useEffect(() => { load() }, [user, view, open])
  const auth = async (up:boolean) => { setMsg(''); const r = up ? await supabase.auth.signUp({email,password:pw}) : await supabase.auth.signInWithPassword({email,password:pw}); if (r.error) setMsg(r.error.message); else if (up && !r.data.session) setMsg('Confirme seu e-mail para entrar.') }
  const create = async () => { const { data, error } = await supabase.from('sheets').insert({ data: emptySheet() }).select().single(); if (error) setMsg(error.message); else setOpen(data as Rec) }
  const remove = async (id:string) => { if (ok('Excluir esta ficha definitivamente?')) { await supabase.from('sheets').delete().eq('id',id); load() } }
  if (!ready) return <div className="wrap">Carregando…</div>
  if (!user) return <div className="wrap"><div className="panel" style={{maxWidth:360,margin:'40px auto'}}><h2>Ficha de RPG</h2>
    <div className="row"><input style={{width:'100%'}} placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)}/></div>
    <div className="row"><input style={{width:'100%'}} type="password" placeholder="Senha (mín. 6)" value={pw} onChange={e=>setPw(e.target.value)}/></div>
    <div className="row"><button className="pri" onClick={()=>auth(false)}>Entrar</button><button onClick={()=>auth(true)}>Cadastrar</button></div><p className="lbl">{msg}</p></div></div>
  if (open) return <Editor key={open.id} rec={open} isOwner={open.owner_id===user.id} onBack={()=>setOpen(null)}/>
  return <div className="wrap"><div className="row"><button className={view==='mine'?'pri':''} onClick={()=>setView('mine')}>Minhas fichas</button>
    {gm && <button className={view==='gm'?'pri':''} onClick={()=>setView('gm')}>Área do mestre</button>}<button onClick={()=>supabase.auth.signOut()}>Sair</button></div>
    {view==='mine' && <button className="pri" onClick={create}>+ Nova ficha</button>}<p className="lbl">{msg}</p>
    {list.map(r=><div className="panel row" key={r.id}><b style={{flex:1}}>{r.data.nome||'(sem nome)'} — nível {r.data.nivel}</b>{r.shared&&<span className="lbl">compartilhada</span>}
      <button onClick={()=>setOpen(r)}>Abrir</button>{view==='mine'&&<button className="del" onClick={()=>remove(r.id)}>Excluir</button>}</div>)}
    {!list.length && <p className="lbl">{view==='gm'?'Nenhuma ficha compartilhada com você.':'Nenhuma ficha ainda.'}</p>}</div>
}
