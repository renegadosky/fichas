import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { emptySheet, normalize } from './rules'
import { Editor } from './Editor'
import { GmArea } from './GmArea'
import { CampaignPage } from './CampaignPage'
import { Avatar } from './ui'
import type { Rec, Mode, GmItem } from './db'

const ok = (m:string) => confirm(m)
const nm = (r:Rec) => normalize({ ...emptySheet(), ...r.data })

export default function App() {
  const [user, setUser] = useState<any>(null); const [ready, setReady] = useState(false); const [gm, setGm] = useState(false)
  const [list, setList] = useState<Rec[]>([]); const [group, setGroup] = useState<Rec[]>([]); const [campNames, setCampNames] = useState<Record<string,string>>({})
  const [open, setOpen] = useState<{ rec:Rec; mode:Mode }|null>(null); const [view, setView] = useState<'mine'|'gm'>('mine')
  const [items, setItems] = useState<GmItem[]>([]); const [campView, setCampView] = useState<{ id:string; nome:string }|null>(null)
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [msg, setMsg] = useState('')
  useEffect(() => { supabase.auth.getSession().then(({data})=>{ setUser(data.session?.user??null); setReady(true) })
    const { data:sub } = supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user??null)); return () => sub.subscription.unsubscribe() }, [])

  const loadItems = async () => { const { data } = await supabase.from('gm_items').select('id,data').order('created_at'); setItems((data ?? []) as GmItem[]) }
  const load = async () => { if (!user) return
    const { data:p } = await supabase.from('profiles').select('role').eq('id',user.id).single(); const isGm = p?.role==='gm'; setGm(isGm)
    if (isGm) loadItems()
    // minhas fichas de personagem (NPCs e inimigos ficam só na Área do mestre)
    const { data, error } = await supabase.from('sheets').select('*').eq('owner_id',user.id).eq('kind','player').order('updated_at',{ascending:false})
    if (error) return setMsg(error.message)
    const mine = data as Rec[]; setList(mine); setMsg('')
    // fichas de outros jogadores das campanhas em que estou (o banco só entrega as que foram liberadas)
    const cids = [...new Set(mine.map(r=>r.campaign_id).filter(Boolean))] as string[]
    if (!cids.length) { setGroup([]); setCampNames({}); return }
    const [g, c] = await Promise.all([
      supabase.from('sheets').select('*').eq('kind','player').neq('owner_id',user.id).in('campaign_id',cids).order('updated_at',{ascending:false}),
      supabase.from('campaigns').select('id,nome').in('id',cids) ])
    setGroup((g.data ?? []) as Rec[]); setCampNames(Object.fromEntries(((c.data ?? []) as any[]).map(x=>[x.id,x.nome]))) }
  useEffect(() => { if (!open) load() }, [user, view, open])

  const auth = async (up:boolean) => { setMsg(''); const r = up ? await supabase.auth.signUp({email,password:pw}) : await supabase.auth.signInWithPassword({email,password:pw}); if (r.error) setMsg(r.error.message); else if (up && !r.data.session) setMsg('Confirme seu e-mail para entrar.') }
  const create = async () => { const { data, error } = await supabase.from('sheets').insert({ data: emptySheet() }).select().single(); if (error) setMsg(error.message); else setOpen({ rec:data as Rec, mode:'owner' }) }
  const remove = async (id:string) => { if (ok('Excluir esta ficha definitivamente?')) { await supabase.from('sheets').delete().eq('id',id); load() } }
  if (!ready) return <div className="wrap">Carregando…</div>
  if (!user) return <div className="wrap"><div className="panel" style={{maxWidth:360,margin:'40px auto'}}><h2>Ficha de RPG</h2>
    <div className="row"><input style={{width:'100%'}} placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)}/></div>
    <div className="row"><input style={{width:'100%'}} type="password" placeholder="Senha (mín. 6)" value={pw} onChange={e=>setPw(e.target.value)}/></div>
    <div className="row"><button className="pri" onClick={()=>auth(false)}>Entrar</button><button onClick={()=>auth(true)}>Cadastrar</button></div><p className="lbl">{msg}</p></div></div>
  if (open) return <Editor key={open.rec.id} rec={open.rec} mode={open.mode} gmItems={gm?items:undefined} onBack={()=>setOpen(null)} onCampaign={c=>{ setCampView(c); setOpen(null) }}/>
  if (campView) return <CampaignPage userId={user.id} camp={campView} onBack={()=>setCampView(null)} onOpen={(rec,mode)=>setOpen({ rec, mode })}/>

  const groups = Object.entries(group.reduce<Record<string,Rec[]>>((a,r)=>{ (a[r.campaign_id!] ??= []).push(r); return a }, {}))
  return <div className="wrap"><div className="row"><button className={view==='mine'?'pri':''} onClick={()=>setView('mine')}>Minhas fichas</button>
    {gm && <button className={view==='gm'?'pri':''} onClick={()=>setView('gm')}>Área do mestre</button>}<button onClick={()=>supabase.auth.signOut()}>Sair</button></div>
    {view==='gm' && gm
      ? <GmArea userId={user.id} items={items} reloadItems={loadItems} onOpen={(rec,mode)=>setOpen({ rec, mode })}/>
      : <>
        <button className="pri" onClick={create}>+ Nova ficha</button><p className="lbl">{msg}</p>
        {list.map(r=>{ const d = nm(r); return <div className="panel card" key={r.id}><Avatar src={d.foto} name={d.nome} size={52}/>
          <div style={{flex:1,minWidth:140}}><b>{d.nome||'(sem nome)'}</b><div className="lbl">{d.classe||'—'} · nível {d.nivel}</div></div>
          {r.campaign_id && <span className="cpill ok">🏰 {campNames[r.campaign_id] ?? 'Campanha'}</span>}
          <button onClick={()=>setOpen({ rec:r, mode:'owner' })}>Abrir</button><button className="del" onClick={()=>remove(r.id)}>Excluir</button></div> })}
        {!list.length && <p className="lbl">Nenhuma ficha ainda.</p>}
        {groups.map(([cid, rs])=><div key={cid}><h2 style={{marginTop:22}}>Grupo — {campNames[cid] ?? 'Campanha'}</h2>
          {rs.map(r=>{ const d = nm(r); return <div className="panel card" key={r.id}><Avatar src={d.foto} name={d.nome} size={52}/>
            <div style={{flex:1,minWidth:140}}><b>{d.nome||'(sem nome)'}</b><div className="lbl">{d.classe||'—'} · nível {d.nivel} · somente leitura</div></div>
            <button onClick={()=>setOpen({ rec:r, mode:'ro' })}>Ver</button></div> })}</div>)}</>}</div>
}
