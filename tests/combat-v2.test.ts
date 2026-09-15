// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, describe, expect, it } from 'vitest';
import { CARDS, ENEMIES, SUMMONS } from '../src/game/content';
import { cardCost, createCombat, describeCard, describeCombatEvent, describeEnemyIntent, endTurn, enemyAttackValue, enemyIntentThreat, playCard, playableReason, previewCard, previewEnemyAction, pursuitState, resolveChoice } from '../src/game/combat';
import type { CardDef, CardInstance, Combat, Effect } from '../src/game/types';
let serial = 0;
const card = (defId:string):CardInstance => ({uid:`v2-${++serial}`,defId,grade:0,retained:0});
const wait = {name:{en:'Wait','zh-CN':'等待',vi:'Chờ'},kind:'special' as const,effects:[]};
function setup(ids:string[]=[], enemies=['road-bandit']):Combat {
 const s=createCombat({seed:1847,realm:0,hp:72,maxHp:72,deck:[],enemies});s.hand=ids.map(card);s.energy=50;s.maxEnergy=50;
 for(const e of s.enemies){e.hp=e.maxHp=1000;e.intent=structuredClone(wait);}return s;
}
const play=(s:Combat,id:string,target=s.enemies[0].id)=>playCard(s,s.hand.find(c=>c.defId===id)!.uid,CARDS[id].target==='self'?s.player.id:CARDS[id].target==='none'?undefined:target);
function fixture(id:string,effects:Effect[],extra:Partial<CardDef>={}){CARDS[id]={...CARDS.strike,id,cost:0,name:{en:id,'zh-CN':id,vi:id},effects,...extra};}
beforeAll(()=>{
 fixture('v2-draw',[{op:'draw',amount:1}],{kind:'skill'});
 fixture('v2-many-draw',[{op:'draw',amount:6}],{kind:'skill'});
 fixture('v2-hit',[{op:'damage',amount:30,target:'enemy'}]);
 fixture('v2-half',[{op:'damage',amount:30,target:'enemy',damageFlags:{armorFraction:.5}}]);
 fixture('v2-external',[{op:'damage',amount:7,target:'enemy',damageFlags:{attack:false}}],{kind:'skill'});
 fixture('v2-direct',[{op:'directLoss',amount:7,target:'enemy'}],{kind:'skill'});
 fixture('v2-inject-hand',[{op:'addStatusCard',id:'meridian-disruption',count:1,to:'hand'}],{kind:'skill'});
 fixture('v2-choice-pursuit',[{op:'discard',count:1},{op:'damage',amount:4,target:'enemy',pursuit:{condition:'thirdPlay',amount:4}}],{path:'wind'});
 fixture('v2-exhaust',[{op:'exhaust',count:1}],{kind:'skill'});
});

