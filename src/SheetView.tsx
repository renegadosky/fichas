import { useState } from 'react'
import { ATTRS, ATTR_NAMES, COINS, RANKS, CONDITIONS, CATALOG, XP_THRESHOLDS, derive, normalize, clamp, levelInfo, pontos, skillBonus, skillDice, skillLabel, diceCount, attackInfo, weaponAttr, weaponSkillId, isBroken, rollDice, parseDice, type Sheet, type Row, type Equip, type Attr } from './rules'

import { uid, fileToAvatar, Avatar } from './ui'
import type { GmItem } from './db'
const ok = (m:string) => confirm(m)
const COLORS: Record<string,string> = { FOR:'#e5484d', AGI:'#4cae4f', MEN:'#2f7cf6', CAR:'#e5b52f', VIT:'#9b59d0' }
const COIN_COLORS = ['#b87333','#a8a8a8','#e5b52f','#bfe3ff','#b28cf0']
const TABS = ['Combate','Perícias','Habilidades','Inventário','Descrição']
const PENT = ['AGI','MEN','VIT','CAR','FOR'] as const

function Num({ v, set, min=0, max }: { v:number; set:(n:number)=>void; min?:number; max?:number }) {
  const put = (n:number) => set(clamp(n, min, max ?? 1e9))
  return <span className="num"><button onClick={()=>put(v-1)}>−</button><input type="number" value={v} onChange={e=>put(+e.target.value)}/><button onClick={()=>put(v+1)}>+</button></span>
}
function Table({ cols, rows, onChange, onAdd }: { cols:{k:string;label:string;t?:'text'|'num'}[]; rows:Row[]; onChange:(r:Row[])=>void; onAdd:()=>void }) {
  const upd = (i:number, k:string, val:any) => onChange(rows.map((r,j)=>j===i?{...r,[k]:val}:r))
  return <div>{rows.length>0&&<div className="tw"><table><thead><tr>{cols.map(c=><th key={c.k}>{c.label}</th>)}<th/></tr></thead><tbody>
    {rows.map((r,i)=><tr key={r.id}>{cols.map(c=><td key={c.k}>{c.t==='num' ? <Num v={r[c.k]??0} set={n=>upd(i,c.k,n)}/> : <input value={r[c.k]??''} onChange={e=>upd(i,c.k,e.target.value)}/>}</td>)}
      <td><button className="del" onClick={()=>ok('Remover este registro?')&&onChange(rows.filter((_,j)=>j!==i))}>🗑</button></td></tr>)}</tbody></table></div>}
    <button className="pri" onClick={onAdd}>+ Adicionar</button></div>
}
const F = ({ l, children }: { l:string; children:React.ReactNode }) => <label className="f"><span className="lbl">{l}</span>{children}</label>

function Bar({ label, v, max, set, color, step }: { label:string; v:number; max:number; set:(n:number)=>void; color:string; step:number }) {
  const pct = max ? 100*v/max : 0
  return <div className="bw"><div className="bl">{label}</div>
    <div className="bb" style={{background:`linear-gradient(90deg,${color} ${pct}%,#1a2233 ${pct}%)`}}>
      <button onClick={()=>set(v-step)} aria-label={`−${step}`}>«</button><button onClick={()=>set(v-1)} aria-label="−1">‹</button>
      <span className="bv"><input type="number" value={v} onChange={e=>set(+e.target.value)}/>/ {max}</span>
      <button onClick={()=>set(v+1)} aria-label="+1">›</button><button onClick={()=>set(v+step)} aria-label={`+${step}`}>»</button></div></div>
}

