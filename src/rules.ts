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
  atq?:'FOR'|'AGI'; pericia?:string; bonus?:number }  // atq = atributo do ataque/dano; pericia = id da perícia usada; bonus = acessório
export type Row = { id:string; [k:string]: any }
export type Sheet = {
  nome:string; idade:number|null; classe:string; raca?:string; foto?:string; nivel:number; xp:number; attrs:Record<Attr,number>
  pv:number; mana:number; aura:number; conds:Row[]; pericias:Row[]; equip:Equip[]; inv:Row[]; habs:Row[]
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
export const skillBonus = (p:Row) => p.bonus||0
export const skillDice = (s:Sheet, p:Row) => diceCount(p.attr ? s.attrs[p.attr as Attr] : 0)
export const skillLabel = (s:Sheet, p:Row) => { const b = skillBonus(p); return `${skillDice(s,p)}d20${b ? (b>0?'+':'−')+Math.abs(b) : ''}` }
// Arma: ranged (Distância) usa AGI e Pontaria; o resto usa FOR. Tudo editável por arma.
export const weaponAttr = (e:Equip):Attr => e.atq ?? (/Dist[âa]ncia/i.test(e.tipo) ? 'AGI' : 'FOR')
export const weaponSkillId = (e:Equip) => e.pericia ?? (/Dist[âa]ncia/i.test(e.tipo) ? 'base-pontaria' : '')
// Ataque = nd20 + floor(atributo/3) + bônus da perícia + bônus de acessório.  Dano = dados da arma + atributo.
export function attackInfo(s:Sheet, e:Equip) {
  const attr = weaponAttr(e); const val = attr==='FOR' ? derive(s).forEfetiva : s.attrs[attr]
  const sk = s.pericias.find(p=>p.id===weaponSkillId(e))
  return { attr, val, n:diceCount(val), mod:Math.floor(val/3), periciaNome:sk?.nome||'', pericia:sk?skillBonus(sk):0, acess:e.bonus||0 }
}
export const rollDice = (n:number, f:number) => Array.from({length:Math.max(1,n)},()=>1+Math.floor(Math.random()*f))
export function parseDice(t:string) { const m=/(\d+)d(\d+)\s*([+-]\s*\d+)?/i.exec(t); return m ? { n:+m[1], f:+m[2], mod:m[3]?+m[3].replace(/\s/g,''):0 } : null }
export const emptySheet = (): Sheet => ({
  nome:'', idade:null, classe:'', nivel:1, xp:0, attrs:{FOR:5,AGI:5,MEN:5,CAR:5,VIT:5}, pv:0, mana:0, aura:0,
  conds:[], pericias:BASE_SKILLS.map(b=>({...b,bonus:0})), equip:[], inv:[], habs:[],
  moedas:Object.fromEntries(COINS.map(c=>[c,0])), pedras:Object.fromEntries(RANKS.map(r=>[r,0])), historico:'', notas:'' })

const active = (s:Sheet) => s.conds.map(c => CONDITIONS.find(x=>x.nome===c.nome)).filter(Boolean) as typeof CONDITIONS
// Item com durabilidade máxima 0 não tem durabilidade (nunca quebra). Só quebra quem tem máximo > 0 e chegou a 0.
export const isBroken = (e:Equip) => e.durMax > 0 && e.dur <= 0
const worn = (s:Sheet) => s.equip.filter(e => e.equipado && !isBroken(e))
export function derive(s:Sheet) {
  const mod = (k:'esq'|'FOR') => active(s).reduce((t,c)=>t+(c[k]??0),0)
  const FOR = s.attrs.FOR + mod('FOR')
  const bloqueio = worn(s).reduce((t,e)=>t+e.bloqueio,0)
  return {
    forEfetiva: FOR,
    pvMax: s.attrs.VIT*5 + s.nivel*5,
    auraMax: FOR*10,
    manaMax: s.attrs.MEN*10 + worn(s).reduce((t,e)=>t+e.mana,0),
    // Esquiva Seca NÃO é teste (sem dados): média de AGI e VIT (valor fixo) + condições.
    esquiva: Math.floor((s.attrs.AGI + s.attrs.VIT)/2) + mod('esq'),
    defesa: 5 + s.nivel + Math.floor(s.attrs.VIT/5) + bloqueio,
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
  const n = { ...s, xp, nivel:levelInfo(xp).nivel, attrs, pericias }
  const d = derive(n)
  return { ...n, pv:clamp(n.pv,0,d.pvMax), mana:clamp(n.mana,0,d.manaMax), aura:clamp(n.aura,0,d.auraMax) }
}
