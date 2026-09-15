// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, describe, expect, it } from 'vitest';
import { CARDS } from '../src/game/content';
import { RULES } from '../src/game/rules';
import { cardCost, createCombat, describeCard, endTurn, migrateCombatRulesV2, playCard, playableReason, previewCard, resolveChoice, validateCardPlay } from '../src/game/combat';
import type { CardInstance, Combat } from '../src/game/types';
let serial=0;
const card=(defId:string,grade=0):CardInstance=>({uid:`target-${++serial}`,defId,grade:grade as CardInstance['grade'],retained:0});
function setup(ids:string[],enemies=['road-bandit','thorn-stalker']):Combat{
 const s=createCombat({seed:1551,realm:0,hp:30,maxHp:72,deck:[],enemies});s.hand=ids.map(id=>card(id));s.energy=20;
 for(const enemy of s.enemies){enemy.hp=enemy.maxHp=1000;enemy.intent={name:{en:'Wait','zh-CN':'等待',vi:'Chờ'},kind:'special',effects:[]};}return s;
}
const play=(s:Combat,id:string)=>{const c=s.hand.find(c=>c.defId===id)!;return playCard(s,c.uid,CARDS[id].target==='self'?'player':CARDS[id].target==='none'?undefined:s.enemies[0].id);};
beforeAll(()=>{
 CARDS['target-random-fixture']={...CARDS.strike,id:'target-random-fixture',target:'randomEnemy',effects:[{op:'damage',amount:7,target:'enemy'}]};
 CARDS['target-self-attack-fixture']={...CARDS.strike,id:'target-self-attack-fixture',target:'self',effects:[{op:'armor',amount:4,target:'self'}]};
});

