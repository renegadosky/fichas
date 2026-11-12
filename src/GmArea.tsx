import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { emptySheet, normalize, derive, fxText, hasFx, habCost, costText, cleanAttr, type Sheet } from './rules'
import { FxEditor, AttrFields } from './fx'
import { Avatar } from './ui'
import type { Rec, Campaign, GmItem, GmItemData, Kind, Mode } from './db'

const full = (d:Sheet) => normalize({ ...emptySheet(), ...d })
const TABS: { k:Kind; label:string; novo:string }[] = [
  { k:'player', label:'Personagens', novo:'' }, { k:'npc', label:'NPCs', novo:'+ Novo NPC' }, { k:'inimigo', label:'Inimigos', novo:'+ Novo inimigo' } ]

function SheetCard({ r, onOpen, children }: { r:Rec; onOpen:()=>void; children?:React.ReactNode }) {
  const d = full(r.data), m = derive(d)
  return <div className="panel card"><Avatar src={d.foto} name={d.nome} size={52}/>
    <div style={{flex:1,minWidth:140}}><b>{d.nome||'(sem nome)'}</b><div className="lbl">{d.jogador?`${d.jogador} · `:''}{d.classe||'—'} · nível {d.nivel} · PV {d.pv}/{m.pvMax}</div></div>
    {children}<button onClick={onOpen}>Abrir</button></div>
}

function ItemForm({ item, onSaved, onCancel }: { item:GmItem|null; onSaved:()=>void; onCancel:()=>void }) {
  const [d, setD] = useState<GmItemData>(item?.data ?? { cat:'equip', nome:'', tipo:'', espacos:1, dur:20, durMax:20, dano:'', bloqueio:0, mana:0, bonus:0, qtd:1, desc:'', custo:'' })
  const [err, setErr] = useState('')
  const up = (p:Partial<GmItemData>) => setD(x=>({ ...x, ...p }))
  const n = (k:keyof GmItemData) => <input type="number" value={(d[k] as number)??0} onChange={e=>up({[k]:+e.target.value} as any)}/>
  const save = async () => { if (!d.nome.trim()) return setErr('Dê um nome ao item.')
    const data:GmItemData = d.cat==='equip' ? { ...d, durMax:d.dur, bAttr:cleanAttr(d.bAttr) } : d
    const { error } = item ? await supabase.from('gm_items').update({ data }).eq('id',item.id) : await supabase.from('gm_items').insert({ data })
    if (error) setErr(error.message); else onSaved() }
  return <div className="panel"><h2>{item?'Editar item':'Novo item do mestre'}</h2><div className="row">
    <label className="f"><span className="lbl">Categoria</span><select value={d.cat} onChange={e=>up({cat:e.target.value as any})}><option value="equip">Arma / armadura</option><option value="item">Item comum</option><option value="hab">Habilidade</option></select></label>
    <label className="f"><span className="lbl">Nome</span><input value={d.nome} onChange={e=>up({nome:e.target.value})}/></label>
    {d.cat==='equip' ? <>
      <label className="f"><span className="lbl">Tipo</span><input value={d.tipo??''} onChange={e=>up({tipo:e.target.value})} placeholder="Corte, Perfuração (Distância)…"/></label>
      <label className="f"><span className="lbl">Dano / Efeito</span><input value={d.dano??''} onChange={e=>up({dano:e.target.value})} placeholder="1d8+2 (corte)"/></label>
      <label className="f"><span className="lbl">Atributo do ataque</span><select value={d.atq??''} onChange={e=>up({atq:(e.target.value||undefined) as any})}><option value="">Automático</option><option>FOR</option><option>AGI</option></select></label>
      <label className="f"><span className="lbl">Bônus (acessório)</span>{n('bonus')}</label>
      <label className="f"><span className="lbl">Durabilidade</span>{n('dur')}</label>
      <label className="f"><span className="lbl">Espaços</span>{n('espacos')}</label>
      <label className="f"><span className="lbl">Bloqueio</span>{n('bloqueio')}</label>
      <label className="f"><span className="lbl">Mana máx.</span>{n('mana')}</label>
      <div style={{flexBasis:'100%'}}><span className="lbl">Bônus de atributo (vale enquanto estiver equipado, ex.: luva +3 FOR)</span><AttrFields v={d.bAttr} set={m=>up({bAttr:m})}/></div></> : d.cat==='hab' ? <>
      <label className="f"><span className="lbl">Custo (texto livre)</span><input value={d.custo??''} onChange={e=>up({custo:e.target.value})} placeholder="10 mana"/></label>
      <label className="f"><span className="lbl">Gasta Mana</span>{n('cMana')}</label><label className="f"><span className="lbl">Gasta Aura</span>{n('cAura')}</label><label className="f"><span className="lbl">Gasta PV</span>{n('cPv')}</label>
      <label className="f" style={{flexBasis:'100%'}}><span className="lbl">Efeito (descrição)</span><input value={d.desc??''} onChange={e=>up({desc:e.target.value})}/></label>
      <div style={{flexBasis:'100%'}}><FxEditor fx={d.fx} set={f=>up({fx:f})} title="Efeito ao usar (opcional): buff, cura, dano por turno…"/></div></> : <>
      <label className="f"><span className="lbl">Quantidade</span>{n('qtd')}</label>
      <label className="f" style={{flexBasis:'100%'}}><span className="lbl">Descrição</span><input value={d.desc??''} onChange={e=>up({desc:e.target.value})}/></label>
      <div style={{flexBasis:'100%'}}><FxEditor fx={d.fx} set={f=>up({fx:f})} title="Efeito ao usar (poção, comida…): o jogador clica em Usar, gasta 1 unidade e o efeito entra"/></div></>}</div>
    {err && <p className="neg">{err}</p>}<div className="row"><button className="pri" onClick={save}>Salvar</button><button onClick={onCancel}>Cancelar</button></div></div>
}

