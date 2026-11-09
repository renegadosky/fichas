import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import { normalize, emptySheet, type Sheet } from './rules'
import { SheetView } from './SheetView'
import type { Rec, Mode, GmItem, Campaign } from './db'

export function Editor({ rec, mode, gmItems, onBack }: { rec:Rec; mode:Mode; gmItems?:GmItem[]; onBack:()=>void }) {
  const ro = mode === 'ro', isOwner = mode === 'owner'
  const [s, setS] = useState<Sheet>(() => normalize({ ...emptySheet(), ...rec.data }))
  const [status, setStatus] = useState('Salvo')
  const ver = useRef(rec.version); const dirty = useRef(false); const timer = useRef<any>(); const latest = useRef(s)
  const [conflict, setConflict] = useState(false)

  // ---- campanha / configurações (só o dono de ficha de jogador) ----
  const [cid, setCid] = useState<string|null>(rec.campaign_id); const [camp, setCamp] = useState<Campaign|null>(null)
  const [vis, setVis] = useState(rec.visible_to_party)
  const [attach, setAttach] = useState(false); const [code, setCode] = useState(''); const [busy, setBusy] = useState(false)
  const [cfg, setCfg] = useState(false); const [err, setErr] = useState('')
  useEffect(() => { if (!cid) { setCamp(null); return }
    supabase.from('campaigns').select('*').eq('id',cid).maybeSingle().then(({data}) => setCamp(data as Campaign|null)) }, [cid])
  const join = async () => { setErr(''); setBusy(true)
    const { data, error } = await supabase.rpc('join_campaign', { p_sheet:rec.id, p_code:code.trim() }); setBusy(false)
    if (error) return setErr(error.message)
    setCid(data as string); setAttach(false); setCode('') }
  const leave = async () => { if (!confirm('Sair da campanha? O mestre e os outros jogadores deixam de ver esta ficha.')) return
    const { error } = await supabase.rpc('leave_campaign', { p_sheet:rec.id }); if (error) return setErr(error.message)
    setCid(null); setVis(false); setCfg(false) }
  const setVisible = async (v:boolean) => { const { error } = await supabase.from('sheets').update({ visible_to_party:v }).eq('id',rec.id); if (error) setErr(error.message); else setVis(v) }

  // ---- salvamento com controle de versão ----
  const save = async () => {
    setStatus('Salvando…')
    const { data, error } = await supabase.from('sheets').update({ data:latest.current, version:ver.current+1 }).eq('id',rec.id).eq('version',ver.current).select('version')
    if (error) return setStatus('Erro ao salvar: '+error.message+' — tentando de novo…') , void (timer.current = setTimeout(save, 4000))
    if (!data?.length) { setConflict(true); setStatus('Conflito'); return }
    ver.current = data[0].version; dirty.current = false; setStatus('Salvo às '+new Date().toLocaleTimeString())
  }
  const change = (f:(s:Sheet)=>Sheet) => { if (ro) return; setS(prev => { const n = f(prev); latest.current = n; return n }); dirty.current = true; setStatus('Alterações não sincronizadas…'); clearTimeout(timer.current); timer.current = setTimeout(save, 700) }
  const reload = async () => { const { data } = await supabase.from('sheets').select('*').eq('id',rec.id).single(); if (data) { ver.current = data.version; latest.current = data.data; setS(normalize({ ...emptySheet(), ...data.data })); dirty.current = false; setConflict(false); setStatus('Atualizado') } }
  useEffect(() => {
    const ch = supabase.channel('sheet-'+rec.id).on('postgres_changes',{ event:'UPDATE', schema:'public', table:'sheets', filter:`id=eq.${rec.id}` }, p => {
      const n = p.new as Rec; if (n.version <= ver.current) return
      if (dirty.current) setConflict(true); else { ver.current = n.version; latest.current = n.data; setS(normalize({ ...emptySheet(), ...n.data })); setStatus('Atualizado por outro usuário') } }).subscribe()
    return () => { supabase.removeChannel(ch) } }, [])

  const badge = rec.kind==='npc' ? 'NPC' : rec.kind==='inimigo' ? 'Inimigo' : null
  return <div className="wrap"><div className="topbar"><button onClick={onBack}>← Voltar</button>
    {isOwner && rec.kind==='player' && (cid
      ? <span className="cpill ok">🏰 {camp?.nome ?? 'Campanha'}<button className="mini" onClick={leave} title="Sair da campanha">Sair</button></span>
      : <>
        <button className={`cbtn ${attach?'on':''}`} onClick={()=>{ setAttach(a=>!a); setErr('') }}>📎 Anexar a uma campanha</button>
        {attach && <input className="code" placeholder="Código da campanha" value={code} maxLength={10} autoFocus
          onChange={e=>setCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&code.trim().length>=4&&join()}/>}
        {attach && code.trim().length>=4 && <button className="cbtn go" disabled={busy} onClick={join}>{busy?'Entrando…':'✔ Entrar na campanha'}</button>}</>)}
    {badge && <span className="cpill">👁 {badge} — só o mestre vê</span>}
    {isOwner && rec.kind==='player' && <button className={`cfg ${cfg?'on':''}`} onClick={()=>setCfg(c=>!c)}>⚙ Configurações</button>}</div>
    {err && <div className="warn">{err}</div>}
    {cfg && isOwner && rec.kind==='player' && <section className="panel cfgp"><h2>Configurações da ficha</h2>
      <label className="sw"><input type="checkbox" checked={vis} disabled={!cid} onChange={e=>setVisible(e.target.checked)}/>
        <span><b>Deixar os outros jogadores da campanha verem esta ficha</b><br/><span className="lbl">Eles só conseguem olhar, nunca editar. {cid?'':'Anexe a ficha a uma campanha para usar esta opção.'}</span></span></label>
      <p className="lbl">{cid ? <>O mestre da campanha <b>{camp?.nome}</b> sempre vê e pode editar as fichas anexadas.</> : 'Sem campanha, só você enxerga esta ficha.'}</p></section>}
    {mode==='gm' && <div className="info">Você está editando a ficha de um jogador como mestre.</div>}
    {ro && <div className="info">Somente leitura — você está vendo a ficha de outro jogador.</div>}
    {conflict && <div className="warn">Esta ficha foi alterada por outra pessoa enquanto você editava. <button onClick={reload}>Carregar versão mais recente (descarta minhas alterações pendentes)</button></div>}
    <SheetView s={s} setS={change} ro={ro} gmItems={ro?undefined:gmItems}/>{!ro&&<div className="st">{status}</div>}</div>
}
