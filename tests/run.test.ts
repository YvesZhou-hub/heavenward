// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { CARDS, DAO_CARD_IDS, DIVINE_CARD_IDS, ENEMIES, REALMS, normalEncounterIds } from '../src/game/content';
import { endTurn, playCard, playableReason } from '../src/game/combat';
import { buy, canUpgrade, chooseEvent, chooseStarting, commitCombat, drawOffers, emptyMeta, enterNode, eventDisabled, instance, leaveMerchant, newRun, price, restHeal, retire, salePrice, sell, takeReward, updateMeta, upgrade, upgradeCost, stageIndex, roadLength, ROAD_PLAN, previewUpgrade, confirmUpgrade, restPreview, recordActiveTime, deckProfile, offerWeight, roadView, BREAKTHROUGH_PACKAGES, getLastBreakthrough, getPendingProgression, acknowledgeProgression, continueBreakthrough, canRemovePermanentCards, removePermanentCards, ENCOUNTER_HINTS, type NodeKind, type Run } from '../src/game/run';
import { freshSave, validateSave, encodeSave, decodeSave } from '../src/game/save';

function started(seed = 41): Run { let r = newRun(seed, 1000); r = chooseStarting(r, r.offers[0].uid); return chooseStarting(r, r.offers[0].uid); }
// Controlled node/combat fixtures isolate progression contracts. They are not
// ordinary-play victories or evidence of balance; simulate.ts uses real combat.
function atNode(kind: NodeKind, seed = 41, eventId?: number): Run {
 const r = started(seed);
 r.nodes = [{ id: 'controlled-node', kind, eventId, ...(kind === 'combat' || kind === 'elite' || kind === 'tribulation' ? { encounter: [kind === 'tribulation' ? r.bossId : kind === 'elite' ? 'jade-hunter' : 'road-bandit'] } : {}) }];
 return enterNode(r, r.nodes[0].id);
}
function victory(r: Run): Run {
 const c = structuredClone(r.combat!); c.enemies.forEach(e => { e.hp = 0; }); c.phase = 'won';
 c.actions.push({ type: 'endTurn', turn: c.turn }); return commitCombat(r, c);
}
function fillTo(r: Run, size: number) { while (r.deck.length < size) r.deck.push(instance(r, 'ember-brand')); return r; }
const valid = (r: Run) => expect(validateSave({ ...freshSave(), run: r }), `${r.phase}, realm ${r.realm}, depth ${r.depth}`).toBe(true);