export type GmNav = { sub:'camp'|'itens'; cur:Campaign|null; tab:Kind }
export const GM_NAV0: GmNav = { sub:'camp', cur:null, tab:'player' }
// A posição (campanha aberta + aba) fica no App: ao abrir uma ficha esta tela some, e ao voltar precisa reabrir no mesmo lugar.
export function GmArea({ userId, items, reloadItems, onOpen, nav, setNav }: { userId:string; items:GmItem[]; reloadItems:()=>void; onOpen:(r:Rec,m:Mode)=>void; nav:GmNav; setNav:(f:(n:GmNav)=>GmNav)=>void }) {
  const { sub, cur, tab } = nav
  const setSub = (sub:GmNav['sub']) => setNav(n=>({ ...n, sub }))
  const setCur = (cur:Campaign|null) => setNav(n=>({ ...n, cur }))
  const setTab = (tab:Kind) => setNav(n=>({ ...n, tab }))
  const [camps, setCamps] = useState<Campaign[]>([]); const [sheets, setSheets] = useState<Rec[]>([])
  const [msg, setMsg] = useState(''); const [form, setForm] = useState<GmItem|'novo'|null>(null); const [nome, setNome] = useState(''); const [creating, setCreating] = useState(false)

  const loadCamps = async () => { const { data, error } = await supabase.from('campaigns').select('*').eq('owner_id',userId).order('created_at'); if (error) setMsg(error.message); else setCamps(data as Campaign[]) }
  const loadSheets = async () => { if (!cur) return; const { data, error } = await supabase.from('sheets').select('*').eq('campaign_id',cur.id).order('updated_at',{ascending:false}); if (error) setMsg(error.message); else setSheets(data as Rec[]) }
  useEffect(() => { loadCamps() }, [])
  useEffect(() => { loadSheets() }, [cur])

  const createCamp = async () => { if (!nome.trim()) return
    const { data, error } = await supabase.from('campaigns').insert({ nome:nome.trim() }).select().single()
    if (error) return setMsg(error.message); setNome(''); setCreating(false); setCamps(c=>[...c, data as Campaign]) }
  const delCamp = async (c:Campaign) => { if (!confirm(`Excluir a campanha "${c.nome}"?\nOs NPCs e inimigos dela serão apagados. As fichas dos jogadores continuam com eles, só saem da campanha.`)) return
    const { error } = await supabase.from('campaigns').delete().eq('id',c.id); if (error) setMsg(error.message); else { setCur(null); loadCamps() } }
  const newSheet = async (kind:Kind) => { if (!cur) return
    const { data, error } = await supabase.from('sheets').insert({ data:emptySheet(), kind, campaign_id:cur.id }).select().single()
    if (error) setMsg(error.message); else onOpen(data as Rec, 'owner') }
  const dup = async (r:Rec) => { const { error } = await supabase.from('sheets').insert({ data:{ ...r.data, nome:(r.data.nome||'Sem nome')+' (cópia)' }, kind:r.kind, campaign_id:r.campaign_id }); if (error) setMsg(error.message); else loadSheets() }
  const del = async (r:Rec) => { if (!confirm('Excluir esta ficha definitivamente?')) return; await supabase.from('sheets').delete().eq('id',r.id); loadSheets() }
  const delItem = async (g:GmItem) => { if (!confirm(`Excluir "${g.data.nome}"? (fichas que já receberam o item continuam com ele)`)) return; await supabase.from('gm_items').delete().eq('id',g.id); reloadItems() }

  const head = <div className="row"><button className={sub==='camp'?'pri':''} onClick={()=>{ setSub('camp'); setCur(null) }}>Campanhas</button>
    <button className={sub==='itens'?'pri':''} onClick={()=>setSub('itens')}>Itens, armas e habilidades do mestre</button></div>

  if (sub==='itens') return <div>{head}<p className="lbl">Só você vê estes itens. Armas e itens aparecem no Inventário das fichas que você abrir (“+ Item do mestre”); habilidades aparecem na aba Habilidades (“+ Habilidade do mestre”).</p>
    {form ? <ItemForm item={form==='novo'?null:form} onSaved={()=>{ setForm(null); reloadItems() }} onCancel={()=>setForm(null)}/> : <button className="pri" onClick={()=>setForm('novo')}>+ Novo item</button>}
    {items.map(g=><div className="panel card" key={g.id}><div style={{flex:1}}><b>{g.data.nome}</b><div className="lbl">{g.data.cat==='equip'?`${g.data.tipo||'Equipamento'} · ${g.data.dano||'—'}${cleanAttr(g.data.bAttr)?` · ${fxText({attr:g.data.bAttr})}`:''}`:g.data.cat==='hab'?`Habilidade${costText(habCost({id:'x',custo:g.data.custo,cMana:g.data.cMana,cAura:g.data.cAura,cPv:g.data.cPv}))?` · custo ${costText(habCost({id:'x',custo:g.data.custo,cMana:g.data.cMana,cAura:g.data.cAura,cPv:g.data.cPv}))}`:''}${hasFx(g.data.fx)?` · ${fxText(g.data.fx)}`:''}`:`Item · qtd ${g.data.qtd??1}${hasFx(g.data.fx)?` · ${fxText(g.data.fx)}`:''}`}</div></div>
      <button onClick={()=>setForm(g)}>Editar</button><button className="del" onClick={()=>delItem(g)}>Excluir</button></div>)}
    {!items.length && !form && <p className="lbl">Nenhum item criado ainda.</p>}</div>

  if (!cur) return <div>{head}<div className="row">
      {creating ? <><input placeholder="Nome da campanha" value={nome} autoFocus onChange={e=>setNome(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createCamp()}/><button className="pri" onClick={createCamp}>Criar</button><button onClick={()=>setCreating(false)}>Cancelar</button></>
        : <button className="pri" onClick={()=>setCreating(true)}>+ Criar campanha</button>}</div>
    {msg && <p className="neg">{msg}</p>}
    <h2>Entrar em campanha</h2>
    {camps.map(c=><div className="panel card" key={c.id}><div style={{flex:1}}><b>🏰 {c.nome}</b><div className="lbl">Código para os jogadores: <b className="codeb">{c.code}</b></div></div>
      <button className="pri" onClick={()=>{ setCur(c); setTab('player') }}>Entrar</button></div>)}
    {!camps.length && <p className="lbl">Você ainda não tem campanhas. Crie uma e passe o código para os jogadores anexarem as fichas.</p>}</div>

  const list = sheets.filter(r=>r.kind===tab), t = TABS.find(x=>x.k===tab)!
  return <div><div className="row"><button onClick={()=>setCur(null)}>← Campanhas</button><h3 style={{margin:0,flex:1}}>🏰 {cur.nome}</h3>
      <span className="lbl">Código:</span><b className="codeb">{cur.code}</b><button onClick={()=>navigator.clipboard?.writeText(cur.code)} title="Copiar código">📋</button>
      <button className="del" onClick={()=>delCamp(cur)}>Excluir campanha</button></div>
    <nav>{TABS.map(x=><button key={x.k} className={x.k===tab?'on':''} onClick={()=>setTab(x.k)}>{x.label} ({sheets.filter(r=>r.kind===x.k).length})</button>)}</nav>
    {msg && <p className="neg">{msg}</p>}
    {t.novo && <button className="pri" style={{marginBottom:10}} onClick={()=>newSheet(tab)}>{t.novo}</button>}
    {tab!=='player' && <p className="lbl">Os jogadores nunca veem {tab==='npc'?'NPCs':'inimigos'}.</p>}
    {list.map(r=><SheetCard key={r.id} r={r} onOpen={()=>onOpen(r, r.kind==='player'?'gm':'owner')}>
      {r.kind!=='player' && <><button onClick={()=>dup(r)} title="Duplicar">⧉</button><button className="del" onClick={()=>del(r)}>🗑</button></>}</SheetCard>)}
    {!list.length && <p className="lbl">{tab==='player'?'Nenhum jogador anexou ficha a esta campanha ainda. Passe o código acima.':'Nada aqui ainda.'}</p>}</div>
}