describe('v2 Strength and committed Pursuit',()=>{
 it('Strength10 adds to every Sword token hit while a summoned attack uses only its own stats',()=>{
  let s=setup(['flying-sword','flying-sword','beast-command']);s.player.statuses.strength=10;
  const def=SUMMONS['reed-wolf'];s.summons=[{...def,id:'own-wolf',defId:def.id,maxHp:def.hp,armor:0,statuses:{strength:2}}];
  expect(previewCard(s,s.hand[0].uid,s.enemies[0].id).hits).toEqual([12]);
  s=play(s,'flying-sword');s=play(s,'flying-sword');s=play(s,'beast-command');expect(s.enemies[0].hp).toBe(970);
 });
 it('Wind Slash uses any earlier committed Wind, even with a non-Wind intervening play',()=>{
  let s=setup(['wind-step','defense','wind-slash']);s=play(s,'wind-step');s=play(s,'defense');
  expect(pursuitState(s,s.hand[0])).toMatchObject({priorWind:true,thirdPlay:true,met:true});
  expect(cardCost(s,s.hand[0])).toBe(0);expect(describeCard(s.hand[0],'en',s)).toContain('8 damage');
  s=play(s,'wind-slash');expect(s.enemies[0].hp).toBe(992);
  expect(s.playHistory.map(h=>[h.ordinal,h.kind,h.path,h.actualCost])).toEqual([[1,'skill','wind',0],[2,'skill','basic',1],[3,'attack','wind',0]]);
 });
 it('third-play Chasing Blade bonus is one packet with Strength applied once, and never on fourth play',()=>{
  let s=setup(['defense','defense','chasing-blade','chasing-blade']);s.player.statuses.strength=10;
  s=play(s,'defense');s=play(s,'defense');expect(previewCard(s,s.hand[0].uid,s.enemies[0].id).hits).toEqual([18]);
  s=play(s,'chasing-blade');s=play(s,'chasing-blade');expect(s.enemies[0].hp).toBe(968);
 });
 it('Flowing Guard tests immediate prior rules kind, not a damage event or path',()=>{
  let s=setup(['strike','flowing-guard','v2-external','flowing-guard']);s=play(s,'strike');s=play(s,'flowing-guard');expect(s.player.armor).toBe(8);
  s=play(s,'v2-external');s=play(s,'flowing-guard');expect(s.player.armor).toBe(12);
 });
 it('failed play, invalid target, preview, draw and token generation never add committed history',()=>{
  let s=setup(['wind-step','wind-slash','twin-stars','v2-draw']);const original=JSON.stringify(s);
  expect(playCard(s,s.hand[1].uid,'invalid')).toBe(s);previewCard(s,s.hand[1].uid,s.enemies[0].id);describeCard(s.hand[1],'vi',s);expect(JSON.stringify(s)).toBe(original);
  s=play(s,'wind-step');const before=JSON.stringify(s);previewCard(s,s.hand.find(c=>c.defId==='wind-slash')!.uid,s.enemies[0].id);expect(JSON.stringify(s)).toBe(before);
  s=play(s,'twin-stars');s.draw=[card('strike')];s=play(s,'v2-draw');expect(s.playHistory).toHaveLength(3);expect(s.hand.filter(c=>c.defId==='flying-sword')).toHaveLength(2);
 });
 it('discount applies to the next committed Wind including zero-cost, survives other paths, and expires at end turn',()=>{
  let s=setup(['wind-step','wind-step','wind-slash','defense']);s=play(s,'wind-step');s=play(s,'wind-step');expect(s.nextWindDiscount).toBe(1);
  s=play(s,'defense');expect(s.nextWindDiscount).toBe(1);s=play(s,'wind-slash');expect(s.nextWindDiscount).toBe(0);
  s.hand=[card('wind-step'),card('wind-slash')];s=play(s,'wind-step');s=endTurn(s);expect(s.nextWindDiscount).toBe(0);expect(pursuitState(s,card('wind-slash')).priorWind).toBe(false);
 });
 it('frozen Pursuit context survives a choice and its active-discard draw continuation',()=>{
  let s=setup(['defense','defense','v2-choice-pursuit','ragged-banner']);s.draw=[card('flying-sword')];s=play(s,'defense');s=play(s,'defense');s=play(s,'v2-choice-pursuit');
  expect(s.playHistory).toHaveLength(3);expect(s.choice?.kind).toBe('discard');
  s=resolveChoice(s,[s.hand[0].uid]);expect(s.enemies[0].hp).toBe(992);expect(s.playHistory).toHaveLength(3);expect(s.hand[0].defId).toBe('flying-sword');
 });
});