describe('Human Realm progression — controlled transition coverage', () => {
 it('uses exactly two distinct five-choice starting rounds and preserves 5 Strike + 5 Defense', () => {
  let r = newRun(13, 1000); const initial = structuredClone(r);
  expect(r.offers).toHaveLength(5); expect(new Set(r.offers.map(c => c.defId)).size).toBe(5);
  expect(r.deck.filter(c => c.defId === 'strike')).toHaveLength(5); expect(r.deck.filter(c => c.defId === 'defense')).toHaveLength(5);
  r.offers.forEach(c => expect(CARDS[c.defId]).toMatchObject({ category: 'dao', starting: true }));
  const first = r.offers[2].uid; r = chooseStarting(r, first); expect(initial.deck).toHaveLength(10);
  expect(r.phase).toBe('starting'); expect(r.startingRound).toBe(1); expect(r.offers).toHaveLength(5);
  expect(chooseStarting(r, first)).toBe(r);
  r = chooseStarting(r, r.offers[3].uid); expect(r.phase).toBe('road'); expect(r.deck).toHaveLength(12); expect(r.startingRound).toBe(2);
  expect(chooseStarting(r, r.deck[0].uid)).toBe(r); valid(r);
 });

 it('stores three distinct one-step alternatives from curated encounter groups', () => {
  for(let seed=1;seed<=150;seed++){
   const r=started(seed);expect(r.nodes).toHaveLength(3);
   expect(new Set(r.nodes.map(n=>n.encounter!.join(','))).size).toBe(3);
   for(const node of r.nodes)expect(normalEncounterIds).toContainEqual(node.encounter);
   expect(roadView(r).next.every(n=>!('encounter' in n)&&!!n.hint)).toBe(true);
   expect(enterNode(r,'unreachable')).toBe(r);
  }
 });
 it('authors 26 visits with 10 normal, three Elite, five Tribulation and eight utility gates',()=>{
  const steps=ROAD_PLAN.flat();expect(steps).toHaveLength(26);
  expect(steps.filter(s=>s==='combat')).toHaveLength(10);expect(steps.filter(s=>s==='elite')).toHaveLength(3);
  expect(steps.filter(s=>s==='tribulation')).toHaveLength(5);expect(steps.filter(s=>s==='utility')).toHaveLength(8);
  ROAD_PLAN.forEach((plan,realm)=>{expect(plan.at(-1)).toBe('tribulation');expect(new Set(plan.map((_,depth)=>stageIndex({realm,depth}))).size).toBe(4);});
 });

 it('commits a reward once without mutating its input or allowing an old offer to duplicate a card', () => {
  const combat = atNode('combat'); const before = structuredClone(combat); const reward = victory(combat);
  expect(combat).toEqual(before); expect(reward.phase).toBe('reward'); expect(reward.offers).toHaveLength(5); expect(reward.stats.combats).toBe(1);
  const offered = reward.offers[0]; const claimed = takeReward(reward, offered.uid);
  expect(reward.deck).toHaveLength(12); expect(claimed.deck).toHaveLength(13); expect(claimed.deck.filter(c => c.uid === offered.uid)).toHaveLength(1);
  expect(takeReward(claimed, offered.uid)).toBe(claimed); expect(commitCombat(reward, combat.combat!)).toBe(reward); valid(claimed);
 });

 it('rejects stale same-seed combat updates and isolates accepted snapshots from callers', () => {
  const r = atNode('combat'); const old = r.combat!;
  const card = old.hand.find(c => !playableReason(old, c));
  const next = card ? playCard(old, card.uid, CARDS[card.defId].target==='enemy'?old.enemies[0].id:undefined) : endTurn(old);
  expect(next.actions.length).toBeGreaterThan(old.actions.length);
  const committed = commitCombat(r, next); expect(committed).not.toBe(r);
  expect(commitCombat(committed, old)).toBe(committed); expect(commitCombat(committed, next)).toBe(committed);
  next.player.hp = 1; expect(committed.combat!.player.hp).not.toBe(1);
 });

 it('acquires rewards and purchases beyond former caps without removing an owned instance', () => {
  const r = fillTo(victory(atNode('combat')), 80),owned=r.deck.map(card=>card.uid),offered=r.offers[0];
  const next=takeReward(r,offered.uid,r.deck[0].uid);expect(next.deck).toHaveLength(81);expect(next.deck.map(card=>card.uid)).toEqual([...owned,offered.uid]);valid(next);
  const shop=fillTo(atNode('merchant'),120);shop.gold=1000;const bought=buy(shop,shop.offers[0].uid,shop.deck[0].uid);
  expect(bought.deck).toHaveLength(121);expect(bought.deck.slice(0,120)).toEqual(shop.deck);valid(bought);
 });

 it('completes all 20 minor stages and only ascends after Peak Spirit Transformation', () => {
  let r = started(709); const seen = new Set<string>(); let transitions = 0; const realmEntries: number[] = [];
  while (!['dead','ascended'].includes(r.phase) && transitions++ < 200) {
   if (r.phase === 'road') {
    seen.add(`${r.realm}:${stageIndex(r)}`);
    const node = r.nodes.find(n => n.kind === 'combat') ?? r.nodes.find(n => n.kind === 'rest') ?? r.nodes[0];
    if (node.kind === 'tribulation' && r.realm === 4) { expect(r.depth).toBe(roadLength(4)-1); expect(r.phase).toBe('road'); }
    r = enterNode(r, node.id);
   } else if (r.phase === 'combat') {
    const previousRealm = r.realm; r = victory(r);
    if (r.phase === 'breakthrough') { expect(r.realm).toBe(previousRealm + 1); realmEntries.push(r.realm); }
   } else if (r.phase === 'reward' || r.phase === 'inheritance') r = takeReward(r, r.offers[0].uid);
   else if (r.phase === 'breakthrough') {
    const receipt=getPendingProgression(r);if(receipt?.kind==='major')r=continueBreakthrough(r,receipt.id);
    r = takeReward(r, r.offers[0].uid);
   } else if (r.phase === 'rest') r = restHeal(r);
   else if (r.phase === 'merchant') r = leaveMerchant(r);
   else if (r.phase === 'event') r = chooseEvent(r, 1);
   valid(r);
  }
  expect(r.phase).toBe('ascended'); expect(r.routeHistory).toHaveLength(26); expect(r.stats.combats).toBe(10); expect(r.stats.elites).toBe(3); expect(r.realm).toBe(4); expect(r.stats.tribulations).toBe(5); expect(seen.size).toBe(20); expect(realmEntries).toEqual([1,2,3,4]);
  expect(r.deck.filter(c => CARDS[c.defId].category === 'divine')).toHaveLength(4); expect(r.offers).toHaveLength(0);
  const meta = updateMeta(emptyMeta(), r, 91000); expect(meta.history[0].outcome).toBe('ascended'); expect(meta.unlocks).toContain('spirit-realm-lore');
 });

 it('lets Divine and foundation rewards Skip while grandfathering the smaller deck', () => {
  let r = atNode('tribulation'); r.depth = roadLength(r.realm)-1; r = victory(r);
  expect(r.realm).toBe(1); expect(r.deck).toHaveLength(12); expect(r.draftRemaining).toBe(2);
  const paused=decodeSave(encodeSave({...freshSave(),run:r}))!; expect(paused.run).toEqual(r); r=paused.run!;
  r=continueBreakthrough(r,getPendingProgression(r)!.id);
  r = takeReward(r, null); expect(r.rewardKind).toBe('foundation'); expect(r.offers).toHaveLength(5);
  const owned=structuredClone(r.deck);r=takeReward(r,null);expect(r.phase).toBe('road');expect(r.deck).toEqual(owned);expect(r.draftRemaining).toBe(0);valid(r);
  r.nodes=[{id:'later-shop',kind:'merchant'}];r=enterNode(r,'later-shop');expect(sell(r,r.deck[0].uid)).toBe(r);valid(r);
 });

 it('allows Xuan at Spirit Transformation while Divine Abilities remain ungradeable', () => {
  const r = fillTo(atNode('rest'), 20); r.realm = 4; r.deck[0].grade = 4;
  expect(canUpgrade(r, r.deck[0])).toBe(true); const next = upgrade(r, r.deck[0].uid); expect(next.deck[0].grade).toBe(5); expect(canUpgrade(next, next.deck[0])).toBe(false);
  const divine = instance(r, DIVINE_CARD_IDS[0]); expect(divine.grade).toBe(0); expect(canUpgrade(r, divine)).toBe(false);
  valid(next);
 });

 it('enforces three sales, minimum deck size, two escalating upgrades and exactly-once purchases', () => {
  let r = fillTo(atNode('merchant'), 16); r.gold = 1000;
  expect(r.offers.every(c => CARDS[c.defId].category !== 'divine')).toBe(true);
  const costs: number[] = []; for (let i = 0; i < 2; i++) { costs.push(upgradeCost(r)); r = upgrade(r, r.deck[i].uid); }
  expect(costs[1]).toBeGreaterThan(costs[0]); expect(r.shop.upgraded).toBe(2); expect(upgrade(r, r.deck[2].uid)).toBe(r);
  const offer = r.offers[0], goldBefore = r.gold; r = buy(r, offer.uid); expect(r.gold).toBe(goldBefore - price(offer)); expect(buy(r, offer.uid)).toBe(r);
  for (let i = 0; i < 3; i++) { const sold = r.deck[0], before = r.gold; r = sell(r, sold.uid); expect(r.gold).toBe(before + salePrice(sold)); }
  expect(r.shop.sold).toBe(3); expect(sell(r, r.deck[0].uid)).toBe(r);
  const minimum = atNode('merchant'); expect(sell(minimum, minimum.deck[0].uid)).toBe(minimum);
  const injectedDivine = instance(r, DIVINE_CARD_IDS[0]); r.offers.push(injectedDivine); expect(buy(r, injectedDivine.uid)).toBe(r);
  valid(r);
 });

 it('permits selling a Divine Ability without allowing Merchant acquisition', () => {
  const r = atNode('merchant'); const divine = instance(r, DIVINE_CARD_IDS[0]); r.deck.push(divine);
  const sold = sell(r, divine.uid); expect(sold.deck.some(c => c.uid === divine.uid)).toBe(false); expect(sold.gold).toBe(r.gold + 65); expect(sold.stats.gold).toBe(r.stats.gold + 65);
 });

 it('offers mutually exclusive rest actions and honors paid Event upgrades and rare rewards', () => {
  const resting = atNode('rest'); resting.hp = 20;
  const healed = restHeal(resting); expect(healed.hp).toBe(38); expect(upgrade(healed, healed.deck[0].uid)).toBe(healed);
  const upgraded = upgrade(resting, resting.deck[0].uid); expect(upgraded.hp).toBe(20); expect(restHeal(upgraded)).toBe(upgraded);
  const furnace = atNode('event', 41, 2); const paid = chooseEvent(furnace, 0); expect(paid.phase).toBe('rest'); expect(paid.gold).toBe(furnace.gold - 25); expect(restHeal(paid)).toBe(paid);
  const finished = upgrade(paid, paid.deck[0].uid); expect(finished.phase).toBe('road'); expect(finished.visited).toContain('event');
  const reflection = atNode('event', 44, 3); const rare = chooseEvent(reflection, 1); expect(rare.hp).toBe(reflection.hp - 5); expect(rare.offers.every(c => CARDS[c.defId].rarity === 'rare')).toBe(true);
  const poor = atNode('event', 41, 1); poor.gold = 0; expect(eventDisabled(poor, 1)).toBe(true); expect(chooseEvent(poor, 1)).toBe(poor);
 });

 it('persists terminal loss, records one immutable history result, and adds only content unlocks', () => {
  const r = atNode('combat'); const loss = structuredClone(r.combat!); loss.player.hp = 0; loss.phase = 'lost'; loss.actions.push({ type: 'endTurn', turn: loss.turn });
  const dead = commitCombat(r, loss); expect(dead.phase).toBe('dead'); expect(enterNode(dead, 'any')).toBe(dead); expect(commitCombat(dead, r.combat!)).toBe(dead);
  const meta = updateMeta(emptyMeta(), dead, 9000); const again = updateMeta(meta, dead, 10000); expect(again.history).toHaveLength(1); expect(again.history[0].duration).toBe(0); expect(again.unlocks).toEqual(['ink-cardback']);
  dead.stats.combats = 500; expect(meta.history[0].stats.combats).not.toBe(500);
  expect(updateMeta(emptyMeta(), retire(started()), 9000).history[0].cause.en).toBe('Journey relinquished'); valid(dead);
 });
});