describe('authoritative declared primary targets',()=>{
 it('uses authored self classification despite Attack kind or secondary global debuffs',()=>{
  for(const id of ['target-self-attack-fixture','ancient-grove','gravel-snare','phantom-lattice']){
   const s=setup([id]);expect(CARDS[id].target,id).toBe('self');const c=s.hand[0];expect(validateCardPlay(s,c.uid,s.enemies[0].id)?.en,id).toContain('targets you');
   const before=JSON.stringify(s);expect(playCard(s,c.uid,s.enemies[0].id),id).toBe(s);expect(JSON.stringify(s)).toBe(before);
   expect(playCard(s,c.uid,'player'),id).not.toBe(s);
  }
 });
 it('requires a living enemy for enemy cards; missing, player, summon, stale and dead IDs reject before Energy',()=>{
  const s=setup(['wind-slash']);s.energy=0;s.nextWindDiscount=0;s.enemies[1].hp=0;const before=JSON.stringify(s);
  for(const target of [undefined,'player','summon-1','missing',s.enemies[1].id]){
   expect(validateCardPlay(s,s.hand[0].uid,target)?.en).toContain('living enemy');expect(playCard(s,s.hand[0].uid,target)).toBe(s);expect(JSON.stringify(s)).toBe(before);
  }
  expect(validateCardPlay(s,s.hand[0].uid,s.enemies[0].id)?.en).toBe('Requires 1 Dao Yuan; you have 0.');
 });
 it('accepts explicit or omitted self, untargeted Heart Demon, and AoE with optional living-enemy anchor',()=>{
  const self=setup(['defense']);expect(validateCardPlay(self,self.hand[0].uid)).toBeNull();expect(validateCardPlay(self,self.hand[0].uid,'player')).toBeNull();
  const none=setup(['heart-demon']);expect(validateCardPlay(none,none.hand[0].uid)).toBeNull();expect(validateCardPlay(none,none.hand[0].uid,'player')?.en).toContain('no target');
  const aoe=setup(['mountain-breaker']);aoe.player.armor=10;expect(CARDS['mountain-breaker'].target).toBe('allEnemies');
  const direct=playCard(aoe,aoe.hand[0].uid),anchored=playCard(aoe,aoe.hand[0].uid,aoe.enemies[1].id);
  expect(direct.enemies.map(e=>e.hp)).toEqual(anchored.enemies.map(e=>e.hp));expect(direct.enemies.every(e=>e.hp<1000)).toBe(true);
  expect(playCard(aoe,aoe.hand[0].uid,'player')).toBe(aoe);
 });
 it('rejects every duplicate UID owner without spending discounts, triggering passives, or appending history',()=>{
  for(const zone of ['hand','draw','discard','exhaust'] as const){const s=setup(['wind-slash']);s[zone].push(structuredClone(s.hand[0]));s.nextWindDiscount=1;s.powers.refiningHeal=5;const before=JSON.stringify(s);
   expect(validateCardPlay(s,s.hand[0].uid,s.enemies[0].id)?.en).toContain('duplicate');expect(playCard(s,s.hand[0].uid,s.enemies[0].id)).toBe(s);expect(JSON.stringify(s)).toBe(before);
  }
 });
 it('rejects phase/choice/pending and returns the identical state for unknown or non-hand UIDs',()=>{
  const states=[setup(['strike']),setup(['strike']),setup(['strike'])];states[0].phase='lost';states[1].choice={kind:'discard',ids:[states[1].hand[0].uid],count:1,min:1};states[2].pending=[{type:'boundary'}];
  for(const s of states){const before=JSON.stringify(s);expect(validateCardPlay(s,s.hand[0].uid,s.enemies[0].id)).not.toBeNull();expect(playCard(s,s.hand[0].uid,s.enemies[0].id)).toBe(s);expect(JSON.stringify(s)).toBe(before);}
  const s=setup(['strike']);s.draw.push(card('defense'));expect(playCard(s,'absent',s.enemies[0].id)).toBe(s);expect(playCard(s,s.draw[0].uid,'player')).toBe(s);
 });
 it('reports actual discounted cost/current Energy in all locales and pays that exact amount on acceptance',()=>{
  let s=setup(['wind-step','wind-slash']);s=play(s,'wind-step');s.energy=0;const c=s.hand[0];expect(cardCost(s,c)).toBe(0);expect(validateCardPlay(s,c.uid,s.enemies[0].id)).toBeNull();
  const accepted=play(s,'wind-slash');expect(accepted.playHistory.at(-1)?.actualCost).toBe(0);expect(accepted.nextWindDiscount).toBe(0);
  const expensive=setup(['scarlet-requiem']);expensive.energy=1;const reason=validateCardPlay(expensive,expensive.hand[0].uid,expensive.enemies[0].id)!;
  for(const locale of ['en','zh-CN','vi'] as const){expect(reason[locale]).toContain('3');expect(reason[locale]).toContain('1');}expect(reason.vi).not.toEqual(reason.en);expect(playableReason(expensive,expensive.hand[0])).toEqual(reason);
 });
 it('keeps preview observational for self cards while real enemy-target activation remains invalid',()=>{
  const s=setup(['gravel-snare']);const before=JSON.stringify(s);const p=previewCard(s,s.hand[0].uid,s.enemies[0].id);expect(p.hp).toBe(0);expect(JSON.stringify(s)).toBe(before);
  expect(playCard(s,s.hand[0].uid,s.enemies[0].id)).toBe(s);const after=playCard(s,s.hand[0].uid,'player');expect(after.player.armor).toBeGreaterThan(0);expect(after.enemies.every(e=>(e.statuses.weak??0)>0)).toBe(true);
 });
 it('random target selection happens only on accepted play and preview cannot consume or expose future RNG',()=>{
  const s=setup(['target-random-fixture']);const before=JSON.stringify(s);expect(playCard(s,s.hand[0].uid,'player')).toBe(s);
  expect(previewCard(s,s.hand[0].uid,s.enemies[0].id).uncertain).toBe(true);expect(JSON.stringify(s)).toBe(before);
  const a=playCard(s,s.hand[0].uid),b=playCard(structuredClone(s),s.hand[0].uid);expect(a).toEqual(b);expect(a.enemies.filter(e=>e.hp===993)).toHaveLength(1);expect(a.rng).not.toBe(s.rng);
 });
});

