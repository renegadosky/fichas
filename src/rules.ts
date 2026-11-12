// ÚNICO lugar com as fórmulas do sistema.
export const ATTRS = ['FOR','AGI','MEN','CAR','VIT'] as const
export type Attr = typeof ATTRS[number]
export const ATTR_NAMES: Record<Attr,string> = { FOR:'Força', AGI:'Agilidade', MEN:'Mente', CAR:'Carisma', VIT:'Vitalidade' }
export const COINS = ['Bronze','Prata','Ouro','Platina','Paládio'] as const
export const RANKS = ['F','E','D','C','B','A','S','SS','SSS'] as const
// Efeitos (poções, habilidades, itens): bônus de atributo, ganho/gasto de PV/Mana/Aura imediato e por turno.
export type Tick = { pv?:number; mana?:number; aura?:number }
export type AttrMap = Partial<Record<Attr,number>>
// dur: texto "3" (turnos) ou "1d4" (sorteado ao usar). Vazio/0 = sem prazo. attr = bônus de atributo enquanto durar.
// now = aplicado na hora de usar (negativo gasta). tick = aplicado a cada "Passar turno" (negativo perde).
export type Fx = { dur?:string; attr?:AttrMap; tick?:Tick; now?:Tick }
export type CondDef = { nome:string; dur:number|null; efeito:string; esq?:number; attr?:AttrMap; tick?:Tick; sk?:Record<string,number> }
export const CONDITIONS: CondDef[] = [
  { nome:'Cansado', dur:3, efeito:'-2 na Esquiva', esq:-2 },
  { nome:'Sono', dur:null, efeito:'-4 em testes de Pontaria', sk:{ 'base-pontaria':-4 } },
  { nome:'Fraco', dur:4, efeito:'-2 na Força', attr:{ FOR:-2 } },
  { nome:'Sangrando', dur:3, efeito:'Perde 2 PV por turno', tick:{ pv:-2 } },
  { nome:'Atordoado', dur:null, efeito:'Perde o próximo turno (Vontade DT 15 cancela)' },
  { nome:'Envenenado', dur:null, efeito:'Perde 1 PV por turno e -1 em testes físicos', tick:{ pv:-1 } },
  { nome:'Cego', dur:null, efeito:'-4 em Pontaria e -2 na Esquiva', esq:-2, sk:{ 'base-pontaria':-4 } },
]
// [nome, tipo, espaços, durabilidade, dano/efeito, bloqueio, mana]
export const CATALOG: readonly (readonly [string,string,number,number,string,number?,number?])[] = [
  // ==================== ARMAS DE CORTE — FERRO ====================
['Espada Curta de Ferro', 'Corte', 2, 26, '1d6 (corte)'],
['Espada Longa de Ferro', 'Corte', 3, 30, '1d8+1 (corte)'],
['Espada Larga de Ferro', 'Corte', 3, 32, '1d10+3 (corte)'],

// ==================== ARCOS — FERRO ====================
['Arco Curto Reforçado', 'Perfuração (Distância)', 2, 18, '1d6 (perfuração)'],
['Arco de Caça Reforçado', 'Perfuração (Distância)', 3, 22, '1d8 (perfuração)'],
['Arco Longo Reforçado', 'Perfuração (Distância)', 4, 25, '1d8+2 (perfuração)'],

// ==================== ADAGAS — FERRO ====================
['Faca de Ferro', 'Corte', 1, 16, '1d3 (corte)'],
['Adaga de Ferro', 'Perfuração', 1, 18, '1d4+1 (estocada)'],
['Punhal de Ferro', 'Perfuração', 1, 20, '1d6 (estocada)'],

// ==================== CAJADOS — FERRO ====================
['Cajado com Ponteira de Ferro', 'Impacto', 2, 22, '1d4+1 (impacto) / +1 em testes de luta'],
['Cajado Reforçado de Ferro', 'Impacto', 3, 25, '1d6 (impacto) / +1 em testes de luta'],
['Cajado de Ferro Maciço', 'Impacto', 4, 28, '1d8 (impacto) / +1 em testes de luta'],

// ==================== ESCUDOS — FERRO ====================
['Escudo Pequeno de Ferro', 'Defesa / Impacto', 1, 24, '1d2 (impacto)', 2],
['Escudo de Ferro', 'Defesa / Impacto', 2, 28, '1d3 (impacto)', 3],
['Escudo Pesado de Ferro', 'Defesa / Impacto', 3, 34, '1d4 (impacto)', 4],

// ==================== ARMADURAS — FERRO ====================
['Peitoral de Ferro', 'Defesa', 3, 28, '+2 defesa'],
['Armadura de Ferro', 'Defesa', 5, 34, '+3 defesa'],
['Armadura Completa de Ferro', 'Defesa', 7, 40, '+5 defesa'],

// ==================== PORRETES — FERRO ====================
['Clava com Reforço de Ferro', 'Impacto', 3, 24, '1d6+1 (impacto)'],
['Maça de Ferro', 'Impacto', 3, 28, '1d8 (impacto)'],
['Maça Pesada de Ferro', 'Impacto', 4, 32, '1d10+1 (impacto)'],

// ==================== LANÇAS — FERRO ====================
['Lança Curta de Ferro', 'Perfuração', 3, 24, '1d6+1 (estocada)'],
['Lança de Ferro', 'Perfuração', 4, 28, '1d8 (estocada)'],
['Pique de Ferro', 'Perfuração', 5, 32, '1d10+1 (estocada)'],
]
export type Equip = { id:string; nome:string; tipo:string; espacos:number; dur:number; durMax:number; dano:string; bloqueio:number; mana:number; equipado:boolean
  atq?:'FOR'|'AGI'; pericia?:string; bonus?:number; bAttr?:AttrMap }  // bAttr = bônus de atributo enquanto equipado e não quebrado; atq = atributo do ataque/dano; pericia = id da perícia usada; bonus = acessório
