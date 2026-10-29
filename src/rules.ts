// ÚNICO lugar com as fórmulas do sistema.
export const ATTRS = ['FOR','AGI','MEN','CAR','VIT'] as const
export type Attr = typeof ATTRS[number]
export const ATTR_NAMES: Record<Attr,string> = { FOR:'Força', AGI:'Agilidade', MEN:'Mente', CAR:'Carisma', VIT:'Vitalidade' }
export const COINS = ['Bronze','Prata','Ouro','Platina','Paládio'] as const
export const RANKS = ['F','E','D','C','B','A','S','SS','SSS'] as const
export const CONDITIONS: { nome:string; dur:number|null; efeito:string; esq?:number; FOR?:number }[] = [
  { nome:'Cansado', dur:3, efeito:'-2 na Esquiva', esq:-2 },
  { nome:'Sono', dur:null, efeito:'-4 em testes de Pontaria' },
  { nome:'Fraco', dur:4, efeito:'-2 na Força', FOR:-2 },
  { nome:'Sangrando', dur:3, efeito:'Perde 2 PV por turno' },
  { nome:'Atordoado', dur:null, efeito:'Perde o próximo turno (Vontade DT 15 cancela)' },
  { nome:'Envenenado', dur:null, efeito:'Perde 1 PV por turno e -1 em testes físicos' },
  { nome:'Cego', dur:null, efeito:'-4 em Pontaria e -2 na Esquiva', esq:-2 },
]
// [nome, tipo, espaços, durabilidade, dano/efeito, bloqueio, mana]
export const CATALOG: readonly (readonly [string,string,number,number,string,number?,number?])[] = [
  // ==================== ARMAS DE CORTE — FERRO ====================
['Espada Curta de Ferro', 'FOR ou AGI', 'Corte', 2, 26, '1d6 (corte)'],
['Espada Longa de Ferro', 'FOR ou AGI', 'Corte', 3, 30, '1d8 +1 (corte)'],
['Espada Larga de Ferro', 'FOR', 'Corte', 3, 32, '1d10 +3 (corte)'],

// ==================== ARCOS — FERRO ====================
['Arco Curto Reforçado', 'AGI', 'Perfuração (Distância)', 2, 18, '1d6 (perfuração)'],
['Arco de Caça Reforçado', 'AGI', 'Perfuração (Distância)', 3, 22, '1d8 (perfuração)'],
['Arco Longo Reforçado', 'AGI ou FOR', 'Perfuração (Distância)', 4, 25, '1d8 +2 (perfuração)'],

// ==================== ADAGAS — FERRO ====================
['Faca de Ferro', 'AGI', 'Corte', 1, 16, '1d3 (corte)'],
['Adaga de Ferro', 'AGI', 'Perfuração', 1, 18, '1d4 +1 (estocada)'],
['Punhal de Ferro', 'AGI', 'Perfuração', 1, 20, '1d6 (estocada)'],

// ==================== CAJADOS — FERRO ====================
['Cajado com Ponteira de Ferro', 'FOR ou AGI', 'Impacto', 2, 22, '1d4 +1 (impacto)', '+1 em testes de luta'],
['Cajado Reforçado de Ferro', 'FOR ou AGI', 'Impacto', 3, 25, '1d6 (impacto)', '+1 em testes de luta'],
['Cajado de Ferro Maciço', 'FOR', 'Impacto', 4, 28, '1d8 (impacto)', '+1 em testes de luta'],

// ==================== ESCUDOS — FERRO ====================
['Escudo Pequeno de Ferro', 'FOR', 'Defesa / Impacto', 1, 24, '+2 bloqueio', '1d2 (impacto)'],
['Escudo de Ferro', 'FOR', 'Defesa / Impacto', 2, 28, '+3 bloqueio', '1d3 (impacto)'],
['Escudo Pesado de Ferro', 'FOR', 'Defesa / Impacto', 3, 34, '+4 bloqueio', '1d4 (impacto)'],

// ==================== ARMADURAS — FERRO ====================
['Peitoral de Ferro', 'FOR', 'Defesa', 3, 28, '+2 defesa'],
['Armadura de Ferro', 'FOR', 'Defesa', 5, 34, '+3 defesa'],
['Armadura Completa de Ferro', 'FOR', 'Defesa', 7, 40, '+5 defesa',],

// ==================== PORRETES — FERRO ====================
['Clava com Reforço de Ferro', 'FOR', 'Impacto', 3, 24, '1d6 +1 (impacto)'],
['Maça de Ferro', 'FOR', 'Impacto', 3, 28, '1d8 (impacto)'],
['Maça Pesada de Ferro', 'FOR', 'Impacto', 4, 32, '1d10 +1 (impacto)'],

// ==================== LANÇAS — FERRO ====================
['Lança Curta de Ferro', 'FOR ou AGI', 'Perfuração', 3, 24, '1d6 +1 (estocada)'],
['Lança de Ferro', 'FOR ou AGI', 'Perfuração', 4, 28, '1d8 (estocada)'],
['Pique de Ferro', 'FOR', 'Perfuração', 5, 32, '1d10 +1 (estocada)'],
]
export type Equip = { id:string; nome:string; tipo:string; espacos:number; dur:number; durMax:number; dano:string; bloqueio:number; mana:number; equipado:boolean }
export type Row = { id:string; [k:string]: any }
export type Sheet = {
  nome:string; idade:number|null; classe:string; nivel:number; xp:number; attrs:Record<Attr,number>
  pv:number; mana:number; aura:number; conds:Row[]; pericias:Row[]; equip:Equip[]; inv:Row[]; habs:Row[]
  moedas:Record<string,number>; pedras:Record<string,number>; historico:string; notas:string }