export function SheetView({ s, setS, ro=false, gmItems }: { s:Sheet; setS:(f:(s:Sheet)=>Sheet)=>void; ro?:boolean; gmItems?:GmItem[] }) {
  const d = derive(s), lv = levelInfo(s.xp), pt = pontos(s)
  const [tab, setTab] = useState('Combate'); const [step, setStep] = useState(5); const [gain, setGain] = useState(0)
  const [log, setLog] = useState<string[]>([]); const [openEq, setOpenEq] = useState<string|null>(null); const [expr, setExpr] = useState('1d20')
  const P = (p:Partial<Sheet>) => { if (!ro) setS(x=>normalize({ ...x, ...p })) }  // somente leitura: nada altera a ficha
  const say = (t:string) => setLog(l=>[t,...l].slice(0,20))
  const sum = (r:number[]) => r.reduce((a,b)=>a+b,0)
  const sgn = (v:number) => v>0 ? '+' : '−'
  // Teste: nd20 (n vem do atributo) + partes fixas. Ex.: "[7 + 12 + 3] + 9 (AGI/3) + 5 (Pontaria) = 36"
  const test = (n:number, parts:[string,number][]) => { const r = rollDice(n,20); const ex = parts.filter(p=>p[1]!==0)
    const total = sum(r) + ex.reduce((t,p)=>t+p[1],0)
    return { total, text:`[${r.join(' + ')}]${ex.map(([l,v])=>` ${sgn(v)} ${Math.abs(v)}${l?` (${l})`:''}`).join('')} = ${total}` } }
  const rollAttr = (a:Attr) => { const v = a==='FOR'?d.forEfetiva:s.attrs[a]; say(`${ATTR_NAMES[a]} (${diceCount(v)}d20): ${test(diceCount(v),[]).text}`) }
  const rollSkill = (p:Row) => say(`${p.nome||'Perícia'} (${skillLabel(s,p)}): ${test(skillDice(s,p),[['bônus',skillBonus(p)]]).text}`)
  const rollIni = () => ini && rollSkill(ini)
  // Ataque + dano juntos numa mensagem só.
  const attack = (e:Equip) => { const a = attackInfo(s,e), dd = parseDice(e.dano)
    const atk = test(a.n,[[`${a.attr}/3`,a.mod],[a.periciaNome||'perícia',a.pericia],['acessório',a.acess]])
    let dmg = ''
    if (dd) { const r = rollDice(Math.min(dd.n,50),dd.f); const parts:[string,number][] = [['arma',dd.mod],[a.attr,a.val]].filter(p=>p[1]!==0) as any
      dmg = ` | Dano: [${r.join(' + ')}]${parts.map(([l,v])=>` ${sgn(v)} ${Math.abs(v as number)} (${l})`).join('')} = ${sum(r)+parts.reduce((t,p)=>t+(p[1] as number),0)}` }
    say(`${e.nome} — Ataque (${a.n}d20): ${atk.text}${dmg}`) }
  const roll = (label:string, n:number, f:number, mod=0) => { const r = rollDice(n,f); const t = sum(r)+mod
    say(`${label}: ${r.join(' + ')}${mod?(mod>0?' + ':' − ')+Math.abs(mod):''} = ${t}`) }
  const rollExpr = () => { const dd = parseDice(expr); dd ? roll(expr.trim(), Math.min(dd.n,50), dd.f, dd.mod) : say('Use o formato 2d6+3') }
  const upP = (i:number, p:Partial<Row>) => P({ pericias:s.pericias.map((x,j)=>j===i?{...x,...p}:x) })
  const upE = (i:number, p:Partial<Equip>) => P({ equip:s.equip.map((x,j)=>j===i?{...x,...p}:x) })
  // Muda a durabilidade máxima: se o item estava cheio (ou é novo, 0/0), continua cheio; nunca fica acima do novo máximo.
  const setDurMax = (i:number, n:number) => P({ equip:s.equip.map((x,j)=>j!==i?x:{ ...x, durMax:n, dur: x.dur>=x.durMax || x.dur>n ? n : x.dur }) })
  const setAttr = (a:Attr, n:number) => P({ attrs:{...s.attrs,[a]:clamp(n,5,s.attrs[a]+Math.max(0,pt.restantes))} })
  const ini = s.pericias.find(p=>p.nome==='Iniciativa')
  const addCond = (nome:string) => { const c = CONDITIONS.find(x=>x.nome===nome)!; P({ conds:[...s.conds,{ id:uid(), nome, dur:c.dur??0 }] }) }
  const passTurn = () => { P({ conds:s.conds.filter(c=>c.dur!==1).map(c=>c.dur>1?{...c,dur:c.dur-1}:c) })
    const lost = s.conds.filter(c=>c.nome==='Sangrando'||c.nome==='Envenenado').map(c=>`${c.nome} −${c.nome==='Sangrando'?2:1} PV`)
    say(`Turno passou${lost.length?' — aplique: '+lost.join(', '):''}`) }
  const addCatalog = (i:number) => { const c = CATALOG[i]
    P({ equip:[...s.equip,{ id:uid(), nome:c[0], tipo:c[1], espacos:c[2], dur:c[3], durMax:c[3], dano:c[4], bloqueio:c[5]??0, mana:c[6]??0, equipado:false }] }) }
  const addGm = (id:string) => { const g = gmItems?.find(x=>x.id===id)?.data; if (!g) return
    if (g.cat==='equip') P({ equip:[...s.equip,{ id:uid(), nome:g.nome, tipo:g.tipo??'', espacos:g.espacos??0, dur:g.dur??0, durMax:g.durMax??g.dur??0, dano:g.dano??'', bloqueio:g.bloqueio??0, mana:g.mana??0, equipado:false, ...(g.atq?{atq:g.atq}:{}), ...(g.bonus?{bonus:g.bonus}:{}) }] })
    else if (g.cat==='hab') P({ habs:[...s.habs,{ id:uid(), nome:g.nome, custo:g.custo??'', desc:g.desc??'' }] })
    else P({ inv:[...s.inv,{ id:uid(), nome:g.nome, qtd:g.qtd??1, desc:g.desc??'' }] }) }
  const base = XP_THRESHOLDS[lv.nivel-1], pct = lv.proximo===null ? 100 : 100*(s.xp-base)/(lv.proximo-base)
  const equipped = s.equip.filter(e=>e.equipado)

  const skills = <section className="panel"><h2>Perícias</h2>
    <div className="sk shd"><span style={{width:36}}/><span className="sn">Perícia</span><span style={{width:66}}>Atrib.</span><span style={{width:56}}>Bônus</span><span style={{width:62}}>Rolagem</span></div>
    {s.pericias.map((p,i)=><div className="sk" key={p.id}>
      <button className="dc" title="nd20 (pelo atributo) + bônus" onClick={()=>rollSkill(p)}>🎲</button>
      {p.base?<b className="sn">{p.nome}</b>:<input className="sn" placeholder="Nome" value={p.nome??''} onChange={e=>upP(i,{nome:e.target.value})}/>}
      <select value={p.attr??''} onChange={e=>upP(i,{attr:e.target.value})}><option value="">—</option>{ATTRS.map(a=><option key={a}>{a}</option>)}</select>
      <input type="number" className="bn" value={p.bonus??0} onChange={e=>upP(i,{bonus:clamp(+e.target.value,-99,999)})}/>
      <b className="tot">{skillLabel(s,p)}</b>
      {!p.base&&<button className="del dc" onClick={()=>ok('Remover perícia?')&&P({pericias:s.pericias.filter((_,j)=>j!==i)})}>🗑</button>}</div>)}
    <button className="pri" style={{marginTop:8}} onClick={()=>P({pericias:[...s.pericias,{id:uid(),nome:'',attr:'',bonus:0}]})}>+ Perícia</button></section>

  return <div className={ro?'ro':''}>
    <section className="panel hdr">
      <div className="ph"><label className={ro?'':'clk'} title={ro?'':'Trocar foto'}><Avatar src={s.foto} name={s.nome} size={76}/>
        {!ro&&<input type="file" accept="image/*" onChange={async e=>{ const f=e.target.files?.[0]; e.target.value=''; if(!f) return; try { P({foto:await fileToAvatar(f)}) } catch { alert('Não consegui ler essa imagem.') } }}/>}</label>
        {!ro&&s.foto&&<button className="xph" title="Remover foto" onClick={()=>P({foto:''})}>✕</button>}</div>
      <F l="Personagem"><input value={s.nome} onChange={e=>P({nome:e.target.value})} placeholder="Nome"/></F>
      <F l="Classe"><input value={s.classe} onChange={e=>P({classe:e.target.value})}/></F>
      <F l="Idade"><input type="number" value={s.idade??''} onChange={e=>P({idade:e.target.value===''?null:clamp(+e.target.value,0,10000)})}/></F>
      <F l="Raça"><input value={s.raca??'Humano'} onChange={e=>P({raca:e.target.value})}/></F></section>

    <div className="sheet">
      <div className="left">
        <section className="panel"><h2>Atributos <small className={pt.restantes<0?'neg':''}>{pt.restantes} pontos livres</small></h2>
          {ATTRS.map(a=><div className="al" key={a} style={{'--c':COLORS[a]} as any}>
            <button className="dc" title="nd20 pelo atributo" onClick={()=>rollAttr(a)}>🎲</button>
            <b className="aa">{a}</b><span className="lbl an">{ATTR_NAMES[a]}{a==='FOR'&&d.forEfetiva!==s.attrs.FOR?` (ef. ${d.forEfetiva})`:''}</span>
            <span className="num"><button onClick={()=>setAttr(a,s.attrs[a]-1)}>−</button><input type="number" value={s.attrs[a]} onChange={e=>setAttr(a,+e.target.value)}/><button onClick={()=>setAttr(a,s.attrs[a]+1)}>+</button></span></div>)}</section>

        <div className="xrow"><div className="lv">Nível <b>{lv.nivel}</b></div>
          <div style={{flex:1}}><div className="xb"><i style={{width:pct+'%'}}/></div><span className="lbl">{lv.proximo===null?'Nível máximo':`${s.xp} / ${lv.proximo} XP`}</span></div>
          <input type="number" min={0} value={gain} onChange={e=>setGain(Math.max(0,+e.target.value))} aria-label="XP ganho" style={{width:64}}/><button onClick={()=>{P({xp:s.xp+gain});setGain(0)}}>+ XP</button></div>
        <div className="tiles"><div className="tile"><span className="lbl">Defesa</span><b>{d.defesa}</b></div><div className="tile" title="Valor fixo, não é um teste"><span className="lbl">Esquiva Seca</span><b>{d.esquiva}</b></div>
          <button className="tile" title="Rolar iniciativa" onClick={rollIni} disabled={!ini}><span className="lbl">Iniciativa</span><b>{ini?skillLabel(s,ini):'—'}</b></button></div>

        <Bar label="PV" v={s.pv} max={d.pvMax} set={n=>P({pv:clamp(n,0,d.pvMax)})} color="#b3262b" step={step}/>
        <Bar label="MANA" v={s.mana} max={d.manaMax} set={n=>P({mana:clamp(n,0,d.manaMax)})} color="#2f6fe0" step={step}/>
        <Bar label="AURA" v={s.aura} max={d.auraMax} set={n=>P({aura:clamp(n,0,d.auraMax)})} color="#c99a1c" step={step}/>
        <div className="qty"><span className="lbl">« e » alteram de</span><input type="number" min={1} value={step} onChange={e=>setStep(Math.max(1,+e.target.value))}/></div>
      </div>

      <div className="mid only-d">{skills}</div>

      <div className="right">
        <nav>{TABS.map(t=><button key={t} className={`${t===tab?'on':''} ${t==='Perícias'?'only-m':''}`} onClick={()=>setTab(t)}>{t}</button>)}</nav>

        {tab==='Combate' && <section className="panel">
          <div className="row"><input style={{flex:1}} value={expr} onChange={e=>setExpr(e.target.value)} onKeyDown={e=>e.key==='Enter'&&rollExpr()} placeholder="Rolar dados (ex.: 2d6+3)"/><button className="pri" onClick={rollExpr}>🎲</button></div>
          <h2 style={{marginTop:14}}>Ataques</h2>
          {equipped.length>0 ? equipped.map(e=>{ const dd=parseDice(e.dano), a=attackInfo(s,e); return <div className="wp" key={e.id}><div style={{flex:1}}><b>{e.nome}{isBroken(e)&&' (quebrado)'}</b><div className="lbl">{e.dano} · {a.n}d20+{a.mod+a.pericia+a.acess} · dano +{a.val} ({a.attr})</div></div>{dd&&<button className="pri" title="Ataque + dano" onClick={()=>attack(e)}>🎲</button>}</div>}) : <p className="lbl">Equipe uma arma na aba Inventário.</p>}
          <div className="row" style={{marginTop:8}}>{ini&&<button onClick={rollIni}>🎲 Iniciativa</button>}<button onClick={passTurn} disabled={!s.conds.length}>⏭ Passar turno</button></div>
          <h2 style={{marginTop:14}}>Condições</h2>
          <div className="chips">{CONDITIONS.map(c=><button key={c.nome} title={c.efeito} onClick={()=>addCond(c.nome)}>+ {c.nome}</button>)}</div>
          {s.conds.map((c,i)=><div className="wp" key={c.id}><div style={{flex:1}}><b>{c.nome}</b><div className="lbl">{CONDITIONS.find(x=>x.nome===c.nome)?.efeito}</div></div>
            <Num v={c.dur} set={n=>P({conds:s.conds.map((x,j)=>j===i?{...x,dur:n}:x)})}/><button className="del" onClick={()=>P({conds:s.conds.filter((_,j)=>j!==i)})}>✕</button></div>)}</section>}

        {tab==='Perícias' && <div className="only-m">{skills}</div>}

        {tab==='Habilidades' && <section className="panel"><Table cols={[{k:'nome',label:'Nome'},{k:'custo',label:'Custo'},{k:'desc',label:'Efeito'}]} rows={s.habs} onChange={r=>P({habs:r})} onAdd={()=>P({habs:[...s.habs,{id:uid(),nome:'',custo:'',desc:''}]})}/>
          {!!gmItems?.some(g=>g.data.cat==='hab')&&!ro&&<div className="row" style={{marginTop:8}}><select value="" onChange={e=>e.target.value&&addGm(e.target.value)} title="Só o mestre enxerga estas habilidades"><option value="">+ Habilidade do mestre…</option>{gmItems.filter(g=>g.data.cat==='hab').map(g=><option key={g.id} value={g.id}>{g.data.nome}</option>)}</select></div>}</section>}

        {tab==='Inventário' && <>
          <section className="panel"><h2>Equipamentos</h2>
            {s.equip.map((e,i)=>{ const dd=parseDice(e.dano), op=openEq===e.id; return <div className="eq" key={e.id} style={isBroken(e)?{opacity:.55}:undefined}>
              <div className="row"><input type="checkbox" className="ck" checked={e.equipado} onChange={ev=>upE(i,{equipado:ev.target.checked})} title="Equipado"/>
                <div style={{flex:1,minWidth:120}}><b>{e.nome||'(sem nome)'}</b><div className="lbl">{e.dano} · {e.durMax>0?`${e.dur}/${e.durMax}`:'sem durabilidade'}</div></div>
                {dd&&<button title="Ataque + dano" onClick={()=>attack(e)}>🎲</button>}<button onClick={()=>setOpenEq(op?null:e.id)}>{op?'▲':'✎'}</button></div>
              {op&&<div className="eqf"><F l="Nome"><input value={e.nome} onChange={ev=>upE(i,{nome:ev.target.value})}/></F><F l="Tipo"><input value={e.tipo} onChange={ev=>upE(i,{tipo:ev.target.value})}/></F>
                <F l="Dano / Efeito"><input value={e.dano} onChange={ev=>upE(i,{dano:ev.target.value})}/></F>
                <F l="Durabilidade atual"><Num v={e.dur} max={e.durMax} set={n=>upE(i,{dur:n})}/></F><F l="Durabilidade máx. (0 = sem durabilidade)"><Num v={e.durMax} set={n=>setDurMax(i,n)}/></F><F l="Espaços"><Num v={e.espacos} set={n=>upE(i,{espacos:n})}/></F>
                <F l="Atributo (ataque/dano)"><select value={weaponAttr(e)} onChange={ev=>upE(i,{atq:ev.target.value as 'FOR'|'AGI'})}><option>FOR</option><option>AGI</option></select></F>
                <F l="Perícia do ataque"><select value={weaponSkillId(e)} onChange={ev=>upE(i,{pericia:ev.target.value})}><option value="">—</option>{s.pericias.map(p=><option key={p.id} value={p.id}>{p.nome||'(sem nome)'}</option>)}</select></F>
                <F l="Bônus (acessório)"><Num v={e.bonus??0} min={-99} set={n=>upE(i,{bonus:n})}/></F>
                <F l="Bloqueio"><Num v={e.bloqueio} set={n=>upE(i,{bloqueio:n})}/></F><F l="Mana máx."><Num v={e.mana} set={n=>upE(i,{mana:n})}/></F>
                <button className="del eqrm" onClick={()=>ok('Remover item?')&&P({equip:s.equip.filter((_,j)=>j!==i)})}>🗑 Remover</button></div>}</div>})}
            <div className="row"><select value="" onChange={e=>e.target.value!==''&&addCatalog(+e.target.value)}><option value="">+ Item do livro…</option>{CATALOG.map((c,i)=><option key={c[0]} value={i}>{c[0]}</option>)}</select>
              {!!gmItems?.some(g=>g.data.cat!=='hab')&&!ro&&<select value="" onChange={e=>e.target.value&&addGm(e.target.value)} title="Só o mestre enxerga estes itens"><option value="">+ Item do mestre…</option>{gmItems.filter(g=>g.data.cat!=='hab').map(g=><option key={g.id} value={g.id}>{g.data.nome} ({g.data.cat==='equip'?'equip.':'item'})</option>)}</select>}
              <button onClick={()=>{const id=uid();P({equip:[...s.equip,{id,nome:'',tipo:'',espacos:0,dur:0,durMax:0,dano:'',bloqueio:0,mana:0,equipado:false}]});setOpenEq(id)}}>+ Personalizado</button></div></section>
          <section className="panel"><h2>Itens</h2><Table cols={[{k:'nome',label:'Item'},{k:'qtd',label:'Qtd',t:'num'},{k:'desc',label:'Descrição'}]} rows={s.inv} onChange={r=>P({inv:r})} onAdd={()=>P({inv:[...s.inv,{id:uid(),nome:'',qtd:1,desc:''}]})}/></section>
          <section className="panel"><h2>Moedas</h2><div className="coins">{COINS.map((c,i)=><div className="coin" key={c}><span><i style={{background:COIN_COLORS[i]}}/>{c}</span><Num v={s.moedas[c]??0} set={n=>P({moedas:{...s.moedas,[c]:n}})}/></div>)}</div>
            <details><summary>Pedras Mágicas</summary><div className="coins">{RANKS.map(r=><div className="coin" key={r}><span><b>{r}</b></span><Num v={s.pedras[r]??0} set={n=>P({pedras:{...s.pedras,[r]:n}})}/></div>)}</div></details></section></>}

        {tab==='Descrição' && <section className="panel"><h2>Histórico</h2><textarea value={s.historico} onChange={e=>P({historico:e.target.value})}/><h2>Anotações</h2><textarea value={s.notas} onChange={e=>P({notas:e.target.value})}/></section>}
      </div>
    </div>
    <details className="panel hist"><summary>Histórico de rolagens ({log.length})</summary>{log.length?log.map((l,i)=><div className="lg" key={i}>{l}</div>):<p className="lbl">Nenhuma rolagem ainda.</p>}</details>
    {log.length>0&&<div className="toast" key={log.length+log[0]}>{log[0]}</div>}
  </div>
}