export type Row = { id:string; [k:string]: any }
export type Sheet = {
  nome:string; jogador?:string; idade:number|null; classe:string; raca?:string; foto?:string; nivel:number; xp:number; attrs:Record<Attr,number>
  pv:number; mana:number; aura:number; conds:Row[]; efeitos?:Row[]; pericias:Row[]; equip:Equip[]; inv:Row[]; habs:Row[]
  moedas:Record<string,number>; pedras:Record<string,number>; historico:string; notas:string }
export const ATTR_BASE = 5          // todos os atributos começam em 5
export const POINTS_PER_LEVEL = 3   // pontos de atributo ganhos por nível (já no nível 1)
export const MAX_LEVEL = 99
// Tabela de XP informada pelo mestre. Interpretada como CUSTO para avançar a cada nível
// (nível 2 = 150, nível 3 = +200...). Se for XP TOTAL acumulado, troque para true.
const XP_CUMULATIVE = false
const XP_COSTS_BOOK = [150,200,250,350,450,600,800,1050,1350,1700,2100,2600,3200,3900,4700,5600,6600,7700,8900,10200,11600,13100,14700,16400,18200,20100,22100,24200,26400]
// Do nível 31 ao 99 o custo continua crescendo no mesmo ritmo do fim da tabela
// (a diferença entre um custo e o anterior sobe +100 a cada nível: ..., 2100, 2200, 2300, 2400...).
const XP_COSTS: number[] = (() => { const c=[...XP_COSTS_BOOK]; let diff=c[c.length-1]-c[c.length-2]
  while (c.length < MAX_LEVEL-1) { diff+=100; c.push(c[c.length-1]+diff) } return c })()
export const XP_THRESHOLDS: number[] = (() => { const t=[0]; XP_COSTS.forEach((c,i)=>t.push(XP_CUMULATIVE?c:t[i]+c)); return t })()
export function levelInfo(xp:number) {
  let nivel = 1; XP_THRESHOLDS.forEach((t,i)=>{ if (xp>=t) nivel=i+1 })
  const proximo = nivel<MAX_LEVEL ? XP_THRESHOLDS[nivel] : null
  return { nivel, proximo, faltam: proximo===null ? 0 : proximo-xp }
}
export const pontos = (s:Sheet) => { const total = POINTS_PER_LEVEL*s.nivel; const gastos = ATTRS.reduce((t,a)=>t+s.attrs[a]-ATTR_BASE,0); return { total, gastos, restantes: total-gastos } }
// Perícias fixas: aparecem em toda ficha, não podem ser renomeadas nem removidas (o atributo e o bônus continuam editáveis).
const SK = (id:string, nome:string, attr:string):Row => ({ id:'base-'+id, nome, attr, base:true })
export const BASE_SKILLS: Row[] = [
  SK('reflexo','Reflexo','AGI'), SK('iniciativa','Iniciativa','AGI'), SK('botanica','Botânica','MEN'), SK('pontaria','Pontaria',''), SK('vontade','Vontade',''),
  SK('acrobacia','Acrobacia','AGI'), SK('atletismo','Atletismo','FOR'), SK('crime','Crime','AGI'), SK('enganacao','Enganação','CAR'),
  SK('furtividade','Furtividade','AGI'), SK('intimidacao','Intimidação','CAR'), SK('intuicao','Intuição','CAR'), SK('investigacao','Investigação','MEN'),
  SK('luta','Luta','FOR'), SK('medicina','Medicina','MEN'), SK('percepcao','Percepção','MEN'), SK('persuasao','Persuasão','CAR'),
  SK('pilotagem','Pilotagem','AGI'), SK('vigor','Vigor','VIT') ]