describe('seeded acquisition sampling — generator evidence, not combat balance', () => {
 it('replays the same starting and reward decisions with identical generated content', () => {
  const trajectory = (seed: number) => {
   const r = started(seed); const trace: unknown[] = [r.offers, r.nodes, r.bossId];
   for (let i = 0; i < 20; i++) { const offers = drawOffers(r, 3, i % 3 === 0 ? 'elite' : 'normal'); trace.push(offers); r.deck.push(offers[0]); }
   return { trace, rng: r.rng };
  };
  expect(trajectory(989)).toEqual(trajectory(989)); expect(trajectory(989)).not.toEqual(trajectory(990));
 });

 it('observes every ordinary Dao Art through normal rewards despite a dominant build', () => {
  const observed = new Set<string>(); const archetypes = new Set<string>(); let rewardOffers = 0;
  for (let seed = 1; seed <= 300; seed++) {
   const r = started(seed); r.deck = r.deck.map(c => ({ ...c, defId: 'flying-arsenal' }));
   for (let draw = 0; draw < 12; draw++) for (const card of drawOffers(r, 3, 'normal')) {
    rewardOffers++; observed.add(card.defId); archetypes.add(CARDS[card.defId].archetype);
    expect(['dao','immortal']).toContain(CARDS[card.defId].category); expect(card.grade).toBe(0);
   }
  }
  expect(rewardOffers).toBe(10800); expect(DAO_CARD_IDS.filter(id => !observed.has(id))).toEqual([]);
  for (const archetype of new Set(Object.values(CARDS).filter(c=>['dao','immortal'].includes(c.category)).map(c=>c.archetype))) expect(archetypes.has(archetype), archetype).toBe(true);
  expect([...observed].some(id => ENEMIES[id])).toBe(false);
 });
});