describe('temporary status card lifecycle',()=>{
 it('Qi Disorder clogs and is unplayable; Heart Demon costs one and Exhausts as a real committed play',()=>{
  let s=setup(['qi-disorder','heart-demon']);expect(playableReason(s,s.hand[0])?.en).toContain('cannot');expect(playCard(s,s.hand[0].uid)).toBe(s);
  s=play(s,'heart-demon');expect(s.energy).toBe(49);expect(s.exhaust.map(c=>c.defId)).toEqual(['heart-demon']);expect(s.playHistory[0].actualCost).toBe(1);
 });
 it('Meridian Disruption fires before overflow, loses current Energy at floor zero, and Exhausts with Refinement',()=>{
  let s=setup(['v2-draw',...Array(10).fill('defense')]);s.energy=0;s.powers.refiningArmor=3;s.draw=[card('meridian-disruption')];
  s=play(s,'v2-draw');expect(s.energy).toBe(0);expect(s.hand).toHaveLength(10);expect(s.player.armor).toBe(3);expect(s.exhaust[0].defId).toBe('meridian-disruption');expect(s.discard.some(c=>c.defId==='meridian-disruption')).toBe(false);
 });
 it('adding a status directly to hand is not Draw and does not trigger its onDraw hook',()=>{
  let s=setup(['v2-inject-hand']);s=play(s,'v2-inject-hand');expect(s.energy).toBe(50);expect(s.hand[0].defId).toBe('meridian-disruption');expect(s.exhaust).toHaveLength(0);
 });
 it('Internal Injury deals direct2 before natural discard, ignores protection, Exhausts, and triggers Refinement once',()=>{
  const s=setup(['internal-injury']);s.player.armor=90;s.player.statuses={dodge:1,protectiveQi:10};s.powers.refiningArmor=3;
  const after=endTurn(s);expect(after.player.hp).toBe(70);expect(after.player.statuses.dodge).toBe(1);expect(after.exhaust.filter(c=>c.defId==='internal-injury')).toHaveLength(1);
  const codes=after.events.map(e=>e.code);expect(codes.indexOf('directLoss')).toBeLessThan(codes.indexOf('exhaust'));expect(after.events.filter(e=>e.code==='armor').at(-1)?.values?.amount).toBe(3);
 });
 it('overflowed Internal Injury does not trigger a hand end hook',()=>{
  let s=setup(['v2-draw',...Array(10).fill('defense')]);s.draw=[card('internal-injury')];s=play(s,'v2-draw');expect(s.discard.some(c=>c.defId==='internal-injury')).toBe(true);
  s=endTurn(s);expect(s.player.hp).toBe(72);expect(s.events.some(e=>e.code==='directLoss')).toBe(false);
 });
 it('Scorched Meridian is External non-Attack damage and Cloud Obscuration Weak ends this player turn',()=>{
  let s=setup(['v2-many-draw']);s.player.statuses.strength=10;s.player.armor=1;s.draw=[card('scorched-meridian'),card('cloud-obscuration'),card('strike')];
  s=play(s,'v2-many-draw');expect(s.player.hp).toBe(71);expect(s.player.armor).toBe(0);expect(s.player.statuses.weak).toBe(1);expect(s.exhaust).toHaveLength(2);
  expect(previewCard(s,s.hand[0].uid,s.enemies[0].id).hp).toBe(11);s=endTurn(s);expect(s.player.statuses.weak).toBe(0);
 });
 it('onDraw Exhaust can chain Refinement draws without duplicating zones or committed plays',()=>{
  let s=setup(['v2-draw']);s.powers.refiningDraw=1;s.draw=[card('meridian-disruption'),card('cloud-obscuration'),card('strike')];s=play(s,'v2-draw');
  expect(s.hand.map(c=>c.defId)).toEqual(['strike']);expect(s.exhaust).toHaveLength(2);expect(s.playHistory).toHaveLength(1);
  const ids=[...s.hand,...s.draw,...s.discard,...s.exhaust].map(c=>c.uid);expect(new Set(ids).size).toBe(ids.length);
 });
 it('terminal cleanup removes statuses from all zones and stops on lethal injury without resurrection',()=>{
  const s=setup(['internal-injury','qi-disorder']);s.player.hp=1;s.draw=[card('meridian-disruption')];s.discard=[card('scorched-meridian')];s.exhaust=[card('heart-demon')];s.powers.refiningHeal=20;
  const after=endTurn(s);expect(after.phase).toBe('lost');expect(after.player.hp).toBe(0);
  expect([...after.hand,...after.draw,...after.discard,...after.exhaust].some(c=>CARDS[c.defId].category==='status')).toBe(false);expect(after.pending).toEqual([]);
 });
 it('status cards cannot be temporarily refined and are removed from won snapshots too',()=>{
  let s=setup(['re-refinement','qi-disorder','strike']);s=play(s,'re-refinement');expect(s.choice?.ids).not.toContain(s.hand.find(c=>c.defId==='qi-disorder')!.uid);
  s=resolveChoice(s,[]);s.enemies[0].hp=1;s=play(s,'strike');expect(s.phase).toBe('won');expect(s.hand).toHaveLength(0);
 });
});