// Quantidade de d20 pelo valor do atributo: 1-9 = 1d20, 10-19 = 2d20, 20-29 = 3d20 ...
export const diceCount = (v:number) => Math.floor(Math.max(0, v)/10) + 1
// Perícia: o atributo define QUANTOS dados; o valor somado é só o bônus da perícia.
// Passando a ficha (s), entram também os modificadores de condições (ex.: Sono/Cego −4 em Pontaria).
export const skillBonus = (p:Row, s?:Sheet) => (p.bonus||0) + (s ? (skillMods(s)[p.id]||0) : 0)
export const skillDice = (s:Sheet, p:Row) => diceCount(p.attr ? (effAttrs(s)[p.attr as Attr] ?? 0) : 0)
export const skillLabel = (s:Sheet, p:Row) => { const b = skillBonus(p,s); return `${skillDice(s,p)}d20${b ? (b>0?'+':'−')+Math.abs(b) : ''}` }
// Arma: ranged (Distância) usa AGI e Pontaria; o resto usa FOR. Tudo editável por arma.
export const weaponAttr = (e:Equip):Attr => e.atq ?? (/Dist[âa]ncia/i.test(e.tipo) ? 'AGI' : 'FOR')
export const weaponSkillId = (e:Equip) => e.pericia ?? (/Dist[âa]ncia/i.test(e.tipo) ? 'base-pontaria' : '')
// Ataque = nd20 + floor(atributo/3) + bônus da perícia + bônus de acessório.  Dano = dados da arma + atributo.
export function attackInfo(s:Sheet, e:Equip) {
  const attr = weaponAttr(e); const val = effAttrs(s)[attr]
  const sk = s.pericias.find(p=>p.id===weaponSkillId(e))
  return { attr, val, n:diceCount(val), mod:Math.floor(val/3), periciaNome:sk?.nome||'', pericia:sk?skillBonus(sk,s):0, acess:e.bonus||0 }
}
export const rollDice = (n:number, f:number) => Array.from({length:Math.max(1,n)},()=>1+Math.floor(Math.random()*f))
export function parseDice(t:string) { const m=/(\d+)d(\d+)\s*([+-]\s*\d+)?/i.exec(t); return m ? { n:+m[1], f:+m[2], mod:m[3]?+m[3].replace(/\s/g,''):0 } : null }
export const emptySheet = (): Sheet => ({
  nome:'', jogador:'', idade:null, classe:'', nivel:1, xp:0, attrs:{FOR:5,AGI:5,MEN:5,CAR:5,VIT:5}, pv:0, mana:0, aura:0,
  conds:[], efeitos:[], pericias:BASE_SKILLS.map(b=>({...b,bonus:0})), equip:[], inv:[], habs:[],
  moedas:Object.fromEntries(COINS.map(c=>[c,0])), pedras:Object.fromEntries(RANKS.map(r=>[r,0])), historico:'', notas:'' })

