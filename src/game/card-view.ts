// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { CARDS } from './content';
import type { CardDef, CardInstance, CardTarget, Locale } from './types';
import { ui } from './ui-copy';
/** Presentation never changes rules kind, Strength eligibility or target validation. */
export function cardRole(def:CardDef):'attack'|'defense'|'skill'|'power'{
 if(def.kind==='attack'||def.kind==='power')return def.kind;
 return def.effects.some(e=>e.op==='armor'||e.status==='protectiveQi'||e.status==='fortify')?'defense':'skill';
}
export function cardTarget(card:CardInstance):CardTarget{return CARDS[card.defId].target;}
export function targetsEnemies(card:CardInstance){return ['enemy','allEnemies','randomEnemy'].includes(cardTarget(card));}
export function targetInstruction(card:CardInstance,locale:Locale){return ui(locale,{self:'selfTarget',enemy:'enemyTarget',allEnemies:'allEnemiesTarget',randomEnemy:'randomEnemyTarget',none:'noTarget'}[cardTarget(card)] as 'selfTarget'|'enemyTarget'|'allEnemiesTarget'|'randomEnemyTarget'|'noTarget');}
export function cardKeywords(def:CardDef):string[]{
 const effects=[...def.effects,...(def.onDiscard??[]),...(def.onDraw??[]),...(def.onTurnEnd??[])];
 return [...new Set([...effects.filter(e=>e.status).map(e=>e.status!),...(def.retain?['retain']:[]),...(def.exhaust||def.autoExhaust?['exhaust']:[]),...(def.onDiscard?['activeDiscard']:[]),...effects.filter(e=>['discard','exhaust','flyingSwords','scry','search','refine','summon','command','directLoss','nextWindDiscount','reorder'].includes(e.op)).map(e=>e.op==='discard'?'activeDiscard':e.op==='reorder'?'calculation':e.op)])];
}
