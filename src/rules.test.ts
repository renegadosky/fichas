import { describe, it, expect } from 'vitest'
import { MAX_LEVEL, XP_THRESHOLDS, emptySheet, derive, normalize, levelInfo, pontos, parseDice, skillBonus, skillDice, skillLabel, diceCount, attackInfo, CATALOG, mergeSkills, isBroken, BASE_SKILLS, effAttrs, advanceTurn, consumeItem, castHab, habCost, parseCost, rollDur, fxText, cleanFx, hasFx, type Equip } from './rules'
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
  it('equipamento vestido soma atributo e sai ao desequipar ou quebrar', () => {
    const s=base(); s.attrs.FOR=5; s.equip=[{...shield(0),bAttr:{FOR:3,VIT:2},equipado:true}]
    expect(effAttrs(s).FOR).toBe(8); expect(derive(s).auraMax).toBe(80); expect(derive(s).pvMax).toBe(15)
    s.equip[0].equipado=false; expect(effAttrs(s).FOR).toBe(5)
    s.equip[0].equipado=true; s.equip[0].dur=0; expect(effAttrs(s).FOR).toBe(5) })
  it('condições: Sangrando tira 2 PV por turno e some no fim; Fraco reduz FOR', () => {
    const s=base(); s.nivel=1; s.attrs.VIT=10; s.pv=40; s.conds=[{id:'a',nome:'Sangrando',dur:2}]
    const r1=advanceTurn(s); expect(r1.sheet.pv).toBe(38); expect(r1.sheet.conds[0].dur).toBe(1)
    const r2=advanceTurn(r1.sheet); expect(r2.sheet.pv).toBe(36); expect(r2.sheet.conds.length).toBe(0); expect(r2.notes.join(' ')).toContain('Sangrando acabou')
    const f=base(); f.attrs.FOR=5; f.conds=[{id:'f',nome:'Fraco',dur:4}]; expect(effAttrs(f).FOR).toBe(3) })
  it('Envenenado sem prazo continua; PV não passa de 0', () => {
    const s=base(); s.attrs.VIT=1; s.pv=1; s.conds=[{id:'e',nome:'Envenenado',dur:0}]
    const r=advanceTurn(s); expect(r.sheet.pv).toBe(0); expect(r.sheet.conds.length).toBe(1); expect(r.notes.join(' ')).toContain('PV chegou a 0')
    expect(advanceTurn(r.sheet).sheet.pv).toBe(0) })
  it('poção de força: some ao beber, dá +FOR pelo prazo e expira', () => {
    const s=base(); s.attrs.FOR=5; s.inv=[{id:'p',nome:'Poção de Força',qtd:1,fx:{attr:{FOR:4},dur:'2'}}]
    const r=consumeItem(s,'p'); expect(r.error).toBe(undefined); expect(r.sheet!.inv.length).toBe(0)
    expect(effAttrs(r.sheet!).FOR).toBe(9); expect(r.sheet!.efeitos![0].dur).toBe(2); expect(s.attrs.FOR).toBe(5)
    const t1=advanceTurn(r.sheet!).sheet; expect(effAttrs(t1).FOR).toBe(9)
    const t2=advanceTurn(t1); expect(effAttrs(t2.sheet).FOR).toBe(5); expect(t2.sheet.efeitos!.length).toBe(0) })
  it('item com várias unidades: gasta 1 por vez; sem unidade não usa', () => {
    const s=base(); s.attrs.VIT=10; s.pv=10; s.inv=[{id:'c',nome:'Cura',qtd:2,fx:{now:{pv:20}}}]
    const a=consumeItem(s,'c').sheet!; expect(a.pv).toBe(30); expect(a.inv[0].qtd).toBe(1); expect(a.efeitos!.length).toBe(0)
    const b=consumeItem(a,'c').sheet!; expect(b.inv.length).toBe(0); expect(consumeItem(b,'c').error).toBeTruthy()
    const z=base(); z.inv=[{id:'x',nome:'Vazio',qtd:0,fx:{now:{pv:5}}}]; expect(consumeItem(z,'x').error).toBeTruthy() })
  it('cura imediata respeita o máximo; regeneração por turno funciona', () => {
    const s=base(); s.attrs.VIT=2; s.pv=9; s.inv=[{id:'r',nome:'Regen',qtd:1,fx:{now:{pv:50},tick:{pv:3},dur:'2'}}]
    const a=consumeItem(s,'r').sheet!; expect(a.pv).toBe(15); expect(a.efeitos![0].tick).toEqual({pv:3})
    const b=advanceTurn({...a,pv:4}); expect(b.sheet.pv).toBe(7) })
  it('duração em dado fica dentro do intervalo', () => { for (let i=0;i<50;i++){ const n=rollDur('1d4').n; expect(n>=1&&n<=4).toBe(true) } expect(rollDur('').n).toBe(0); expect(rollDur('3').n).toBe(3) })
  it('habilidade gasta mana/aura/PV, confere recursos e pode aplicar efeito', () => {
    const s=base(); s.attrs.MEN=5; s.attrs.FOR=5; s.attrs.VIT=10; s.mana=30; s.aura=20; s.pv=30
    s.habs=[{id:'h',nome:'Bala',cMana:10,cAura:5,cPv:4}]
    const r=castHab(s,'h').sheet!; expect([r.mana,r.aura,r.pv]).toEqual([20,15,26])
    expect(castHab({...s,mana:5},'h').error).toContain('Mana insuficiente'); expect(castHab({...s,aura:2},'h').error).toContain('Aura insuficiente'); expect(castHab({...s,pv:4},'h').error).toContain('PV insuficiente')
    s.habs=[{id:'b',nome:'Fúria',cAura:5,fx:{attr:{FOR:2},dur:'3'}}]; const f=castHab(s,'b').sheet!; expect(effAttrs(f).FOR).toBe(7); expect(f.aura).toBe(15) })
  it('custo antigo escrito em texto continua funcionando', () => {
    expect(parseCost('10 de mana')).toEqual({mana:10}); expect(parseCost('5 PV + 3 Aura')).toEqual({pv:5,aura:3}); expect(parseCost('mana 7')).toEqual({mana:7}); expect(parseCost('50')).toEqual({})
    expect(habCost({id:'1',custo:'10 mana'})).toEqual({mana:10}); expect(habCost({id:'1',custo:'10 mana',cMana:3})).toEqual({mana:3}) })
  it('Sono e Cego tiram 4 de Pontaria; fichas antigas sem efeitos/jogador carregam', () => {
    const s=emptySheet(); s.conds=[{id:'s',nome:'Sono',dur:0}]; const p=s.pericias.find(x=>x.id==='base-pontaria')!; expect(skillBonus(p,s)).toBe(-4); expect(skillBonus(p)).toBe(0)
    const old:any={...emptySheet()}; delete old.efeitos; delete old.jogador; const n=normalize(old); expect(n.efeitos).toEqual([]); expect(n.attrs.FOR).toBe(5) })
  it('texto e limpeza do efeito', () => {
    expect(fxText({attr:{FOR:3},dur:'1d4',tick:{pv:-2},now:{mana:10}})).toBe('FOR +3 · +10 Mana · −2 PV/turno · por 1d4 turno(s)')
    expect(cleanFx({attr:{FOR:0},now:{pv:0}})).toBe(undefined); expect(cleanFx({dur:' 3 ',now:{pv:5,mana:0}})).toEqual({dur:'3',now:{pv:5}}); expect(hasFx({dur:'3'})).toBe(false) })
})