describe('Cloud boss action causality and honest intentions',()=>{
 it('half Armor example30 vs20 blocks10, deals20HP, leaves10Armor and does not change Pierce rules',()=>{
  let s=setup(['v2-half']);s.enemies[0].armor=20;const before=JSON.stringify(s);expect(previewCard(s,s.hand[0].uid,s.enemies[0].id)).toMatchObject({hp:20,armor:10,hits:[30]});expect(JSON.stringify(s)).toBe(before);
  s=play(s,'v2-half');expect(s.enemies[0].hp).toBe(980);expect(s.enemies[0].armor).toBe(10);
 });
 it('Void Image dodges Attack and non-Attack External hits, never Direct HP Loss',()=>{
  let s=setup(['v2-direct','v2-external','strike'],['cloud-beastmaster']);s.enemies[0].statuses.dodge=1;
  s=play(s,'v2-direct');expect(s.enemies[0].hp).toBe(993);expect(s.enemies[0].statuses.dodge).toBe(1);
  s=play(s,'v2-external');expect(s.enemies[0].hp).toBe(993);expect(s.enemies[0].statuses.dodge).toBe(0);
  s.enemies[0].statuses.dodge=1;s=play(s,'strike');expect(s.enemies[0].hp).toBe(993);
 });
 it('25% Cloud sharing distributes once, counts actual deaths once, and never redistributes overkill',()=>{
  let s=setup(['v2-hit'],['cloud-beastmaster','cloud-wisp','cloud-wisp']);s.enemies[1].hp=1;s.enemies[2].hp=2;
  s=play(s,'v2-hit');expect(s.enemies.slice(1).map(e=>e.hp)).toEqual([0,0]);expect(s.events.filter(e=>e.code==='death')).toHaveLength(2);
  // 7 shared =4+3, minion deaths grant8Armor; boss retains23 incoming and loses15HP.
  expect(s.enemies[0].hp).toBe(985);expect(s.enemies[0].armor).toBe(0);
 });
 it('a multi-hit boss Attack triggers each living beast once, not each hit or recursive follow-up',()=>{
  const s=setup([],['cloud-beastmaster','cloud-wisp','cloud-wisp']);s.enemies[0].intent={...wait,kind:'attack',effects:[{op:'damage',amount:2,hits:3,target:'enemy'}]};
  const after=endTurn(s);expect(after.player.hp).toBe(60);expect(after.events.filter(e=>e.code==='cloudFollowup')).toHaveLength(2);
  expect(after.events.filter(e=>e.code==='damage'&&e.values?.target==='player').map(e=>e.values?.amount)).toEqual([2,2,2,3,3]);
 });
 it('Cloud command attacks every living beast once with bonus2 and never grants boss Attack follow-ups',()=>{
  const s=setup([],['cloud-beastmaster','cloud-wisp','cloud-wisp']);s.enemies[0].intent={...wait,effects:[{op:'cloudCommand',amount:2}]};s.enemies[1].hp=0;
  const after=endTurn(s);expect(after.player.hp).toBe(67);expect(after.events.filter(e=>e.code==='cloudFollowup')).toHaveLength(0);
 });
 it('a counter that kills the boss stops later hits and queued follow-ups',()=>{
  const s=setup([],['cloud-beastmaster','cloud-wisp']);s.enemies[0].hp=1;s.enemies[0].intent={...wait,kind:'attack',effects:[{op:'damage',amount:1,hits:3,target:'enemy'}]};
  const def=SUMMONS['thorn-vine'];s.summons=[{...def,id:'counter',defId:def.id,maxHp:def.hp,armor:0,statuses:{}}];
  const after=endTurn(s);expect(after.enemies[0].hp).toBe(0);expect(after.events.filter(e=>e.code==='cloudFollowup')).toHaveLength(0);expect(after.player.hp).toBe(68); // surviving wisp resumes its ordinary3 damage.
 });
 it('the five-step cycle grants a full player warning window before heavy and no hidden beast turns',()=>{
  let s=createCombat({seed:73,realm:0,hp:72,maxHp:72,deck:[],enemies:['cloud-beastmaster']});
  expect(s.enemies[0].intent.kind).toBe('summon');s=endTurn(s);expect(s.player.hp).toBe(72);expect(s.enemies).toHaveLength(3);
  expect(describeEnemyIntent(s,s.enemies[1].id,'en')).toContain('no independent action');s=endTurn(s);s=endTurn(s);
  expect(s.enemies[0].intent.effects).toEqual([]);expect(enemyIntentThreat(s,s.enemies[0].id)).toMatchObject({warning:true,main:26,followupTotal:6,total:32,armorFraction:.5});
  const warning=describeEnemyIntent(s,s.enemies[0].id,'en');expect(warning).toContain('26');expect(warning).toContain('50%');expect(warning).toContain('32 total');const hp=s.player.hp,turn=s.turn;s=endTurn(s);expect(s.player.hp).toBe(hp);expect(s.turn).toBe(turn+1);
  expect(s.enemies[0].intent.effects[0].damageFlags?.armorFraction).toBe(.5);expect(describeEnemyIntent(s,s.enemies[0].id,'en')).toContain('2 currently living');
  const before=JSON.stringify(s);const preview=previewEnemyAction(s,s.enemies[0].id);expect(preview.hits).toEqual([26,3,3]);expect(JSON.stringify(s)).toBe(before);
 });
 it('enemy realm scaling is authored and unaffected by player Strength or grade',()=>{
  const s=setup([],['cloud-beastmaster']);s.realm=3;s.player.statuses.strength=10;const effect=ENEMIES['cloud-beastmaster'].intents[4].effects[0];
  expect(enemyAttackValue(s,s.enemies[0].id,effect)).toBe(35);s.enemies[0].intent=structuredClone(ENEMIES['cloud-beastmaster'].intents[4]);expect(previewEnemyAction(s,s.enemies[0].id).hp).toBe(35);
 });
});