describe('Scarlet Requiem, Brute Force and local rules migration',()=>{
 it('Scarlet base costs3, deals16, applies6Bleeding and Exhausts without healing',()=>{
  const s=setup(['scarlet-requiem']);expect(cardCost(s,s.hand[0])).toBe(3);const after=play(s,'scarlet-requiem');
  expect(after.enemies[0].hp).toBe(984);expect(after.enemies[0].statuses.bleeding).toBe(6);expect(after.player.hp).toBe(30);expect(after.energy).toBe(17);expect(after.exhaust[0].defId).toBe('scarlet-requiem');
 });
 it('all currently legal upgraded Scarlet grades remain non-healing; independent Exhaust healing still works',()=>{
  for(let grade=0;grade<=5;grade++){const s=setup(['scarlet-requiem']);s.realm=Math.max(0,grade-1);s.hand[0].grade=grade as CardInstance['grade'];const after=play(s,'scarlet-requiem');expect(after.player.hp,`grade${grade}`).toBe(30);expect(after.events.some(e=>e.code==='heal')).toBe(false);}
  const s=setup(['scarlet-requiem']);s.powers.refiningHeal=4;const after=play(s,'scarlet-requiem');expect(after.player.hp).toBe(34);expect(after.events.filter(e=>e.code==='heal').map(e=>e.values?.amount)).toEqual([4]);
 });
 it('upgraded and temporarily refined Basics retain category-based Brute Force for damage, Armor and cost',()=>{
  let s=setup(['heavy-foundations','strike','defense','flying-sword']);s.realm=1;s.hand[1].grade=1;s.hand[1].tempGrade=2;s.hand[2].grade=2;s=play(s,'heavy-foundations');
  expect(CARDS[s.hand[0].defId].category).toBe('basic');expect(cardCost(s,s.hand[0])).toBe(2);expect(describeCard(s.hand[0],'en',s)).toContain('15 damage');s=play(s,'strike');expect(s.enemies[0].hp).toBe(985);
  expect(cardCost(s,s.hand[0])).toBe(2);s=play(s,'defense');expect(s.player.armor).toBe(15);expect(cardCost(s,s.hand[0])).toBe(0);s=play(s,'flying-sword');expect(s.enemies[0].hp).toBe(983);
 });
 it('rejects unmigrated old rules at every action boundary without changing its saved state',()=>{
  const s=setup(['strike']);s.version=2;const before=JSON.stringify(s);expect(validateCardPlay(s,s.hand[0].uid,s.enemies[0].id)?.en).toContain('migration');expect(playCard(s,s.hand[0].uid,s.enemies[0].id)).toBe(s);expect(endTurn(s)).toBe(s);expect(JSON.stringify(s)).toBe(before);
  s.choice={kind:'discard',ids:[s.hand[0].uid],count:1,min:1};expect(resolveChoice(s,s.choice.ids)).toBe(s);
 });
 it('migrates pending old Scarlet-owned healing only, preserving resolved HP/RNG/history and independent passives',()=>{
  const old=setup(['scarlet-requiem']);old.version=2;const c=old.hand.shift()!;c.grade=1;old.resolvingCard=c;old.powers.refiningHeal=2;
  old.choice={kind:'recover',ids:[],count:0,min:0};
  const context={ownerId:'player',targetId:old.enemies[0].id,card:c,kind:'attack' as const,path:'blood' as const};
  old.pending=[{type:'effect',effect:{op:'damage',amount:16,upgrade:3,target:'enemy',lifesteal:true},context},{type:'effect',effect:{op:'heal',amount:99,target:'self'},context},{type:'effect',effect:{op:'heal',amount:5,target:'self'},context:{ownerId:'player'}},{type:'finishCard',card:c},{type:'boundary'}];
  const before=JSON.stringify(old),migrated=migrateCombatRulesV2(old);expect(JSON.stringify(old)).toBe(before);expect(migrated.version).toBe(RULES.version);expect(migrated.rulesMigration).toEqual({fromVersion:2,mode:'snapshot-continuation'});
  expect([migrated.rng,migrated.player.hp,migrated.actions,migrated.playHistory]).toEqual([old.rng,old.player.hp,old.actions,old.playHistory]);expect(migrateCombatRulesV2(migrated)).toBe(migrated);
  const after=resolveChoice(migrated,[]);expect(after.enemies[0].hp).toBe(981);expect(after.player.hp).toBe(37);expect(after.events.filter(e=>e.code==='heal').map(e=>e.values?.amount)).toEqual([5,2]);
 });
});
