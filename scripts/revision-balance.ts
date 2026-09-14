/**
 * Paired synthetic diagnostics, not ordinary-run or human-play evidence.
 * All builds use the real resolver, equal legal deck size/grade/HP/Yuan budgets,
 * and identical encounter seeds. Policies inspect only hand, public board,
 * committed intent and cards explicitly revealed by a pending choice.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CARDS, REALMS } from '../src/game/content';
import { createCombat, endTurn, playCard, playableReason, resolveChoice } from '../src/game/combat';
import { chooseStarting, commitCombat, enterNode, newRun, price, RULES_VERSION, CONTENT_VERSION } from '../src/game/run';
import { RULES } from '../src/game/rules';
import type { CardInstance, Combat, Grade, Path } from '../src/game/types';
import { diagnosticMetadata } from './diagnostic-metadata';
import { BOT_POLICY_VERSION, choiceIds, playTarget, scorePlay, tidalState } from './simulate';

type Policy = 'strike-spam' | 'board-aware';
interface Build { id: string; paths: Path[]; opening: [string, string]; expanded: string[]; }
export const BUILDS: Build[] = [
  { id: 'pure-sword', paths: ['sword'], opening: ['still-sword-heart', 'flying-arsenal'], expanded: ['still-sword-heart', 'flying-arsenal', 'twin-stars', 'last-word', 'severing-arc', 'flying-arsenal'] },
  { id: 'pure-fire', paths: ['fire'], opening: ['ember-brand', 'cinder-fuse'], expanded: ['ember-brand', 'cinder-fuse', 'wildfire-thread', 'ash-rain', 'banked-coals', 'ember-brand'] },
  { id: 'sword-strength', paths: ['sword', 'strength'], opening: ['flying-arsenal', 'battle-roar'], expanded: ['flying-arsenal', 'battle-roar', 'still-sword-heart', 'fundamentals', 'twin-stars', 'measured-practice'] },
  { id: 'wisdom-wind', paths: ['wisdom', 'wind'], opening: ['read-the-current', 'wind-slash'], expanded: ['read-the-current', 'wind-slash', 'wind-step', 'chasing-blade', 'flowing-guard', 'storm-script'] },
  { id: 'sword-refinement', paths: ['sword', 'refinement'], opening: ['flying-arsenal', 'crucible-shell'], expanded: ['flying-arsenal', 'crucible-shell', 'still-sword-heart', 'reclaim-the-edge', 'burn-impurities', 're-refinement'] },
];
const ENCOUNTERS = [
  { id: 'normal', enemies: ['road-bandit'] },
  { id: 'elite', enemies: ['jade-hunter'] },
  { id: 'cloud', enemies: ['cloud-beastmaster'] },
];
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const mean = (values: number[]) => Math.round(values.reduce((sum, n) => sum + n, 0) / Math.max(1, values.length) * 100) / 100;
export function diagnosticDeck(build: Build, realm: number): CardInstance[] {
  const arts = realm === 0 ? build.opening : build.expanded;
  const ids = [...Array<string>(5).fill('strike'), ...Array<string>(5).fill('defense'), ...arts];
  if (ids.length !== REALMS[realm].minDeck) throw new Error(`Illegal diagnostic deck size: ${build.id}`);
  for (const id of arts) if (CARDS[id].category !== 'dao' || CARDS[id].rarity !== 'common') throw new Error(`Budget mismatch: ${id}`);
  return ids.map((defId, index) => ({ uid: `diagnostic-${index}`, defId, grade: realm as Grade, retained: 0 }));
}
/** Strike-spam is deliberately a naive baseline: play every affordable Strike,
 * never spend Yuan on another card, then end. Its scope is explicit so results
 * cannot be mistaken for a search over optimal Basic-card strategies. */