describe('Wisdom ordering and localized generated rules',()=>{
 it('reorders only revealed top cards, requires every selection once, and leaves the hidden tail and RNG intact',()=>{
  let s=setup(['inner-sight']);s.draw=['strike','defense','qi-disorder','flying-sword','open-vein'].map(card);const original=s.draw.map(c=>c.uid),rng=s.rng;s=play(s,'inner-sight');
  expect(s.choice).toMatchObject({kind:'reorder',count:3,min:3,ids:original.slice(0,3)});expect(resolveChoice(s,[original[0]])).toBe(s);expect(resolveChoice(s,[original[0],original[0],original[1]])).toBe(s);
  s=resolveChoice(s,[original[2],original[0],original[1]]);expect(s.draw.map(c=>c.uid)).toEqual([original[2],original[0],original[1],...original.slice(3)]);expect(s.rng).toBe(rng);expect(s.playHistory).toHaveLength(1);
 });
 it('all new card, intent and event descriptions are three-language and inspection leaves state unchanged',()=>{
  const s=setup(['wind-step','wind-slash','qi-disorder','meridian-disruption','internal-injury','heart-demon','scorched-meridian','cloud-obscuration'],['cloud-beastmaster']);s.enemies[0].intent=structuredClone(ENEMIES['cloud-beastmaster'].intents[4]);const before=JSON.stringify(s);
  for(const c of s.hand){expect(describeCard(c,'vi',s)).not.toMatch(/[\u3400-\u9fff]/u);expect(describeCard(c,'vi',s)).not.toEqual(describeCard(c,'en',s));}
  for(const locale of ['en','zh-CN','vi'] as const){expect(describeEnemyIntent(s,s.enemies[0].id,locale)).toContain('50%');expect(describeCombatEvent({code:'cloudCommand'},locale,s).length).toBeGreaterThan(8);}
  expect(JSON.stringify(s)).toBe(before);
 });
});