export const ATTR_BASE = 5          // todos os atributos começam em 5
export const POINTS_PER_LEVEL = 3   // pontos de atributo ganhos por nível (a partir do nível 2)
export const MAX_LEVEL = 30
// Tabela de XP informada pelo mestre. Interpretada como CUSTO para avançar a cada nível
// (nível 2 = 150, nível 3 = +200...). Se for XP TOTAL acumulado, troque para true.
const XP_CUMULATIVE = false
const XP_COSTS = [150,200,250,350,450,600,800,1050,1350,1700,2100,2600,3200,3900,4700,5600,6600,7700,8900,10200,11600,13100,14700,16400,18200,20100,22100,24200,26400]
export const XP_THRESHOLDS: number[] = (() => { const t=[0]; XP_COSTS.forEach((c,i)=>t.push(XP_CUMULATIVE?c:t[i]+c)); return t })()
export function levelInfo(xp:number) {
  let nivel = 1; XP_THRESHOLDS.forEach((t,i)=>{ if (xp>=t) nivel=i+1 })
  const proximo = nivel<MAX_LEVEL ? XP_THRESHOLDS[nivel] : null
  return { nivel, proximo, faltam: proximo===null ? 0 : proximo-xp }
}
export const pontos = (s:Sheet) => { const total = POINTS_PER_LEVEL*(s.nivel-1); const gastos = ATTRS.reduce((t,a)=>t+s.attrs[a]-ATTR_BASE,0); return { total, gastos, restantes: total-gastos } }
// Perícias presentes no livro (únicas citadas); a lista completa ainda será fornecida.
export const BASE_SKILLS: Row[] = [
  { id:'base-reflexo', nome:'Reflexo', attr:'AGI', base:true }, { id:'base-iniciativa', nome:'Iniciativa', attr:'AGI', base:true },
  { id:'base-botanica', nome:'Botânica', attr:'MEN', base:true }, { id:'base-pontaria', nome:'Pontaria', attr:'', base:true }, { id:'base-vontade', nome:'Vontade', attr:'', base:true } ]
export const skillTotal = (s:Sheet, p:Row) => (p.attr ? s.attrs[p.attr as Attr] : 0) + (p.bonus||0)
export const rollDice = (n:number, f:number) => Array.from({length:Math.max(1,n)},()=>1+Math.floor(Math.random()*f))
export function parseDice(t:string) { const m=/(\d+)d(\d+)\s*([+-]\s*\d+)?/i.exec(t); return m ? { n:+m[1], f:+m[2], mod:m[3]?+m[3].replace(/\s/g,''):0 } : null }
export const emptySheet = (): Sheet => ({
  nome:'', idade:null, classe:'', nivel:1, xp:0, attrs:{FOR:5,AGI:5,MEN:5,CAR:5,VIT:5}, pv:0, mana:0, aura:0,
  conds:[], pericias:BASE_SKILLS.map(b=>({...b,bonus:0})), equip:[], inv:[], habs:[],
  moedas:Object.fromEntries(COINS.map(c=>[c,0])), pedras:Object.fromEntries(RANKS.map(r=>[r,0])), historico:'', notas:'' })

const active = (s:Sheet) => s.conds.map(c => CONDITIONS.find(x=>x.nome===c.nome)).filter(Boolean) as typeof CONDITIONS
const worn = (s:Sheet) => s.equip.filter(e => e.equipado && e.dur > 0)
export function derive(s:Sheet) {
  const mod = (k:'esq'|'FOR') => active(s).reduce((t,c)=>t+(c[k]??0),0)
  const FOR = s.attrs.FOR + mod('FOR')
  const bloqueio = worn(s).reduce((t,e)=>t+e.bloqueio,0)
  const reflexo = s.pericias.find(p=>p.nome==='Reflexo')?.bonus ?? 0
  return {
    forEfetiva: FOR,
    pvMax: s.attrs.VIT*5 + s.nivel*5,
    auraMax: FOR*10,
    manaMax: s.attrs.MEN*10 + worn(s).reduce((t,e)=>t+e.mana,0),
    esquiva: s.attrs.AGI + reflexo + mod('esq'),
    defesa: 5 + s.nivel + Math.floor(s.attrs.VIT/5) + bloqueio,
  }
}
export const clamp = (v:number, min:number, max:number) => Math.max(min, Math.min(max, Math.trunc(Number.isFinite(v)?v:min)))
// Nível vem do XP; máximos recalculados sem restaurar os valores atuais.
export function normalize(s:Sheet): Sheet {
  const xp = Math.max(0, Math.trunc(s.xp||0))
  const attrs = Object.fromEntries(ATTRS.map(a=>[a, Math.max(ATTR_BASE, Math.trunc(s.attrs?.[a]||0))])) as Sheet['attrs']
  const have = new Set(s.pericias.map(p=>p.id))
  const pericias = [...BASE_SKILLS.filter(b=>!have.has(b.id)).map(b=>({...b,bonus:0})), ...s.pericias]
  const n = { ...s, xp, nivel:levelInfo(xp).nivel, attrs, pericias }
  const d = derive(n)
  return { ...n, pv:clamp(n.pv,0,d.pvMax), mana:clamp(n.mana,0,d.manaMax), aura:clamp(n.aura,0,d.auraMax) }
}