const active = (s:Sheet) => s.conds.map(c => CONDITIONS.find(x=>x.nome===c.nome)).filter(Boolean) as CondDef[]
// Item com durabilidade máxima 0 não tem durabilidade (nunca quebra). Só quebra quem tem máximo > 0 e chegou a 0.
export const isBroken = (e:Equip) => e.durMax > 0 && e.dur <= 0
const worn = (s:Sheet) => s.equip.filter(e => e.equipado && !isBroken(e))
// Atributos EFETIVOS = base + condições (ex.: Fraco) + equipamentos vestidos + efeitos ativos (poções etc.). Mínimo 0.
// A base (s.attrs) continua sendo o que o jogador distribui; os bônus somem sozinhos quando o item sai ou o efeito acaba.
export function effAttrs(s:Sheet): Record<Attr,number> {
  const out = { ...s.attrs }
  const add = (m?:AttrMap) => { if (m) for (const a of ATTRS) out[a] += m[a] ?? 0 }
  active(s).forEach(c=>add(c.attr)); worn(s).forEach(e=>add(e.bAttr)); (s.efeitos ?? []).forEach(f=>add(f.attr))
  for (const a of ATTRS) out[a] = Math.max(0, out[a])
  return out
}
function skillMods(s:Sheet): Record<string,number> { const m:Record<string,number> = {}
  active(s).forEach(c=>{ for (const [k,v] of Object.entries(c.sk ?? {})) m[k] = (m[k] ?? 0) + v }); return m }
