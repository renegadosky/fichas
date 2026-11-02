import { describe, it, expect } from 'vitest'
import { emptySheet, derive, normalize, levelInfo, pontos, parseDice, skillBonus, skillDice, skillLabel, diceCount, attackInfo, CATALOG, type Equip } from './rules'
const shield = (b:number, dur=5):Equip => ({id:'1',nome:'E',tipo:'',espacos:1,dur,durMax:5,dano:'',bloqueio:b,mana:0,equipado:true})
const base = () => { const s = emptySheet(); s.attrs = {FOR:0,AGI:0,MEN:0,CAR:0,VIT:0}; return s }
describe('fórmulas', () => {
  it('PV = VIT*5 + 5 por nível', () => { const s=base(); s.nivel=3; expect(derive(s).pvMax).toBe(15); s.nivel=4; expect(derive(s).pvMax).toBe(20); s.attrs.VIT=6; expect(derive(s).pvMax).toBe(50) })
  it('Aura e Mana', () => { const s=base(); s.attrs.FOR=6; s.attrs.MEN=5; const d=derive(s); expect(d.auraMax).toBe(60); expect(d.manaMax).toBe(50) })
  it('Defesa', () => { const s=base(); s.nivel=2; s.attrs.VIT=7; expect(derive(s).defesa).toBe(8)
    s.equip=[shield(2)]; expect(derive(s).defesa).toBe(10); s.equip=[shield(2,0)]; expect(derive(s).defesa).toBe(8) })
  it('Esquiva seca = AGI/3 + bônus de Reflexo + condições', () => { const s=base(); s.attrs.AGI=9; s.pericias.find(p=>p.nome==='Reflexo')!.bonus=5
    expect(derive(s).esquiva).toBe(8); s.conds=[{id:'a',nome:'Cansado'},{id:'b',nome:'Cego'}]; expect(derive(s).esquiva).toBe(4) })
  it('Cajado +50 mana', () => { const s=base(); s.equip=[{...shield(0),mana:50}]; expect(derive(s).manaMax).toBe(50) })
  it('Normalizar não restaura recursos', () => { const s=base(); s.attrs.VIT=10; s.pv=30; expect(normalize(s).pv).toBe(30) })
  it('Ficha nova: atributos 5 e perícias base', () => { const s=emptySheet(); expect(Object.values(s.attrs)).toEqual([5,5,5,5,5]); expect(s.pericias.length).toBe(5) })
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
  it('catálogo tem 15 itens', () => expect(CATALOG.length).toBe(15))
})