function decide(c: Combat, build: Build, policy: Policy): Combat {
  if (c.choice) return resolveChoice(c, choiceIds(c, build.paths));
  const candidates = c.hand.filter(card => !playableReason(c, card) && (policy !== 'strike-spam' || card.defId === 'strike'))
    .flatMap(card => c.enemies.filter(enemy => enemy.hp > 0).map(enemy => ({ card, target: enemy.id, score: scorePlay(c, card, enemy.id) })));
  candidates.sort((a, b) => b.score - a.score || a.card.uid.localeCompare(b.card.uid) || a.target.localeCompare(b.target));
  const best = candidates[0];
  if (best && (policy === 'strike-spam' || best.score > .25)) return playCard(c, best.card.uid, playTarget(c,best.card,best.target));
  return endTurn(c, c.tidal ? tidalState(c) : undefined);
}
export function playFight(initial: Combat, build: Build, policy: Policy) {
  let state = initial, error: string | null = null;
  try {
    while (state.phase === 'player') {
      if (state.turn > 100 || state.actions.length >= 1400) throw new Error('Diagnostic bound reached; no result awarded');
      const next = decide(state, build, policy);
      if (next === state) throw new Error(`Policy produced a no-op ${state.choice?.kind ?? 'play'}`);
      state = next;
    }
  } catch (caught) { error = caught instanceof Error ? caught.message : String(caught); }
  const sum = (code: string, field: string, predicate: (target: string) => boolean) => state.events.filter(event => event.code === code && predicate(String(event.values?.target))).reduce((n, event) => n + Number(event.values?.[field] ?? 0), 0);
  const player = (id: string) => id === 'player', enemy = (id: string) => id.startsWith('enemy-');
  return {
    state,
    metrics: {
      outcome: error ? 'incomplete' : state.phase,
      error,
      playerTurns: state.turn,
      turnEnds: state.actions.filter(action => (action as { type: string }).type === 'endTurn').length,
      actions: state.actions.length,
      cardsPlayed: state.playHistory.length,
      hpRemaining: state.player.hp,
      hpLost: sum('damage', 'hp', player) + sum('directLoss', 'amount', player),
      armorAbsorbed: sum('damage', 'armor', player),
      healed: sum('heal', 'amount', player),
      enemyHpLost: sum('damage', 'hp', enemy) + sum('directLoss', 'amount', enemy),
      enemyArmorRemoved: sum('damage', 'armor', enemy),
      statusCardsAdded: state.events.filter(event => event.code === 'statusCardAdded').reduce((n, event) => n + Number(event.values?.amount ?? 0), 0),
      actionsHash: hash(state.actions),
      resolutionHash: hash({ actions: state.actions, events: state.events, hp: state.player.hp, phase: state.phase }),
    },
  };
}
function ordinaryOpening(build: Build) {
  for (let seed = 1; seed <= 50000; seed++) {
    let run = newRun(seed, 0);
    const first = run.offers.find(card => card.defId === build.opening[0]);
    if (!first) continue;
    run = chooseStarting(run, first.uid);
    const second = run.offers.find(card => card.defId === build.opening[1]);
    if (!second) continue;
    run = chooseStarting(run, second.uid);
    const openingDeck = run.deck.map(card => ({ id: card.defId, grade: card.grade }));
    const node = run.nodes.find(node => node.kind === 'combat');
    if (!node) throw new Error('Ordinary opening has no mandatory combat');
    run = enterNode(run, node.id);
    const enemies = run.combat!.enemies.map(enemy => enemy.defId);
    const fought = playFight(run.combat!, build, 'board-aware');
    // This transition accepts only real committed resolver actions.
    run = commitCombat(run, fought.state);
    return { build: build.id, seed, method: 'newRun → chooseStarting twice from actual offers → enter first mandatory combat → real legal actions → commitCombat', startingCards: [...build.opening], openingDeck, enemies, combat: fought.metrics, resultingRunPhase: run.phase, offeredRewardIds: run.offers.map(card => card.defId) };
  }
  return { build: build.id, error: 'No matching ordinary starting offers found in the declared seed search range' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
const repetitions = Math.min(32, Math.max(1, Number(process.argv[2] ?? 8)));
const started = performance.now();
const rows: ({ build: string; realm: number; encounter: string; seed: number; policy: Policy } & ReturnType<typeof playFight>['metrics'])[] = [];
const budgets = BUILDS.flatMap(build => [0, 2].map(realm => {
  const deck = diagnosticDeck(build, realm);
  return { build: build.id, realm, deck: deck.map(card => ({ id: card.defId, grade: card.grade })), cards: deck.length, gradeSum: deck.reduce((n, card) => n + card.grade, 0), nominalMerchantValue: deck.reduce((n, card) => n + price(card), 0), hp: newRun(1, 0).maxHp + realm * 12, yuan: RULES.energy[realm] };
}));
for (const realm of [0, 2]) {
  const group = budgets.filter(budget => budget.realm === realm);
  if (new Set(group.map(b => JSON.stringify([b.cards, b.gradeSum, b.nominalMerchantValue, b.hp, b.yuan]))).size !== 1) throw new Error('Unequal diagnostic budget');
}
for (const build of BUILDS) for (const realm of [0, 2]) for (const encounter of ENCOUNTERS) {
  const deck = diagnosticDeck(build, realm), hp = newRun(1, 0).maxHp + realm * 12;
  for (let index = 0; index < repetitions; index++) for (const policy of ['strike-spam', 'board-aware'] as const) {
    const seed = 7001 + index * 7919;
    const config = { seed, realm, hp, maxHp: hp, deck, enemies: encounter.enemies };
    const result = playFight(createCombat(config), build, policy);
    rows.push({ build: build.id, realm, encounter: encounter.id, seed, policy, ...result.metrics });
    if (index === 0 && policy === 'board-aware') {
      const repeat = playFight(createCombat(config), build, policy);
      if (repeat.metrics.resolutionHash !== result.metrics.resolutionHash) throw new Error('Seeded resolution was not deterministic');
    }
  }
  console.log(JSON.stringify({ completed: rows.length, build: build.id, realm, encounter: encounter.id }));
}
const ordinaryOpenings = BUILDS.map(ordinaryOpening);
const summary = BUILDS.flatMap(build => [0, 2].flatMap(realm => ENCOUNTERS.flatMap(encounter => (['strike-spam', 'board-aware'] as const).map(policy => {
  const group = rows.filter(row => row.build === build.id && row.realm === realm && row.encounter === encounter.id && row.policy === policy);
  return { build: build.id, realm, encounter: encounter.id, policy, runs: group.length, wins: group.filter(row => row.outcome === 'won').length, losses: group.filter(row => row.outcome === 'lost').length, incomplete: group.filter(row => row.outcome === 'incomplete').length, meanTurns: mean(group.map(r => r.playerTurns)), meanHpLost: mean(group.map(r => r.hpLost)), meanHpRemaining: mean(group.map(r => r.hpRemaining)), meanArmorAbsorbed: mean(group.map(r => r.armorAbsorbed)), meanEnemyHpLost: mean(group.map(r => r.enemyHpLost)), meanActions: mean(group.map(r => r.actions)) };
}))));
const policySummary = (['strike-spam', 'board-aware'] as const).map(policy => { const group = rows.filter(row => row.policy === policy); return { policy, combats: group.length, wins: group.filter(row => row.outcome === 'won').length, losses: group.filter(row => row.outcome === 'lost').length, incomplete: group.filter(row => row.outcome === 'incomplete').length, meanHpLost: mean(group.map(r => r.hpLost)), meanTurns: mean(group.map(r => r.playerTurns)), meanActions: mean(group.map(r => r.actions)) }; });
const coreCloud = (build: string) => summary.find(row => row.build === build && row.realm === 2 && row.encounter === 'cloud' && row.policy === 'board-aware')!;
const sword = coreCloud('pure-sword'), strength = coreCloud('sword-strength'), refinement = coreCloud('sword-refinement');
const board = policySummary.find(row => row.policy === 'board-aware')!, spam = policySummary.find(row => row.policy === 'strike-spam')!;
const observations = [
  `With the corrected visible-Dodge policy, board-aware wins ${board.wins}/${board.combats} fights versus ${spam.wins}/${spam.combats} for the deliberately naive Strike-only baseline. This does not test every Basic Mastery strategy.`,
  `Core Formation Cloud: Sword/Strength wins ${strength.wins}/${strength.runs}, averaging ${strength.meanTurns} turns and ${strength.meanHpLost} HP lost; Pure Sword wins ${sword.wins}/${sword.runs}, averaging ${sword.meanTurns} turns and ${sword.meanHpLost} HP lost. This measures a specific equal-budget comparison, not universal hybrid superiority.`,
  `Sword/Refinement wins ${refinement.wins}/${refinement.runs} Core Cloud fights with ${refinement.meanTurns} mean turns, ${refinement.meanHpLost} HP lost and ${refinement.meanActions} actions. Compare those costs as well as win rate.`,
  'The unexpanded 12-card Qi decks are deliberately minimal. Their Cloud results do not represent the stronger deck an ordinary run can acquire before its Tribulation.',
  'The sample does not establish enjoyable difficulty or human completion time. The policy remains greedy, expanded decks are constructed, and only three enemy definitions were compared.',
];
const report = {
  ...diagnosticMetadata('scripts/revision-balance.ts'),
  rulesVersion: RULES_VERSION, contentVersion: CONTENT_VERSION, policyRevision: BOT_POLICY_VERSION, rulesSnapshot: RULES,
  source: 'Synthetic constructed diagnostic combat decks; these are not ordinary acquired builds or human playtests.',
  seedPairing: 'Identical seeds, base-card positions, deck size, grade sum, nominal merchant value, HP and Yuan across all builds at each realm. Card-specific Innate behavior remains active.',
  policy: 'board-aware is the shared greedy visible-hand/committed-intent heuristic, including the value of removing visible Dodge; strike-spam plays only affordable Strike cards. Neither reads hidden draw order. No optimal-policy claim.',
  timing: 'computeMs is machine runtime only. Player turns and committed actions are measured; human minutes are not estimated.',
  policyAudit: 'Policy 2 mistakenly valued a free probe into visible Dodge at zero, ending turns with playable Flying Swords. Policy 3 corrected that public-board valuation. Policy 4 adapts explicit activation targets and uncapped progression while retaining that combat scoring. Historical policy 2 and 3 reports are preserved; this is a policy correction, not a game balance change.',
  limitations: ['Only two fixed legal budget points and three enemy definitions are compared.', 'Policies are greedy and do not search all future legal sequences; a weak result can reflect the policy as well as the build.', 'The Strike-only baseline is deliberately naive and does not test every Basic Mastery strategy.', 'Constructed realm-2 decks have equal grades and prices, but their acquisition paths are not simulated.', 'ordinaryOpenings proves actual offer acquisition and the first mandatory combat for each starting pair; it is not a complete run or proof that expanded diagnostic decks are routinely acquired.'],
  observations, repetitions, combats: rows.length, computeMs: Math.round(performance.now() - started), budgets, policySummary, summary, ordinaryOpenings, rows,
};
const lines = [
  `# ${RULES_VERSION} paired balance diagnostics`, '',
  `Content: ${CONTENT_VERSION}; core: ${RULES.version}; policy: ${BOT_POLICY_VERSION}.`, '',
  report.source, '', report.seedPairing, '', report.policy, '', report.policyAudit, '',
  '| Policy | Combats | Wins | Losses | Incomplete | Mean player turns | Mean HP lost | Mean actions |',
  '|---|---:|---:|---:|---:|---:|---:|---:|',
  ...policySummary.map(row => `| ${row.policy} | ${row.combats} | ${row.wins} | ${row.losses} | ${row.incomplete} | ${row.meanTurns} | ${row.meanHpLost} | ${row.meanActions} |`), '',
  '| Build | Realm index | Encounter | Policy | Wins / runs | Mean turns | Mean HP lost | Mean remaining HP | Mean enemy HP lost | Mean Armor absorbed | Mean actions |',
  '|---|---:|---|---|---:|---:|---:|---:|---:|---:|---:|',
  ...summary.map(row => `| ${row.build} | ${row.realm} | ${row.encounter} | ${row.policy} | ${row.wins} / ${row.runs} | ${row.meanTurns} | ${row.meanHpLost} | ${row.meanHpRemaining} | ${row.meanEnemyHpLost} | ${row.meanArmorAbsorbed} | ${row.meanActions} |`), '',
  '## Actual ordinary openings', '',
  ...ordinaryOpenings.map(row => row.combat && row.enemies ? `- ${row.build}: seed ${row.seed}, ${row.enemies.join(', ')}, ${row.combat.outcome}; commitCombat reached ${row.resultingRunPhase}.` : `- ${row.build}: ${row.error}`), '',
  '## Interpretation', '', ...observations.flatMap(value => [value, '']),
  '## Limits', '', ...report.limitations.map(value => `- ${value}`), '', report.timing, '',
  'Reproduce: `npx tsx scripts/revision-balance.ts 8`. Complete rows, deck budgets and deterministic action/resolution hashes are in `artifacts/revision-balance.json`.', '',
];
mkdirSync('artifacts', { recursive: true });
writeFileSync('artifacts/revision-balance.json', JSON.stringify(report, null, 2));
writeFileSync('artifacts/revision-balance.md', lines.join('\n'));
console.log(JSON.stringify({ combats: report.combats, policySummary, ordinaryOpenings: ordinaryOpenings.map(row => ({ build: row.build, outcome: row.combat ? row.combat.outcome : row.error })), computeMs: report.computeMs }));
}