export function derive(s:Sheet) {
  const e = effAttrs(s)
  const esqMod = active(s).reduce((t,c)=>t+(c.esq ?? 0),0)
  const bloqueio = worn(s).reduce((t,x)=>t+x.bloqueio,0)
  return {
    attrs: e,
    forEfetiva: e.FOR,
    pvMax: e.VIT*5 + s.nivel*5,
    auraMax: e.FOR*10,
    manaMax: e.MEN*10 + worn(s).reduce((t,x)=>t+x.mana,0),
    // Esquiva Seca NÃO é teste (sem dados): média de AGI e VIT (valor fixo) + condições.
    esquiva: Math.floor((e.AGI + e.VIT)/2) + esqMod,
    defesa: 5 + s.nivel + Math.floor(e.VIT/5) + bloqueio,
  }
}
export const clamp = (v:number, min:number, max:number) => Math.max(min, Math.min(max, Math.trunc(Number.isFinite(v)?v:min)))
const key = (x:string) => (x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()
// Garante as perícias fixas SEM perder nada: se a ficha já tem uma perícia criada à mão com o mesmo nome (ex.: "Luta"),
// ela vira a fixa mantendo id, atributo e bônus (armas que usam essa perícia continuam funcionando). As demais ficam como estão.
export function mergeSkills(list:Row[]): Row[] {
  const rows = list.map(r=>({...r})); const used = new Set<number>()
  const fixed = BASE_SKILLS.map(b => {
    let i = rows.findIndex((r,j)=>!used.has(j) && r.id===b.id)
    if (i<0) i = rows.findIndex((r,j)=>!used.has(j) && key(r.nome)===key(b.nome))
    if (i<0) return { ...b, bonus:0 }
    used.add(i); const r = rows[i]
    return { ...r, nome:b.nome, base:true, attr: r.attr || b.attr, bonus: r.bonus ?? 0 }
  })
  return [...fixed, ...rows.filter((_,j)=>!used.has(j))]
}
// Nível vem do XP; máximos recalculados sem restaurar os valores atuais.
export function normalize(s:Sheet): Sheet {
  const xp = Math.max(0, Math.trunc(s.xp||0))
  const attrs = Object.fromEntries(ATTRS.map(a=>[a, Math.max(ATTR_BASE, Math.trunc(s.attrs?.[a]||0))])) as Sheet['attrs']
  const pericias = mergeSkills(s.pericias ?? [])
  const n = { ...s, xp, nivel:levelInfo(xp).nivel, attrs, pericias, efeitos: Array.isArray(s.efeitos) ? s.efeitos : [] }
  const d = derive(n)
  return { ...n, pv:clamp(n.pv,0,d.pvMax), mana:clamp(n.mana,0,d.manaMax), aura:clamp(n.aura,0,d.auraMax) }
}

// ===================== EFEITOS =====================
const RES = ['pv','mana','aura'] as const
const RES_NAME = { pv:'PV', mana:'Mana', aura:'Aura' }
const sg = (n:number) => (n>0 ? '+' : '−') + Math.abs(n)
const newId = () => crypto.randomUUID()
const tickOn = (t?:Tick) => !!t && RES.some(k=>!!t[k])
export const cleanAttr = (m?:AttrMap): AttrMap|undefined => { const o:AttrMap = {}; ATTRS.forEach(a=>{ if (m?.[a]) o[a] = m[a] }); return Object.keys(o).length ? o : undefined }
const cleanTick = (t?:Tick): Tick|undefined => { const o:Tick = {}; RES.forEach(k=>{ if (t?.[k]) o[k] = t[k] }); return Object.keys(o).length ? o : undefined }
// Remove zeros/vazios (não guarda lixo na ficha). Mantém a duração digitada mesmo sem o resto do efeito.
export function cleanFx(f?:Fx): Fx|undefined {
  if (!f) return undefined; const o:Fx = {}; const dur = (f.dur ?? '').trim()
  if (dur) o.dur = dur; const a = cleanAttr(f.attr), tk = cleanTick(f.tick), nw = cleanTick(f.now)
  if (a) o.attr = a; if (tk) o.tick = tk; if (nw) o.now = nw
  return Object.keys(o).length ? o : undefined
}
export const hasFx = (f?:Fx) => !!f && (tickOn(f.now) || tickOn(f.tick) || !!cleanAttr(f.attr))
export function fxText(f?:Fx): string {
  if (!f) return ''; const p:string[] = []
  ATTRS.forEach(a=>{ const v = f.attr?.[a]; if (v) p.push(`${a} ${sg(v)}`) })
  RES.forEach(k=>{ const v = f.now?.[k]; if (v) p.push(`${sg(v)} ${RES_NAME[k]}`) })
  RES.forEach(k=>{ const v = f.tick?.[k]; if (v) p.push(`${sg(v)} ${RES_NAME[k]}/turno`) })
  if (f.dur && (cleanAttr(f.attr) || tickOn(f.tick))) p.push(`por ${f.dur} turno(s)`)
  return p.join(' · ')
}
// Duração: "3" = 3 turnos; "1d4" sorteia ao usar; vazio/0 = sem prazo (fica até ser removido).
export function rollDur(t?:string): { n:number; texto:string } {
  const x = (t ?? '').trim()
  if (/^\d+$/.test(x)) { const n = +x; return { n, texto: n>0 ? `${n} turno(s)` : 'sem prazo' } }
  const dd = parseDice(x)
  if (dd) { const r = rollDice(Math.min(dd.n,50), dd.f); const n = Math.max(1, r.reduce((a,b)=>a+b,0) + dd.mod); return { n, texto:`${x} → ${n} turno(s)` } }
  return { n:0, texto:'sem prazo' }
}
// Custo de habilidade escrito à mão: "10 mana", "5 de vida", "mana 10 + aura 5"...
export function parseCost(text?:string): Tick {
  const x = key(text ?? ''), out:Tick = {}; const map:Record<string,'pv'|'mana'|'aura'> = { mana:'mana', aura:'aura', pv:'pv', vida:'pv', hp:'pv' }
  let found = false
  for (const m of x.matchAll(/(\d+)\s*(?:de\s+)?(mana|aura|pv|vida|hp)\b/g)) { found = true; const k = map[m[2]]; out[k] = (out[k] ?? 0) + +m[1] }
  if (!found) for (const m of x.matchAll(/\b(mana|aura|pv|vida|hp)\s*[:=]?\s*(\d+)/g)) { const k = map[m[1]]; out[k] = (out[k] ?? 0) + +m[2] }
  return out
}
// Custo da habilidade: campos numéricos (cMana/cAura/cPv); se estiverem vazios, tenta ler o texto "custo" antigo.
export function habCost(h:Row): Tick {
  const t:Tick = {}; if (h.cMana>0) t.mana = h.cMana; if (h.cAura>0) t.aura = h.cAura; if (h.cPv>0) t.pv = h.cPv
  return tickOn(t) ? t : parseCost(h.custo)
}
export const costText = (t:Tick) => RES.filter(k=>!!t[k]).map(k=>`${t[k]} ${RES_NAME[k]}`).join(' + ')

type Outcome = { sheet?:Sheet; notes:string[]; error?:string }
// Aplica um efeito: parte imediata agora; bônus de atributo/por turno viram um "efeito ativo" com a duração sorteada.
function applyFx(s:Sheet, nome:string, fx:Fx) {
  const notes:string[] = [], m = derive(s), max = { pv:m.pvMax, mana:m.manaMax, aura:m.auraMax }
  const cur = { pv:s.pv, mana:s.mana, aura:s.aura }; const efeitos = [...(s.efeitos ?? [])]
  RES.forEach(k=>{ const v = fx.now?.[k]; if (v) { cur[k] = clamp(cur[k]+v, 0, max[k]); notes.push(`${sg(v)} ${RES_NAME[k]}`) } })
  const attr = cleanAttr(fx.attr), tick = cleanTick(fx.tick)
  if (attr || tick) { const d = rollDur(fx.dur)
    efeitos.push({ id:newId(), nome, dur:d.n, ...(attr?{attr}:{}), ...(tick?{tick}:{}) })
    notes.push(`${fxText({ attr, tick })} (${d.texto})`) }
  return { ...cur, efeitos, notes }
}
// "Passar turno": aplica o dano/cura por turno (condições e efeitos), diminui as durações e remove o que acabou.
export function advanceTurn(s:Sheet): { sheet:Sheet; notes:string[] } {
  const notes:string[] = [], m = derive(s), max = { pv:m.pvMax, mana:m.manaMax, aura:m.auraMax }
  const cur = { pv:s.pv, mana:s.mana, aura:s.aura }
  const tick = (nome:string, t?:Tick) => { if (!t) return
    RES.forEach(k=>{ const v = t[k]; if (!v) return; cur[k] = clamp(cur[k]+v, 0, max[k])
      notes.push(`${nome}: ${sg(v)} ${RES_NAME[k]}${k==='pv' && cur.pv===0 ? ' (PV chegou a 0!)' : ''}`) }) }
  s.conds.forEach(c=>tick(c.nome, CONDITIONS.find(x=>x.nome===c.nome)?.tick))
  const efs = s.efeitos ?? []
  efs.forEach(f=>tick(f.nome, f.tick))
  s.conds.filter(c=>c.dur===1).forEach(c=>notes.push(`${c.nome} acabou`))
  efs.filter(f=>f.dur===1).forEach(f=>notes.push(`${f.nome} acabou`))
  const conds = s.conds.filter(c=>c.dur!==1).map(c=>c.dur>1 ? { ...c, dur:c.dur-1 } : c)
  const efeitos = efs.filter(f=>f.dur!==1).map(f=>f.dur>1 ? { ...f, dur:f.dur-1 } : f)
  return { sheet: normalize({ ...s, ...cur, conds, efeitos }), notes }
}
// Usar um item com efeito (poção etc.): gasta 1 unidade (some quando acaba) e aplica o efeito.
export function consumeItem(s:Sheet, id:string): Outcome {
  const it = s.inv.find(r=>r.id===id); const nome = it?.nome || 'Item'
  if (!it) return { notes:[], error:'Item não encontrado.' }
  if (!hasFx(it.fx)) return { notes:[], error:`${nome} não tem efeito configurado.` }
  if (!(it.qtd >= 1)) return { notes:[], error:`${nome}: sem unidades.` }
  const r = applyFx(s, nome, it.fx)
  const inv = it.qtd > 1 ? s.inv.map(x=>x.id===id ? { ...x, qtd:x.qtd-1 } : x) : s.inv.filter(x=>x.id!==id)
  return { sheet: normalize({ ...s, pv:r.pv, mana:r.mana, aura:r.aura, efeitos:r.efeitos, inv }), notes:[`${nome} usado`, ...r.notes] }
}
// Usar uma habilidade: confere e gasta Mana/Aura/PV; aplica o efeito (se houver). Não deixa gastar PV até morrer.
export function castHab(s:Sheet, id:string): Outcome {
  const h = s.habs.find(r=>r.id===id); const nome = h?.nome || 'Habilidade'
  if (!h) return { notes:[], error:'Habilidade não encontrada.' }
  const c = habCost(h), mana = c.mana ?? 0, aura = c.aura ?? 0, pv = c.pv ?? 0
  if (mana > s.mana) return { notes:[], error:`${nome}: Mana insuficiente (precisa de ${mana}, você tem ${s.mana}).` }
  if (aura > s.aura) return { notes:[], error:`${nome}: Aura insuficiente (precisa de ${aura}, você tem ${s.aura}).` }
  if (pv > 0 && s.pv <= pv) return { notes:[], error:`${nome}: PV insuficiente (gastaria ${pv} e você tem ${s.pv}).` }
  let next:Sheet = { ...s, mana:s.mana-mana, aura:s.aura-aura, pv:s.pv-pv }
  const notes = [`${nome} usada${costText(c) ? ` — gasto: ${costText(c)}` : ''}`]
  if (hasFx(h.fx)) { const r = applyFx(next, nome, h.fx); next = { ...next, pv:r.pv, mana:r.mana, aura:r.aura, efeitos:r.efeitos }; notes.push(...r.notes) }
  return { sheet: normalize(next), notes }
}
