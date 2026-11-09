import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { emptySheet, normalize, derive } from './rules'
import { Avatar } from './ui'
import type { Rec, Mode } from './db'

// Página da campanha (visão do jogador): fichas do grupo. O banco só entrega as que o dono liberou.
export function CampaignPage({ userId, camp, onBack, onOpen }: { userId:string; camp:{ id:string; nome:string }; onBack:()=>void; onOpen:(r:Rec,m:Mode)=>void }) {
  const [sheets, setSheets] = useState<Rec[]>([]); const [msg, setMsg] = useState(''); const [loading, setLoading] = useState(true)
  useEffect(() => { supabase.from('sheets').select('*').eq('campaign_id',camp.id).eq('kind','player').order('updated_at',{ascending:false})
    .then(({ data, error }: any) => { setLoading(false); if (error) setMsg(error.message); else setSheets(data as Rec[]) }) }, [camp.id])
  const mine = sheets.filter(r=>r.owner_id===userId), others = sheets.filter(r=>r.owner_id!==userId)
  const card = (r:Rec, own:boolean) => { const d = normalize({ ...emptySheet(), ...r.data }), m = derive(d)
    return <div className="panel card" key={r.id}><Avatar src={d.foto} name={d.nome} size={56}/>
      <div style={{flex:1,minWidth:140}}><b>{d.nome||'(sem nome)'}</b>{own&&<span className="lbl"> (você)</span>}
        <div className="lbl">{d.classe||'—'} · {d.raca||'Humano'} · nível {d.nivel} · PV {d.pv}/{m.pvMax}</div></div>
      <button onClick={()=>onOpen(r, own?'owner':'ro')}>{own?'Abrir':'Ver'}</button></div> }
  return <div className="wrap"><div className="topbar"><button onClick={onBack}>← Voltar</button><h3 style={{margin:0}}>🏰 {camp.nome}</h3></div>
    {msg && <p className="neg">{msg}</p>}
    <h2>Minhas fichas na campanha</h2>{mine.map(r=>card(r,true))}{!mine.length&&!loading&&<p className="lbl">Nenhuma ficha sua está nesta campanha.</p>}
    <h2 style={{marginTop:22}}>Jogadores do grupo</h2>{others.map(r=>card(r,false))}
    {!others.length&&!loading&&<p className="lbl">Nenhum jogador liberou a ficha ainda. Cada um libera em ⚙ Configurações da própria ficha.</p>}
    <p className="lbl" style={{marginTop:16}}>Você vê só as fichas que os donos liberaram, e somente para leitura.</p></div>
}
