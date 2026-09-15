// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

/** Ordinary seeded bot runs. No fixture decks, modified HP, debug wins or hidden draws. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULES } from '../src/game/rules';
import { CARDS, REALMS, SUMMONS } from '../src/game/content';
import { cardCost, endTurn, enemyIntentThreat, playCard, playableReason, previewCard, pursuitState, resolveChoice } from '../src/game/combat';
import { acknowledgeProgression, buy, canUpgrade, chooseEvent, chooseStarting, commitCombat, continueBreakthrough, emptyMeta, enterNode, eventDisabled, getPendingProgression, leaveMerchant, newRun, price, restHeal, sell, takeReward, updateMeta, upgrade, upgradeCost, RULES_VERSION, CONTENT_VERSION, type Run } from '../src/game/run';
import { freshSave, validateSave } from '../src/game/save';
import type { CardInstance, Combat, Effect, Path, TidalState } from '../src/game/types';

import { diagnosticMetadata } from './diagnostic-metadata';

// Revision 4 adapts uncapped optional growth, progression receipts, and explicit
// activation targets. Combat scoring retains revision 3's visible-Dodge correction.
export const BOT_POLICY_VERSION = 4;
const prioritizeSacrifice = process.argv.includes('--sacrifice');
const strategies: { name: string; paths: Path[] }[] = [
 { name: 'ember-blade', paths: ['fire','sword','strength'] },
 { name: 'living-fortress', paths: ['wood','summoning','earth'] },
 { name: 'tide-reader', paths: ['water','wind','wisdom'] },
 { name: 'blade-furnace', paths: ['sword','refinement','formation'] },
];
const priorities: Record<string, number> = {
 'crimson-fang': 37, 'spring-return': 22, 'reed-wolf-pact': 33, 'thorn-familiar': 31,
 'stone-rampart': 25, 'flying-arsenal': 26, 'still-sword-heart': 25, 'unbroken-flow': 26,
 'deep-reservoir': 25, 'crucible-shell': 23, 'battle-roar': 24, 'fundamentals': 25,
 'rooted-stance': 20, 'cinder-fuse': 19, 'ancestral-offering': 5, 'golden-breath': 9,
};
const magnitude = (e: Effect, c: CardInstance) => (e.amount ?? 0) + (e.upgrade ?? 0) * (c.tempGrade ?? c.grade) + (e.perRetained ?? 0) * c.retained;
function keepValue(card: CardInstance, paths: Path[], deck: CardInstance[] = []): number {
 const def = CARDS[card.defId];
 if (def.category === 'status') return -100;
 if (def.category === 'basic') return 4 + card.grade * 5;
 let score = priorities[card.defId] ?? (def.category === 'immortal' ? 30 : def.category === 'divine' ? 32 : 17);
 if (prioritizeSacrifice && card.defId === 'ancestral-offering') score = 55;
 if (paths.includes(def.path as Path)) score += 12;
 if (def.effects.some(e => e.op === 'summon') && deck.filter(c => CARDS[c.defId].effects.some(e => e.op === 'summon')).length >= 4) score -= 8;
 if (def.effects.some(e => e.op === 'flyingSwords') && deck.some(c => CARDS[c.defId].effects.some(e => e.status === 'swordIntent' || e.id === 'refiningArmor'))) score += 9;
 return score + card.grade * 5;
}
export function incoming(c: Combat): number {
 return c.enemies.filter(e => e.hp > 0).reduce((sum, enemy) => {
  const threat = enemyIntentThreat(c, enemy.id);
  return sum + (threat.warning ? 0 : threat.total);
 }, 0);
}
/** Scoring observes an enemy; activation obeys the card's authored target. */
export function playTarget(c: Combat, card: CardInstance, observedEnemyId: string): string | undefined {
 const target=CARDS[card.defId].target;
 return target==='self'?c.player.id:target==='none'?undefined:observedEnemyId;
}
export function scorePlay(c: Combat, card: CardInstance, targetId: string): number {
 const def = CARDS[card.defId], cost = cardCost(c, card), target = c.enemies.find(e => e.id === targetId)!;
 let score = -cost * 1.7;
 if (def.category === 'status' && !def.unplayable) score += 5; // Remove a playable Heart Demon when there is spare tempo.
 const preview = previewCard(c, card.uid, targetId);
 score += preview.hp * 1.4 + preview.armor * .3 + (preview.hp >= target.hp ? 12 : 0) - preview.selfHp * 2;
 // A blocked probe is still progress: it spends an explicitly visible Dodge.
 // Without this, the bot ended turns holding free Flying Swords at score 0.
 const probesDodge = def.effects.some(e => (e.op === 'damage' && (e.target === 'enemy' || e.target === 'allEnemies')) || ['consumeSword', 'detonate', 'mountainBreak'].includes(e.op));
 if ((target.statuses.dodge ?? 0) > 0 && probesDodge) score += 4;
 const threat = Math.max(0, incoming(c) - c.player.armor);
 for (const e of def.effects) {
  const amount = magnitude(e, card) + (e.pursuit && pursuitState(c, card)[e.pursuit.condition] ? e.pursuit.amount : 0);
  if (e.op === 'armor') score += Math.min(amount, threat) * 1.2 + Math.max(0, amount - threat) * .04;
  if (e.op === 'heal') score += Math.min(amount, c.player.maxHp - c.player.hp) * 2.5;
  if (e.op === 'energy') score += amount * (c.hand.length > 2 ? 4.5 : 1);
  if (e.op === 'draw') score += Math.min(amount, RULES.handSize - c.hand.length) * (c.energy > cost ? 3.5 : .3);
  if (e.op === 'maxEnergy') score += amount * 11;
  if (e.op === 'flyingSwords') score += amount * (2 + (c.player.statuses.swordIntent ?? 0) + (c.player.statuses.strength ?? 0));
  if (e.op === 'summon') score += c.summons.length < RULES.summonSlots ? 19 + (SUMMONS[e.id ?? '']?.attack ?? 0) : 1;
  if (e.op === 'power') score += e.id === 'refiningArmor' ? 13 : e.id === 'swordFoundry' ? 17 : 12;
  if (e.op === 'status') {
   const stacks = c.player.statuses[e.status!] ?? 0;
   const value = e.status === 'strength' ? Math.min(amount, Math.max(0, RULES.statusCaps.strength - stacks)) * 7 :
    e.status === 'swordIntent' ? Math.min(amount, Math.max(0, RULES.statusCaps.swordIntent - stacks)) * 4 :
    e.status === 'basicPower' ? amount * 5 : e.status === 'fortify' ? amount * 3 :
    e.status === 'regen' ? Math.min(amount * 2, c.player.maxHp - c.player.hp) * 2 :
    e.status === 'seed' ? amount * 3 : e.status === 'tidalMomentum' ? amount * 4 :
    e.status === 'windMomentum' ? amount * 2 : e.status === 'weak' ? threat * .25 :
    e.status === 'vulnerable' ? amount * 1.5 : e.status === 'protectiveQi' ? Math.min(threat, amount) * .45 : amount * 1.8;
   score += value;
  }
  if (prioritizeSacrifice && e.op === 'sacrifice') score += 15;
  if (e.op === 'teamBuff') score += c.summons.length >= 2 ? amount * c.summons.length * 5 : 0;
  if (e.op === 'overwhelm') score += c.summons.length >= 2 ? 8 : 0;
  if (e.op === 'recover') score += Math.min(e.count ?? 1, (e.from === 'exhaust' ? c.exhaust : c.discard).filter(x => !e.attackOnly || CARDS[x.defId].kind === 'attack').length) * (c.energy > cost ? 4 : .5);
  if (e.op === 'scry' || e.op === 'search' || e.op === 'reorder') score += c.energy > cost ? 3 : .5;
  if (e.op === 'refine') score += c.hand.some(x => x.uid !== card.uid && (x.tempGrade ?? x.grade) < Math.min(7, c.realm + 1) && !['token', 'status', 'divine'].includes(CARDS[x.defId].category)) ? 6 : 0;
  if (e.op === 'exhaust') score += c.hand.some(x => CARDS[x.defId].category === 'basic') ? 3 : -2;
  if (e.op === 'discard') score += c.hand.some(x => CARDS[x.defId].onDiscard) ? 3 : -2;
  if (e.op === 'costReduce') score += Math.min(c.hand.length - 1, c.energy) * 2;
  if (e.op === 'nextWindDiscount') score += c.hand.some(x => x.uid !== card.uid && CARDS[x.defId].path === 'wind' && CARDS[x.defId].cost > 0) ? amount * 4 : 0;
 }
 if (c.tidal && c.energy - cost === 0) score -= 4 + (c.player.statuses.tidalMomentum ?? 0) * 1.5;
 return score;
}
export function choiceIds(c: Combat, paths: Path[]): string[] {
 const choice = c.choice!;
 if (choice.kind === 'tidal') return [tidalState(c)];
 // Only the IDs explicitly revealed by the active choice may be inspected.
 const revealed = choice.ids.map(id => [...c.hand, ...c.draw, ...c.discard, ...c.exhaust].find(card => card.uid === id)!).filter(Boolean);
 const score = (card: CardInstance) => keepValue(card, paths);
 if (choice.kind === 'reorder') return revealed.sort((a,b) => score(b) - score(a)).map(card => card.uid);
 if (choice.kind === 'scry') return revealed.filter(card => CARDS[card.defId].category === 'status' || (CARDS[card.defId].category === 'basic' && card.grade < c.realm)).map(card => card.uid).slice(0, choice.count);
 if (choice.kind === 'discard') return revealed.sort((a,b) => (CARDS[b.defId].onDiscard ? 100 : -score(b)) - (CARDS[a.defId].onDiscard ? 100 : -score(a))).slice(0, Math.max(choice.min ?? 0, Math.min(choice.count, 1))).map(card => card.uid);
 if (choice.kind === 'exhaust') return revealed.sort((a,b) => score(a) - score(b)).slice(0, Math.max(choice.min ?? 0, Math.min(choice.count, 1))).map(card => card.uid);
 return revealed.sort((a,b) => score(b) - score(a)).slice(0, choice.count).map(card => card.uid);
}
export function tidalState(c: Combat): TidalState { return incoming(c) - c.player.armor > 12 ? 'tranquil' : (c.player.statuses.tidalMomentum ?? 0) < 2 ? 'rising' : 'raging'; }
function bestReward(r: Run, paths: Path[]): Run {
 const sorted = [...r.offers].sort((a,b) => keepValue(b, paths, r.deck) - keepValue(a, paths, r.deck));
 const best = sorted[0]; if (!best) return takeReward(r, null);
 // Deck growth is optional and uncapped. Skip a normal offer that would lower
 // this policy's mean card value; do not manufacture a replacement or a cap.
 const mean = r.deck.reduce((sum,card) => sum + keepValue(card, paths, r.deck), 0) / Math.max(1, r.deck.length);
 if (r.rewardKind !== 'divine' && keepValue(best, paths, r.deck) <= mean) return takeReward(r, null);
 return takeReward(r, best.uid);
}
function chooseUpgrade(r: Run, paths: Path[]) { return [...r.deck].filter(card => canUpgrade(r, card)).sort((a,b) => keepValue(b, paths, r.deck) - keepValue(a, paths, r.deck))[0]; }
export function simulate(seed: number, strategyIndex: number) {
 const strategy = strategies[strategyIndex % strategies.length]; let r = newRun(seed, 0), steps = 0, turns = 0, failure: string | null = null;
 const acquired = new Set<string>(), observed = new Set<string>(), realmsReached = new Set<number>(), playedCards = new Set<string>(), eventCodes = new Set<string>(); const started = performance.now();
 try {
  while (!['dead','ascended'].includes(r.phase) && steps++ < 12000) {
   const pending=getPendingProgression(r);
   if(pending){r=pending.kind==='major'?continueBreakthrough(r,pending.id):acknowledgeProgression(r,pending.id);continue;}
   realmsReached.add(r.realm); r.offers.forEach(card => observed.add(CARDS[card.defId].archetype));
   if (r.phase === 'starting') {
    const card = [...r.offers].sort((a,b) => keepValue(b, strategy.paths) - keepValue(a, strategy.paths))[0]; r = chooseStarting(r, card.uid);
   } else if (r.phase === 'road') {
    const nodeScore = (kind: string) => kind === 'rest' ? (r.hp < r.maxHp * .7 ? 100 : 30) : kind === 'inheritance' ? 36 : kind === 'merchant' ? (r.gold >= 65 ? 50 : 10) : kind === 'event' ? 25 : kind === 'combat' ? 15 : kind === 'elite' ? 8 : 0;
    const node = [...r.nodes].sort((a,b) => nodeScore(b.kind) - nodeScore(a.kind))[0]; r = enterNode(r, node.id);
   } else if (r.phase === 'combat') {
    const c = r.combat!;
    if (c.turn > 150 || c.actions.length > 3000) throw new Error('bot diagnostic limit: unresolved combat');
    let next: Combat;
    if (c.choice) next = resolveChoice(c, choiceIds(c, strategy.paths));
    else {
     const candidates = c.hand.filter(card => !playableReason(c, card)).flatMap(card => c.enemies.filter(enemy => enemy.hp > 0).map(enemy => ({ card, target: enemy.id, score: scorePlay(c, card, enemy.id) })));
     candidates.sort((a,b) => b.score - a.score);
     const best = candidates[0];
     if (best && best.score > .25) { next = playCard(c, best.card.uid, playTarget(c,best.card,best.target)); if (next !== c) playedCards.add(best.card.defId); }
     else { next = endTurn(c, c.tidal ? tidalState(c) : undefined); turns++; }
    }
    if (next === c) throw new Error(`bot produced no-op combat action, choice=${c.choice?.kind ?? 'none'}`);
    next.events.slice(c.events.length).forEach(event => eventCodes.add(event.code));
    r = commitCombat(r, next);
   } else if (r.phase === 'reward' || r.phase === 'inheritance' || r.phase === 'breakthrough') r = bestReward(r, strategy.paths);
   else if (r.phase === 'rest') {
    const card = chooseUpgrade(r, strategy.paths);
    r = r.current?.eventId !== 99 && (r.hp < r.maxHp * .72 || !card) ? restHeal(r) : upgrade(r, card.uid);
   } else if (r.phase === 'event') {
    const e = r.current?.eventId ?? 0;
    let option = e === 0 ? (r.hp < r.maxHp - 8 ? 1 : 0) : e === 1 ? 0 : e === 2 ? 0 : (r.hp < r.maxHp - 12 ? 0 : 1);
    if (eventDisabled(r, option)) option = 1 - option; r = chooseEvent(r, option);
   } else if (r.phase === 'merchant') {
    const candidates = r.offers.filter(card => !r.shop.purchased.includes(card.uid) && price(card) <= r.gold).sort((a,b) => keepValue(b, strategy.paths, r.deck) - keepValue(a, strategy.paths, r.deck));
    const worst = [...r.deck].sort((a,b) => keepValue(a, strategy.paths, r.deck) - keepValue(b, strategy.paths, r.deck))[0];
    if (candidates[0] && keepValue(candidates[0], strategy.paths, r.deck) > keepValue(worst, strategy.paths, r.deck) + 4) r = buy(r, candidates[0].uid);
    else {
     const card = chooseUpgrade(r, strategy.paths);
     if (r.shop.upgraded < 2 && r.gold >= upgradeCost(r) && card) r = upgrade(r, card.uid);
     else if (r.shop.sold < 3 && r.deck.length > REALMS[r.realm].minDeck && CARDS[worst.defId].category === 'basic' && worst.grade < r.realm) r = sell(r, worst.uid);
     else r = leaveMerchant(r);
    }
   }
   r.deck.forEach(card => { if (CARDS[card.defId].category !== 'basic') acquired.add(CARDS[card.defId].archetype); });
   if (r.phase !== 'combat' || steps % 50 === 0) {
    if (!validateSave({ ...freshSave(), run: r, meta: updateMeta(emptyMeta(), r, 0) })) throw new Error(`save contract rejected ordinary ${r.phase}, realm ${r.realm}, depth ${r.depth}`);
   }
  }
  if (!['dead','ascended'].includes(r.phase)) failure = 'bot diagnostic limit: run incomplete';
 } catch (error) { failure = error instanceof Error ? error.message : String(error); }
 return { seed, strategy: strategy.name, outcome: r.phase, realm: r.realm, depth: r.depth, hp: r.hp, stats: r.stats, turns, actions: steps, acquiredArchetypes: [...acquired].sort(), observedArchetypes: [...observed].sort(), playedCards: [...playedCards].sort(), eventCodes: [...eventCodes].sort(), realmsReached: [...realmsReached], deck: r.deck.map(card => ({ id: card.defId, grade: card.grade })), computeMs: Math.round(performance.now() - started), failure };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
const count = Math.max(1, Number(process.argv[2] ?? 12));
const results = Array.from({ length: count }, (_, i) => {
 const result = simulate(1009 + i * 7919, prioritizeSacrifice ? 1 : i);
 console.log(JSON.stringify({ seed: result.seed, strategy: result.strategy, outcome: result.outcome, realm: result.realm, depth: result.depth, turns: result.turns, failure: result.failure }));
 return result;
});
const report = { ...diagnosticMetadata('scripts/simulate.ts'), rules: RULES_VERSION, content: CONTENT_VERSION, policyRevision: BOT_POLICY_VERSION, timing: 'computeMs measures machine runtime, not human play duration', source: 'ordinary automated runs; no modified stats, fixtures or hidden-draw policy', policy: prioritizeSacrifice ? 'visible-hand/Intent bot that prioritizes offered Ancestral Offering; not human playtest evidence' : 'heuristic visible-hand/Intent bot; not human playtest evidence', runs: results.length, wins: results.filter(r => r.outcome === 'ascended').length, losses: results.filter(r => r.outcome === 'dead').length, diagnosticFailures: results.filter(r => r.failure).length, acquiredArchetypes: [...new Set(results.flatMap(r => r.acquiredArchetypes))].sort(), observedArchetypes: [...new Set(results.flatMap(r => r.observedArchetypes))].sort(), results };
mkdirSync('artifacts', { recursive: true }); writeFileSync(prioritizeSacrifice ? 'artifacts/bot-runs-sacrifice-v2.json' : 'artifacts/bot-runs-v2.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ runs: report.runs, wins: report.wins, losses: report.losses, diagnosticFailures: report.diagnosticFailures, acquiredArchetypes: report.acquiredArchetypes.length, observedArchetypes: report.observedArchetypes.length }));
}
