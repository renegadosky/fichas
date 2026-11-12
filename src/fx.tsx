import { ATTRS, cleanAttr, cleanFx, type Fx, type AttrMap, type Attr } from './rules'

// Campo numérico que aceita negativo e fica vazio quando é 0 (não guarda lixo na ficha).
function NI({ v, set, ph }: { v?:number; set:(n:number|undefined)=>void; ph?:string }) {
  return <input type="number" value={v ?? ''} placeholder={ph ?? '0'} onChange={e=>{ const t = e.target.value; set(t==='' ? undefined : Math.trunc(+t)) }}/>
}
const L = ({ l, children }: { l:string; children:React.ReactNode }) => <label className="f"><span className="lbl">{l}</span>{children}</label>

// Bônus de atributo (+/−). Usado em equipamentos ("enquanto equipado") e dentro do editor de efeitos.
export function AttrFields({ v, set }: { v?:AttrMap; set:(m:AttrMap|undefined)=>void }) {
  return <div className="fxg">{ATTRS.map((a:Attr)=><L key={a} l={a}><NI v={v?.[a]} set={n=>set(cleanAttr({ ...v, [a]:n }))}/></L>)}</div>
}

// Editor de efeito: duração, bônus de atributo, efeito imediato e efeito por turno.
export function FxEditor({ fx, set, title }: { fx?:Fx; set:(f:Fx|undefined)=>void; title:string }) {
  const f: Fx = fx ?? {}
  const put = (p:Partial<Fx>) => set(cleanFx({ ...f, ...p }))
  const res = (k:'now'|'tick') => (['pv','mana','aura'] as const).map(r=>
    <L key={r} l={r==='pv'?'PV':r==='mana'?'Mana':'Aura'}><NI v={f[k]?.[r]} set={n=>put(k==='now' ? { now:{ ...f.now, [r]:n } } : { tick:{ ...f.tick, [r]:n } })}/></L>)
  return <div className="fxe"><div className="lbl"><b>{title}</b></div>
    <div className="fxg d1"><L l="Duração (turnos ou dado)"><input value={f.dur ?? ''} placeholder="3 ou 1d4" onChange={e=>put({ dur:e.target.value })}/></L></div>
    <div className="lbl">Atributos enquanto durar (use − para penalidade)</div><AttrFields v={f.attr} set={a=>put({ attr:a })}/>
    <div className="lbl">Imediato ao usar (+ recupera, − gasta)</div><div className="fxg">{res('now')}</div>
    <div className="lbl">A cada turno (+ recupera, − perde)</div><div className="fxg">{res('tick')}</div></div>
}
