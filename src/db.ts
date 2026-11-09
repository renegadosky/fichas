import type { Sheet } from './rules'

export type Kind = 'player' | 'npc' | 'inimigo'
// 'owner' = dono edita | 'gm' = mestre editando ficha de jogador da campanha | 'ro' = só leitura
export type Mode = 'owner' | 'gm' | 'ro'

export type Rec = { id:string; owner_id:string; data:Sheet; version:number; kind:Kind; campaign_id:string|null; visible_to_party:boolean }
export type Campaign = { id:string; owner_id:string; nome:string; code:string }

// Itens criados pelo mestre (só ele enxerga). cat 'equip' = arma/armadura; 'item' = item comum.
export type GmItemData = { cat:'equip'|'item'; nome:string; tipo?:string; espacos?:number; dur?:number; durMax?:number; dano?:string
  bloqueio?:number; mana?:number; atq?:'FOR'|'AGI'; bonus?:number; qtd?:number; desc?:string }
export type GmItem = { id:string; data:GmItemData }