describe('revision economy, timing and reward contracts',()=>{
 it('can skip every reward through all five realms with the original twelve-card deck',()=>{
  let r=started(711),steps=0;const owned=structuredClone(r.deck);
  while(!['dead','ascended'].includes(r.phase)&&steps++<200){
   if(r.phase==='road'){const node=r.nodes.find(n=>n.kind==='rest')??r.nodes.find(n=>n.kind==='merchant')??r.nodes[0];r=enterNode(r,node.id);}
   else if(r.phase==='combat')r=victory(r);
   else if(['reward','inheritance','breakthrough'].includes(r.phase)){const receipt=getPendingProgression(r);if(receipt?.kind==='major')r=continueBreakthrough(r,receipt.id);r=takeReward(r,null);}
   else if(r.phase==='rest')r=restHeal(r);else if(r.phase==='merchant')r=leaveMerchant(r);else if(r.phase==='event')r=chooseEvent(r,1);
   valid(r);
  }
  expect(r.phase).toBe('ascended');expect(r.deck).toEqual(owned);expect(r.stats.tribulations).toBe(5);expect(r.routeHistory).toHaveLength(26);
  expect(r.progressionReceipts.filter(receipt=>receipt.kind==='major')).toHaveLength(5);
 });
 it('validates batch removal and swaps against the final realm floor before charging or paying',()=>{
  for(let realm=0;realm<5;realm++){
   const r=fillTo(atNode('merchant'),REALMS[realm].minDeck+1);r.realm=realm;r.gold=1000;
   const ids=r.deck.slice(0,2).map(card=>card.uid),before=structuredClone(r);
   expect(canRemovePermanentCards(r,ids,{kind:'sale'})).toBe(false);expect(removePermanentCards(r,ids,{kind:'sale'})).toBe(r);expect(r).toEqual(before);
   const sale=removePermanentCards(r,[ids[0]],{kind:'sale'});expect(sale.deck).toHaveLength(REALMS[realm].minDeck);expect(sale.gold).toBe(r.gold+salePrice(r.deck[0]));
   expect(sell(sale,ids[1])).toBe(sale);
   sale.phase='event';const replacement=instance(sale,'ember-brand');const swapped=removePermanentCards(sale,[ids[1]],{kind:'swap',additions:[replacement],cost:20});
   expect(swapped.deck).toHaveLength(REALMS[realm].minDeck);expect(swapped.deck).toContainEqual(replacement);expect(swapped.gold).toBe(sale.gold-20);
   expect(removePermanentCards(sale,[ids[1]],{kind:'event',cost:20,proceeds:100})).toBe(sale);
   expect(removePermanentCards(sale,['missing'],{kind:'event',proceeds:100})).toBe(sale);
  }
  const batch=fillTo(atNode('merchant'),16),ids=batch.deck.slice(0,3).map(card=>card.uid),done=removePermanentCards(batch,ids,{kind:'sale'});
  expect(done.deck).toHaveLength(13);expect(done.shop.sold).toBe(3);expect(sell(done,done.deck[0].uid)).toBe(done);
 });
 it('records minor stage notices with zero bonus stats and acknowledges them without RNG',()=>{
  let r=started();r.depth=1;r.nodes=[{id:'minor-rest',kind:'rest'}];r=enterNode(r,'minor-rest');const before=structuredClone(r),road=restHeal(r),receipt=getPendingProgression(road)!;
  expect(receipt).toMatchObject({kind:'minor',from:{realm:0,stage:0},to:{realm:0,stage:1},grants:{maxHp:0,healing:0,gold:0,energy:0,normalGrade:0},acknowledged:false});
  expect(road.maxHp).toBe(before.maxHp);expect(road.gold).toBe(before.gold);const saved=decodeSave(encodeSave({...freshSave(),run:road}))!;expect(getPendingProgression(saved.run!)).toEqual(receipt);
  const ack=acknowledgeProgression(road,receipt.id);expect(ack.rng).toBe(road.rng);expect(getPendingProgression(ack)).toBeNull();expect(acknowledgeProgression(ack,receipt.id)).toBe(ack);expect(continueBreakthrough(road,receipt.id)).toBe(road);
 });
 it('never resurfaces an older minor notice after a major Continue and presents the next new minor',()=>{
  let r=atNode('rest');r.depth=1;r=restHeal(r);const oldMinor=structuredClone(getPendingProgression(r)!);
  r.depth=roadLength(0)-1;r.nodes=[{id:'notice-tribulation',kind:'tribulation',encounter:[r.bossId]}];r=victory(enterNode(r,'notice-tribulation'));
  const major=getPendingProgression(r)!;expect(major.kind).toBe('major');r=continueBreakthrough(r,major.id);
  const afterContinue=structuredClone(r);expect(getPendingProgression(r)).toBeNull();expect(r).toEqual(afterContinue);expect(r.progressionReceipts[0]).toEqual(oldMinor);
  r=takeReward(r,null);r=takeReward(r,null);r.depth=1;r.nodes=[{id:'later-minor-rest',kind:'rest'}];r=restHeal(enterNode(r,'later-minor-rest'));
  expect(getPendingProgression(r)).toMatchObject({kind:'minor',from:{realm:1,stage:0},to:{realm:1,stage:1},acknowledged:false});
  expect(getPendingProgression(r)!.id).not.toBe(oldMinor.id);expect(r.progressionReceipts[0]).toEqual(oldMinor);
 });
 it('awards the configured breakthrough receipt exactly once and stores resumable Divine choices',()=>{
  const before=atNode('tribulation');before.depth=roadLength(0)-1;before.combat!.player.hp=60;before.hp=60;
  const after=victory(before),receipt=getLastBreakthrough(after)!;expect(receipt).toMatchObject({fromRealm:0,toRealm:1,gold:80,maxHpGain:12,energyBefore:3,energyAfter:4,normalGradeAfter:1,maxUsableGradeAfter:2,hpBefore:60,hpAfter:84,actualHealing:24});
  expect(after.gold-before.gold).toBe(receipt.gold);expect(after.offers).toHaveLength(receipt.divineChoices);expect(commitCombat(after,after.combat!)).toBe(after);
  const major=getPendingProgression(after)!;expect(major).toMatchObject({kind:'major',view:'receipt',from:{realm:0,stage:3},to:{realm:1,stage:0},grants:{maxHp:12,healing:24,gold:80,energy:1,normalGrade:1},pendingChoices:{kind:'divine',count:3,maxAcquisitions:1,roundsRemaining:1,optional:true}});
  expect(takeReward(after,null)).toBe(after);const continued=continueBreakthrough(after,major.id);expect(continued.gold).toBe(after.gold);expect(continued.hp).toBe(after.hp);expect(continued.rng).toBe(after.rng);expect(continued.offers).toEqual(after.offers);expect(continueBreakthrough(continued,major.id)).toBe(continued);valid(continued);
  expect(BREAKTHROUGH_PACKAGES.map(p=>p.gold)).toEqual([80,95,110,125,140]);expect(BREAKTHROUGH_PACKAGES[4].toRealm).toBeNull();
  expect(Object.values(ENCOUNTER_HINTS).every(h=>h.en&&h['zh-CN']&&h.vi)).toBe(true);
 });
 it('profiles the actual nonbasic permanent deck and leaves every off-Path card eligible',()=>{
  const r=started(878);r.deck=r.deck.slice(0,10);
  expect(deckProfile(r).size).toBe(0);
  r.deck.push(instance(r,'flying-arsenal'),instance(r,'flying-arsenal'));
  const profile=deckProfile(r);expect(profile.size).toBe(2);expect(profile.paths.sword).toBe(2);
  for(const id of DAO_CARD_IDS)expect(offerWeight(r,CARDS[id])).toBeGreaterThan(0);
  const before=structuredClone(r),offers=drawOffers(r);expect(offers).toHaveLength(5);expect(new Set(offers.map(c=>c.defId)).size).toBe(5);
  expect(drawOffers(before)).toEqual(offers);
 });
 it('resumes a stored five-choice reward without consuming RNG or replacing offer identities',()=>{
  const reward=victory(atNode('combat',224));const stored=decodeSave(encodeSave({...freshSave(),run:reward}))!;
  expect(stored.run!.offers).toEqual(reward.offers);expect(stored.run!.rng).toBe(reward.rng);expect(stored.run!.serial).toBe(reward.serial);
  expect(takeReward(stored.run!,stored.run!.offers[2].uid)).toEqual(takeReward(reward,reward.offers[2].uid));
 });
 it('keeps offered identities stable through reload and never charges for a quote or cancel',()=>{
  const r=atNode('merchant');r.gold=1000;const before=structuredClone(r);
  const quote=previewUpgrade(r,r.deck[0].uid,'en');expect(quote.available).toBe(true);expect(quote.after!.grade).toBe(quote.before!.grade+1);
  expect(r).toEqual(before);expect(previewUpgrade(r,r.deck[0].uid,'zh-CN').cost).toBe(quote.cost);
  const next=confirmUpgrade(r,quote);expect(next.gold).toBe(r.gold-quote.cost);expect(next.rng).toBe(r.rng);
  expect(confirmUpgrade(next,quote)).toBe(next);expect(confirmUpgrade(r,{...quote,uid:'missing'})).toBe(r);
  expect(confirmUpgrade({...r,gold:0},quote).gold).toBe(0);
  expect(confirmUpgrade(r,{...quote,cost:0})).toBe(r);
 });
 it('caps the advertised Rest heal to missing HP and has no grade-based resale arbitrage',()=>{
  const r=atNode('rest');r.hp=r.maxHp-3;expect(restPreview(r).heal).toBe(3);expect(restHeal(r).hp).toBe(r.maxHp);
  for(const card of Object.values(CARDS).filter(c=>['dao','immortal','basic'].includes(c.category))){
   for(let grade=0;grade<5;grade++){
    const c=instance(r,card.id,grade);expect(salePrice(c)).toBeLessThan(price(c));
    expect(salePrice({...c,grade:(grade+1) as 1})-salePrice(c)).toBeLessThan(upgradeCost(r));
   }
  }
 });
 it('counts only explicitly supplied active time, preserves RNG and refuses long background gaps',()=>{
  const r=started(15),rng=r.rng;const active=recordActiveTime(r,1250);
  expect(active.activeMs).toBe(1250);expect(active.rng).toBe(rng);expect(active.revision).toBe(r.revision);
  expect(recordActiveTime(active,60001)).toBe(active);expect(recordActiveTime(active,Infinity)).toBe(active);
  const ended=retire(active);expect(recordActiveTime(ended,1000)).toBe(ended);
  expect(updateMeta(emptyMeta(),ended,999999999).history[0].duration).toBe(1250);
 });
 it('persists three utility alternatives and appends the selected route identity once',()=>{
  const reward=victory(atNode('combat'));const road=takeReward(reward,null);
  expect(road.nodes).toHaveLength(3);expect(new Set(road.nodes.map(n=>n.kind)).size).toBe(3);
  expect(road.nodes.every(n=>!n.encounter)).toBe(true);expect(road.routeHistory).toHaveLength(1);
  expect(road.routeHistory[0].node.id).toBe('controlled-node');expect(road.visited).toEqual(['combat']);valid(road);
 });
});
