import { describe, it, expect } from 'vitest'
import { MAX_LEVEL, XP_THRESHOLDS, emptySheet, derive, normalize, levelInfo, pontos, parseDice, skillBonus, skillDice, skillLabel, diceCount, attackInfo, CATALOG, mergeSkills, isBroken, BASE_SKILLS, type Equip } from './rules'
const shield = (b:number, dur=5):Equip => ({id:'1',nome:'E',tipo:'',espacos:1,dur,durMax:5,dano:'',bloqueio:b,mana:0,equipado:true})
const base = () => { const s = emptySheet(); s.attrs = {FOR:0,AGI:0,MEN:0,CAR:0,VIT:0}; return s }
describe('fórmulas', () => {
  it('PV = VIT*5 + 5 por nível', () => { const s=base(); s.nivel=3; expect(derive(s).pvMax).toBe(15); s.nivel=4; expect(derive(s).pvMax).toBe(20); s.attrs.VIT=6; expect(derive(s).pvMax).toBe(50) })
  it('Aura e Mana', () => { const s=base(); s.attrs.FOR=6; s.attrs.MEN=5; const d=derive(s); expect(d.auraMax).toBe(60); expect(d.manaMax).toBe(50) })
  it('Defesa', () => { const s=base(); s.nivel=2; s.attrs.VIT=7; expect(derive(s).defesa).toBe(8)
    s.equip=[shield(2)]; expect(derive(s).defesa).toBe(10); s.equip=[shield(2,0)]; expect(derive(s).defesa).toBe(8) })
  it('Esquiva seca = média de AGI e VIT + condições', () => { const s=base(); s.attrs.AGI=9; s.attrs.VIT=6
    expect(derive(s).esquiva).toBe(7); s.conds=[{id:'a',nome:'Cansado'},{id:'b',nome:'Cego'}]; expect(derive(s).esquiva).toBe(3) })
  it('Cajado +50 mana', () => { const s=base(); s.equip=[{...shield(0),mana:50}]; expect(derive(s).manaMax).toBe(50) })
  it('Normalizar não restaura recursos', () => { const s=base(); s.attrs.VIT=10; s.pv=30; expect(normalize(s).pv).toBe(30) })
  it('Ficha nova: atributos 5 e perícias base', () => { const s=emptySheet(); expect(Object.values(s.attrs)).toEqual([5,5,5,5,5]); expect(s.pericias.length).toBe(BASE_SKILLS.length); expect(BASE_SKILLS.length).toBe(19) })
  it('XP define o nível', () => { expect(levelInfo(0).nivel).toBe(1); expect(levelInfo(150).nivel).toBe(2); expect(levelInfo(349).nivel).toBe(2); expect(levelInfo(350).nivel).toBe(3)
    const s=emptySheet(); s.xp=150; expect(normalize(s).nivel).toBe(2) })
  it('3 pontos por nível, já no nível 1', () => { const s=emptySheet(); expect(pontos(s).restantes).toBe(3); s.nivel=3; expect(pontos(s).total).toBe(9); s.attrs.FOR=8; expect(pontos(s).restantes).toBe(6) })
  it('quantidade de d20 pelo atributo', () => { expect([0,1,9,10,19,20,29,30,40,50,59].map(diceCount)).toEqual([1,1,1,2,2,3,3,4,5,6,6]) })
  it('perícia: dados pelo atributo, soma só o bônus', () => { const s=emptySheet(); s.attrs.AGI=29; const p={id:'x',attr:'AGI',bonus:5}
    expect(skillDice(s,p)).toBe(3); expect(skillBonus(p)).toBe(5); expect(skillLabel(s,p)).toBe('3d20+5'); expect(skillDice(s,{id:'y',attr:'',bonus:0})).toBe(1) })
  it('ataque: nd20 + atributo/3 + perícia + acessório', () => { const s=emptySheet(); s.attrs.AGI=29; s.pericias.find(p=>p.id==='base-pontaria')!.bonus=4
    const arco:Equip={...shield(0),nome:'Arco',tipo:'Perfuração (Distância)',dano:'1d8+2',bonus:1}
    expect(attackInfo(s,arco)).toMatchObject({attr:'AGI',val:29,n:3,mod:9,pericia:4,acess:1})
    const esp:Equip={...shield(0),tipo:'Corte'}; expect(attackInfo(s,esp)).toMatchObject({attr:'FOR',val:5,n:1,mod:1,pericia:0}) })
  it('dados e perícia', () => { expect(parseDice('1d4+1 (corte)')).toEqual({n:1,f:4,mod:1}); expect(parseDice('2 Dano')).toBeNull()
    expect(parseDice('1d8+2')).toEqual({n:1,f:8,mod:2}) })
  it('catálogo não está vazio', () => expect(CATALOG.length).toBeGreaterThan(0))
  it('nível vai até 99 e o XP só cresce', () => { expect(MAX_LEVEL).toBe(99); expect(XP_THRESHOLDS.length).toBe(99)
    for (let i=1;i<XP_THRESHOLDS.length;i++) expect(XP_THRESHOLDS[i]).toBeGreaterThan(XP_THRESHOLDS[i-1])
    expect(levelInfo(XP_THRESHOLDS[98]).nivel).toBe(99); expect(levelInfo(XP_THRESHOLDS[98]+1e9).nivel).toBe(99); expect(levelInfo(XP_THRESHOLDS[98]).proximo).toBeNull()
    expect(XP_THRESHOLDS[30]-XP_THRESHOLDS[29]).toBe(28700) })
  it('perícias fixas: ficha antiga ganha as novas sem perder nada', () => {
    const s=emptySheet(); s.pericias=[{id:'base-reflexo',nome:'Reflexo',attr:'AGI',bonus:3,base:true},{id:'u1',nome:'Luta',attr:'',bonus:4},{id:'u2',nome:'intuicao',attr:'MEN',bonus:2},{id:'u3',nome:'Culinária',attr:'MEN',bonus:1}]
    const r=normalize(s).pericias
    expect(r.length).toBe(BASE_SKILLS.length+1)
    const luta=r.find(p=>p.nome==='Luta')!; expect(luta).toMatchObject({id:'u1',bonus:4,base:true,attr:'FOR'})
    expect(r.find(p=>p.id==='u2')).toMatchObject({nome:'Intuição',bonus:2,attr:'MEN',base:true})
    expect(r.find(p=>p.id==='base-reflexo')!.bonus).toBe(3)
    expect(r.find(p=>p.id==='u3')).toMatchObject({nome:'Culinária',bonus:1}); expect(r.find(p=>p.id==='u3')!.base).toBeFalsy()
    expect(r.filter(p=>p.nome==='Luta').length).toBe(1)
    expect(mergeSkills(r)).toEqual(r); expect(normalize({...s,pericias:r}).pericias).toEqual(r) })
  it('durabilidade: máx 0 = sem durabilidade (não quebra); máx>0 e atual 0 = quebrado', () => {
    expect(isBroken({...shield(2,0),durMax:0})).toBe(false); expect(isBroken(shield(2,0))).toBe(true); expect(isBroken(shield(2,3))).toBe(false)
    const s=base(); s.equip=[{...shield(2,0),durMax:0}]; expect(derive(s).defesa).toBe(8); s.equip=[shield(2,0)]; expect(derive(s).defesa).toBe(6) })
})
