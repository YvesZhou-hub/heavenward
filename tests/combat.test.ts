import { beforeAll, describe, expect, it } from 'vitest';
import { CARDS, SUMMONS } from '../src/game/content';
import { cardCost, createCombat, describeCard, endTurn, playCard, playableReason, previewCard, resolveChoice } from '../src/game/combat';
import type { CardInstance, Combat, Effect, Summon } from '../src/game/types';

let serial = 0;
const instance = (defId: string, grade = 0): CardInstance => ({ uid: `test-${++serial}`, defId, grade: grade as CardInstance['grade'], retained: 0 });
function setup(ids: string[] = [], enemies = ['road-bandit']): Combat {
  const s = createCombat({ seed: 1729, realm: 0, hp: 60, maxHp: 80, deck: [], enemies });
  s.hand = ids.map(id => instance(id)); s.energy = 100; s.maxEnergy = 100;
  for (const e of s.enemies) { e.hp = e.maxHp = 1000; e.intent = { name: { en: 'Wait', 'zh-CN': '等待', vi: 'Wait' }, kind: 'defend', effects: [] }; }
  return s;
}
const play = (s: Combat, defId: string, targetId = s.enemies[0].id): Combat => playCard(s, s.hand.find(c => c.defId === defId)!.uid, CARDS[defId].target === 'self' ? s.player.id : CARDS[defId].target === 'none' ? undefined : targetId);
function summoned(id: string, suffix: string): Summon {
  const def = SUMMONS[id];
  return { id: `summon-test-${suffix}`, defId: id, name: def.name, hp: def.hp, maxHp: def.hp, attack: def.attack, automatic: def.automatic, armor: 0, statuses: {} };
}
function fixture(id: string, effects: Effect[], kind: 'attack' | 'skill' = 'attack'): void {
  CARDS[id] = { ...CARDS.strike, id, kind, cost: 0, effects, name: { en: id, 'zh-CN': id, vi: id } };
}
beforeAll(() => {
  fixture('test-five-hits', [{ op: 'damage', amount: 5, hits: 5, target: 'enemy' }]);
  fixture('test-many-swords', [{ op: 'flyingSwords', amount: 120 }], 'skill');
  fixture('test-strong-hit', [{ op: 'damage', amount: 20, target: 'enemy' }]);
  fixture('test-scry', [{ op: 'scry', amount: 3 }], 'skill');
  fixture('test-poison', [{ op: 'status', status: 'poison', amount: 5, target: 'enemy' }], 'skill');
  fixture('test-loss-then-heal', [{ op: 'directLoss', amount: 10, target: 'self' }, { op: 'heal', amount: 100, target: 'self' }], 'skill');
  CARDS['test-retained-wind'] = { ...CARDS['ragged-banner'], id: 'test-retained-wind', retain: true };
});

describe('authoritative source examples', () => {
  it('Strike displays and deals 8 with 3 Strength', () => {
    const s = setup(['strike']); s.player.statuses.strength = 3;
    expect(describeCard(s.hand[0], 'en', s)).toContain('8 damage');
    expect(describeCard(s.hand[0], 'zh-CN', s)).toContain('8点伤害');
    const after = play(s, 'strike'); expect(after.enemies[0].hp).toBe(992);
    expect(s.enemies[0].hp).toBe(1000);
  });
  it('Pierce remains on Armor-only hit, disappears after second hit reaches HP', () => {
    const s = setup(['threefold-needles']); s.player.statuses.pierce = 4; s.enemies[0].armor = 10;
    const preview = previewCard(s, s.hand[0].uid, s.enemies[0].id);
    expect(preview).toMatchObject({ hp: 7, armor: 10, selfHp: 0, hits: [7, 7, 3] });
    const after = play(s, 'threefold-needles');
    expect(after.enemies[0].armor).toBe(0); expect(after.enemies[0].hp).toBe(993); expect(after.player.statuses.pierce).toBe(0);
  });
  it('3 Protective Qi reduces five 5-damage hits to 10 total', () => {
    const s = setup(['test-five-hits']); s.enemies[0].statuses.protectiveQi = 3;
    const p = previewCard(s, s.hand[0].uid, s.enemies[0].id);
    expect(p.hits).toEqual([2, 2, 2, 2, 2]); expect(p.hp).toBe(10);
  });
  it('Poison 5 deals 5 at owner end, then becomes 4', () => {
    let s = setup(['test-poison']); s = play(s, 'test-poison'); s = endTurn(s);
    expect(s.enemies[0].hp).toBe(995); expect(s.enemies[0].statuses.poison).toBe(4);
  });
  it('Protective Qi decays with FLOOR for every specified example', () => {
    for (const [from, to] of [[5, 2], [4, 2], [3, 1], [2, 1], [1, 0]]) {
      const s = setup(); s.player.statuses.protectiveQi = from;
      expect(endTurn(s).player.statuses.protectiveQi).toBe(to);
    }
  });
  it('Hand at 9 plus two Flying Swords places one in Hand and one in Discard', () => {
    const s = setup(['twin-stars', ...Array(9).fill('defense')]);
    const after = play(s, 'twin-stars');
    expect(after.hand.length).toBe(10);
    expect(after.hand.filter(c => c.defId === 'flying-sword')).toHaveLength(1);
    expect(after.discard.filter(c => c.defId === 'flying-sword')).toHaveLength(1);
  });
  it('Flying Sword generation has no per-turn cap and conserves every card', () => {
    const after = play(setup(['test-many-swords']), 'test-many-swords');
    expect(after.hand.filter(c => c.defId === 'flying-sword')).toHaveLength(10);
    expect(after.discard.filter(c => c.defId === 'flying-sword')).toHaveLength(110);
    const ids = [...after.hand, ...after.discard].map(c => c.uid);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('damage flags, prevention, and lethal ordering', () => {
  it('floors Weak and Vulnerable separately before flat reduction/Qi/Armor', () => {
    const s = setup(['strike']); s.player.statuses = { strength: 3, weak: 1 };
    s.enemies[0].statuses = { vulnerable: 1, reduction: 2, protectiveQi: 1 }; s.enemies[0].armor = 4;
    const after = play(s, 'strike'); expect(after.enemies[0].hp).toBe(998); expect(after.enemies[0].armor).toBe(0);
  });
  it('Direct HP Loss bypasses all protection, weakness, and vulnerability', () => {
    const s = setup(['open-vein']); s.player.armor = 100;
    s.player.statuses = { weak: 2, vulnerable: 2, reduction: 50, protectiveQi: 5, dodge: 1 };
    const after = play(s, 'open-vein');
    expect(after.player.hp).toBe(57); expect(after.player.armor).toBe(100); expect(after.player.statuses.dodge).toBe(1); expect(after.energy).toBe(102);
  });
  it('lethal Self-Harm ends combat before benefits and cannot resurrect', () => {
    const s = setup(['test-loss-then-heal']); s.player.hp = 5;
    const after = play(s, 'test-loss-then-heal'); expect(after.phase).toBe('lost'); expect(after.player.hp).toBe(0);
    expect(after.pending).toEqual([]); expect(endTurn(after)).toBe(after);
  });
  it('Lifesteal heals actual HP damage, excluding Armor and overkill', () => {
    const s = setup(['crimson-fang']); s.enemies[0].armor = 5; s.enemies[0].hp = 1;
    const after = play(s, 'crimson-fang'); expect(after.player.hp).toBe(61); expect(after.phase).toBe('won');
  });
  it('Armor persists through the enemy turn and resets on the next player turn', () => {
    const s = setup(); s.player.armor = 10;
    s.enemies[0].intent = { name: { en: 'Hit', 'zh-CN': '击', vi: 'Hit' }, kind: 'attack', effects: [{ op: 'damage', amount: 7, target: 'enemy' }] };
    const after = endTurn(s); expect(after.player.hp).toBe(60); expect(after.player.armor).toBe(0);
  });
  it('an Armor-ignoring enemy hit still respects Protective Qi', () => {
    const s = setup(); s.player.armor = 100; s.player.statuses.protectiveQi = 4;
    s.enemies[0].intent = { name: { en: 'Pierce', 'zh-CN': '穿', vi: 'Pierce' }, kind: 'attack', effects: [{ op: 'damage', amount: 7, target: 'enemy', damageFlags: { ignoreArmor: true } }] };
    const after = endTurn(s); expect(after.player.hp).toBe(55); // Qi 4 -> 2 before enemy.
  });
  it('Link is real damage mitigated by Armor, not direct loss', () => {
    const s = setup(['test-strong-hit']); s.enemies[0].statuses.link = 2; s.powers[`linkPercent:${s.enemies[0].id}`] = 50;
    s.player.armor = 6; s.player.statuses.protectiveQi = 2;
    const after = play(s, 'test-strong-hit'); expect(after.enemies[0].hp).toBe(980); expect(after.player.hp).toBe(58); expect(after.player.armor).toBe(0);
  });
  it('simultaneous lethal Link resolves to terminal player death', () => {
    const s = setup(['test-strong-hit']); s.enemies[0].hp = 10; s.player.hp = 3; s.enemies[0].statuses.link = 1;
    const after = play(s, 'test-strong-hit'); expect(after.enemies[0].hp).toBe(0); expect(after.player.hp).toBe(0); expect(after.phase).toBe('lost');
  });
  it('a Dodge is consumed before Intercept and no summon gets hit', () => {
    const s = setup(); s.player.statuses.dodge = 1; s.summons = [summoned('thorn-vine', 'a')];
    s.enemies[0].intent = { name: { en: 'Hit', 'zh-CN': '击', vi: 'Hit' }, kind: 'attack', effects: [{ op: 'damage', amount: 10, target: 'enemy' }] };
    const after = endTurn(s); expect(after.player.hp).toBe(60); expect(after.summons[0].hp).toBe(10);
  });
});

describe('cross-Path card zones and deterministic choices', () => {
  it('Wisdom Active Discard draws before resuming the remaining Draw', () => {
    let s = setup(['empty-sleeve', 'ragged-banner']); s.draw = [instance('strike'), instance('defense'), instance('open-vein')];
    s.player.statuses.windMomentum = 1;
    s = play(s, 'empty-sleeve'); expect(s.choice?.kind).toBe('discard'); expect(s.hand).toHaveLength(1);
    s = resolveChoice(s, [s.hand[0].uid]); expect(s.choice).toBeNull(); expect(s.hand.map(c => c.defId)).toEqual(['strike', 'defense', 'open-vein']);
    expect(s.player.statuses.windMomentum).toBe(1); expect(s.enemies[0].hp).toBe(1000);
  });
  it('natural discard and overflow never activate active-discard triggers', () => {
    const s = setup(['ragged-banner', ...Array(9).fill('defense')]); s.draw = [instance('swallow-slip')];
    const after = endTurn(s); expect(after.player.statuses.windMomentum ?? 0).toBe(0);
    const overflow = setup(['test-many-swords', ...Array(9).fill('defense')]);
    const afterOverflow = play(overflow, 'test-many-swords'); expect(afterOverflow.player.statuses.windMomentum ?? 0).toBe(0);
  });
  it('enemy-forced discard is active, including retained Wisdom cards', () => {
    const s = setup(['test-retained-wind']); s.player.statuses.windMomentum = 1;
    s.enemies[0].intent = { name: { en: 'Discard', 'zh-CN': '弃', vi: 'Discard' }, kind: 'debuff', effects: [{ op: 'discard', count: 1 }] };
    const after = endTurn(s); expect(after.enemies[0].hp).toBe(1000); expect(after.player.statuses.windMomentum).toBe(1);
    expect(after.events.some(e => e.code === 'activeDiscard' && e.values?.card === 'test-retained-wind')).toBe(true);
  });
  it('Flying Swords trigger Refinement and five attacks can be recovered from Exhaust', () => {
    let s = setup(['crucible-shell', 'flying-arsenal', 'five-weapons-return']);
    s = play(s, 'crucible-shell'); expect(s.player.armor).toBe(2);
    s = play(s, 'flying-arsenal');
    for (let i = 0; i < 4; i++) s = play(s, 'flying-sword');
    expect(s.player.armor).toBe(10); expect(s.exhaust.filter(c => c.defId === 'flying-sword')).toHaveLength(4);
    s = play(s, 'five-weapons-return'); expect(s.choice?.ids).toHaveLength(4);
    s = resolveChoice(s, s.choice!.ids);
    expect(s.hand.filter(c => c.defId === 'flying-sword')).toHaveLength(4);
    expect(s.exhaust.some(c => c.defId === 'five-weapons-return')).toBe(true);
  });
  it('invalid choices neither spend resources nor alter pending queue', () => {
    const s = play(setup(['empty-sleeve', 'strike']), 'empty-sleeve');
    expect(resolveChoice(s, [])).toBe(s); expect(resolveChoice(s, ['bogus'])).toBe(s);
    expect(resolveChoice(s, [s.hand[0].uid, s.hand[0].uid])).toBe(s);
  });
  it('a serialized pending choice resumes to exactly the same state', () => {
    const s = play(setup(['empty-sleeve', 'ragged-banner']), 'empty-sleeve');
    const roundtrip = JSON.parse(JSON.stringify(s)) as Combat;
    expect(resolveChoice(roundtrip, roundtrip.choice!.ids)).toEqual(resolveChoice(s, s.choice!.ids));
  });
  it('Retain counts real turn boundaries and enables the printed cost reduction', () => {
    let s = setup(['silent-array']); const id = s.hand[0].uid;
    expect(cardCost(s, s.hand[0])).toBe(3); expect(s.hand[0].retained).toBe(0);
    s = endTurn(s); expect(s.hand.find(c => c.uid === id)?.retained).toBe(1);
    s = endTurn(s); const retained = s.hand.find(c => c.uid === id)!;
    expect(retained.retained).toBe(2); expect(cardCost(s, retained)).toBe(1);
  });
  it('temporary Refinement respects realm+1 and clears on fresh combat creation', () => {
    let s = setup(['re-refinement', 'strike']);
    s = play(s, 're-refinement'); s = resolveChoice(s, [s.hand[0].uid]);
    expect(s.hand[0].tempGrade).toBe(1); expect(s.hand[0].grade).toBe(0);
    const next = createCombat({ seed: 1, realm: 0, hp: 60, maxHp: 80, deck: s.hand, enemies: ['road-bandit'] });
    expect(next.hand[0].tempGrade).toBeUndefined();
    next.hand[0].grade = 2; expect(playableReason(next, next.hand[0])?.en).toContain('realm');
  });
  it('opening hand is five with all Innates prioritized and overflow hidden', () => {
    const deck = [...Array.from({ length: 6 }, () => instance('still-sword-heart')), ...Array.from({ length: 6 }, () => instance('strike'))];
    const s = createCombat({ seed: 3, realm: 0, hp: 60, maxHp: 80, deck, enemies: ['road-bandit'] });
    expect(s.hand).toHaveLength(5); expect(s.hand.every(c => c.defId === 'still-sword-heart')).toBe(true); expect(s.draw).toHaveLength(7);
  });
  it('preview never mutates or consumes RNG and flags hidden Draw as uncertain', () => {
    const s = setup(['unbroken-flow']); s.draw = [instance('strike')]; const before = JSON.stringify(s);
    const preview = previewCard(s, s.hand[0].uid, s.enemies[0].id);
    expect(preview.uncertain).toBe(true); expect(JSON.stringify(s)).toBe(before);
  });
  it('all complete card descriptions cover both locales without changing RNG', () => {
    const s = setup(); const before = JSON.stringify(s);
    for (const def of Object.values(CARDS)) for (const locale of ['en', 'zh-CN', 'vi'] as const) {
      expect(describeCard(instance(def.id), locale, s).length).toBeGreaterThan(3);
    }
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe('Tidal Domain, summons, and cross-Path payoffs', () => {
  it('Tidal awakens only after the card finishes, then asks for a state', () => {
    const s = setup(['four-seas-return']); const after = play(s, 'four-seas-return');
    expect(after.choice?.kind).toBe('tidal'); expect(after.player.statuses.tidalMomentum).toBe(0);
    expect(after.exhaust.some(c => c.defId === 'four-seas-return')).toBe(true);
    expect(after.summons).toHaveLength(0); expect(after.energy).toBe(99);
    const chosen = resolveChoice(after, ['raging']); expect(chosen.tidal).toBe('raging'); expect(chosen.choice).toBeNull();
  });
  it('active Tidal does not consume future four-stack thresholds', () => {
    const s = setup(['ripple-guard']); s.tidal = 'rising'; s.player.statuses.tidalMomentum = 3;
    const after = play(s, 'ripple-guard'); expect(after.player.statuses.tidalMomentum).toBe(5); expect(after.choice).toBeNull();
  });
  it('Rising Tide hits lowest current HP for 3+Momentum and gains one', () => {
    const s = setup([], ['road-bandit', 'stone-guardian']); s.tidal = 'rising'; s.player.statuses.tidalMomentum = 2;
    s.enemies[0].hp = 100; s.enemies[1].hp = 200; s.energy = 1;
    const after = endTurn(s, 'rising'); expect(after.enemies[0].hp).toBe(95); expect(after.enemies[1].hp).toBe(200);
    expect(after.player.statuses.tidalMomentum).toBe(3);
  });
  it('Raging Tide hits highest current HP for 4+2×Momentum and loses one', () => {
    const s = setup([], ['road-bandit', 'stone-guardian']); s.tidal = 'rising'; s.player.statuses.tidalMomentum = 2;
    s.enemies[0].hp = 100; s.enemies[1].hp = 200;
    const after = endTurn(s, 'raging'); expect(after.enemies[1].hp).toBe(192); expect(after.enemies[0].hp).toBe(100);
    expect(after.player.statuses.tidalMomentum).toBe(1);
  });
  it('Tranquil Sea grants 3+2×Momentum Armor before enemies attack', () => {
    const s = setup(); s.tidal = 'tranquil'; s.player.statuses.tidalMomentum = 2;
    s.enemies[0].intent = { name: { en: 'Hit', 'zh-CN': '击', vi: 'Hit' }, kind: 'attack', effects: [{ op: 'damage', amount: 9, target: 'enemy' }] };
    const after = endTurn(s, 'tranquil'); expect(after.player.hp).toBe(58); expect(after.enemies[0].hp).toBe(1000);
    expect(after.player.statuses.tidalMomentum).toBe(1);
  });
  it('Tidal needs one unused Dao Yuan but does not spend it', () => {
    const s = setup(); s.tidal = 'rising'; s.energy = 0;
    expect(endTurn(s, 'rising').enemies[0].hp).toBe(1000);
    s.energy = 1;
    const after = endTurn(s); expect(after.choice?.kind).toBe('tidal'); expect(after.energy).toBe(1);
    const chosen = resolveChoice(after, ['rising']); expect(chosen.enemies[0].hp).toBe(997);
  });
  it('Summon damage uses summon-owned Strength and never player Pierce/Sword Intent', () => {
    const s = setup(['beast-command']); s.summons = [summoned('reed-wolf', 'a')];
    s.player.statuses = { strength: 5, pierce: 6, swordIntent: 10 }; s.summons[0].statuses.strength = 1;
    const after = play(s, 'beast-command'); expect(after.enemies[0].hp).toBe(995); expect(after.player.statuses.pierce).toBe(6);
  });
  it('Intercept has exact 20/40/60 percent and stable remainder distribution', () => {
    for (const count of [1, 2, 3]) {
      const s = setup(); s.summons = Array.from({ length: count }, (_, i) => summoned('iron-crane', String(i)));
      s.enemies[0].intent = { name: { en: 'Hit', 'zh-CN': '击', vi: 'Hit' }, kind: 'attack', effects: [{ op: 'damage', amount: 11, target: 'enemy' }] };
      const after = endTurn(s); const share = Math.floor(11 * count * .2);
      expect(after.player.hp).toBe(60 - (11 - share));
      expect(after.summons.reduce((n, u) => n + (u.maxHp - u.hp), 0)).toBe(share);
    }
  });
  it('intercepted overkill does not return to player or recurse', () => {
    const s = setup(); s.summons = [summoned('iron-crane', 'a')]; s.summons[0].hp = 1;
    s.enemies[0].intent = { name: { en: 'Hit', 'zh-CN': '击', vi: 'Hit' }, kind: 'attack', effects: [{ op: 'damage', amount: 20, target: 'enemy' }] };
    const after = endTurn(s); expect(after.player.hp).toBe(44); expect(after.summons).toHaveLength(0);
    expect(after.events.filter(e => e.code === 'intercept')).toHaveLength(1);
  });
  it('a counterattack kills its attacker and stops remaining hits and effects', () => {
    const s = setup(); s.summons = [summoned('thorn-vine', 'a')]; s.enemies[0].hp = 4;
    s.enemies[0].intent = { name: { en: 'Flurry', 'zh-CN': '连击', vi: 'Flurry' }, kind: 'attack', effects: [{ op: 'damage', amount: 5, hits: 5, target: 'enemy' }, { op: 'heal', amount: 100, target: 'self' }] };
    const after = endTurn(s); expect(after.phase).toBe('won'); expect(after.player.hp).toBe(56); expect(after.enemies[0].hp).toBe(0);
  });
  it('Armor-break follow-up triggers once while Commands remain unrestricted', () => {
    const s = setup(['threefold-needles', 'beast-command']); s.summons = [summoned('iron-crane', 'a')]; s.enemies[0].armor = 2;
    const after = play(s, 'threefold-needles'); expect(after.enemies[0].hp).toBe(988); // 9 attack +5 crane -2 Armor
    expect(after.summons[0].triggeredTurn).toBe(1);
    expect(play(after, 'beast-command').enemies[0].hp).toBe(983);
  });
  it('Wood companions qualify for Numerical Superiority, Overwhelm and Sacrifice', () => {
    let s = setup(['thorn-familiar', 'thorn-familiar', 'thorn-familiar', 'shared-standard', 'encirclement', 'ancestral-offering']);
    s.tidal = 'rising'; s = play(s, 'thorn-familiar'); s = play(s, 'thorn-familiar'); s = play(s, 'thorn-familiar');
    expect(s.summons).toHaveLength(3); s = play(s, 'shared-standard'); expect(s.player.statuses.strength).toBe(2);
    s = play(s, 'encirclement'); expect(s.enemies[0].statuses.vulnerable).toBe(2);
    s = play(s, 'ancestral-offering'); expect(s.summons).toHaveLength(1); expect(s.summons[0].defId).toBe('ancestral-beast'); expect(s.tidal).toBe('rising');
  });
  it('Mountain Breaker spends all Armor for AoE while Fortify rounds down', () => {
    let s = setup(['rooted-stance', 'stone-rampart', 'mountain-breaker'], ['road-bandit', 'stone-guardian']);
    s = play(s, 'rooted-stance'); s = play(s, 'stone-rampart'); expect(s.player.armor).toBe(14);
    s = play(s, 'mountain-breaker'); expect(s.player.armor).toBe(0); expect(s.enemies.map(e => e.hp)).toEqual([986, 986]);
  });
  it('Explosive Flame can spread and every target detonates its own marks', () => {
    let s = setup(['ember-brand', 'wildfire-thread', 'ashen-sun'], ['road-bandit', 'stone-guardian']);
    s = play(s, 'ember-brand'); expect(s.enemies[0].statuses.flame).toBe(2);
    s = play(s, 'wildfire-thread'); expect(s.enemies[1].statuses.flame).toBe(2); expect(s.enemies[1].hp).toBe(997);
    s = play(s, 'ashen-sun'); expect(s.enemies.map(e => e.statuses.flame)).toEqual([0, 0]);
    expect(s.enemies.map(e => e.hp)).toEqual([972, 973]);
  });
  it('Seeds have delayed growth and Verdant Harvest reads the target marks', () => {
    let s = setup(['rootbind', 'verdant-harvest']); s = play(s, 'rootbind'); expect(s.enemies[0].hp).toBe(1000);
    s = play(s, 'verdant-harvest'); expect(s.enemies[0].hp).toBe(992);
    s = endTurn(s); expect(s.enemies[0].hp).toBe(987); expect(s.enemies[0].statuses.seed).toBe(0);
  });
  it('Bleeding consumes ten after card completion and causes a real external burst', () => {
    const s = setup(['bloodletter']); s.enemies[0].statuses.bleeding = 6; s.player.statuses.strength = 3;
    const after = play(s, 'bloodletter'); expect(after.enemies[0].hp).toBe(981); expect(after.enemies[0].statuses.bleeding).toBe(0);
  });
  it('Sword Intent buffs every Flying Sword, while its finisher consumes it once', () => {
    const s = setup(['flying-sword', 'last-word']); s.player.statuses.swordIntent = 3;
    const sword = play(s, 'flying-sword'); expect(sword.enemies[0].hp).toBe(995);
    const finish = play(sword, 'last-word'); expect(finish.enemies[0].hp).toBe(980); expect(finish.player.statuses.swordIntent).toBe(0);
  });
  it('Brute Force improves Basic offense and defense while increasing costs', () => {
    let s = setup(['heavy-foundations', 'strike', 'defense']); s = play(s, 'heavy-foundations');
    expect(cardCost(s, s.hand[0])).toBe(2); s = play(s, 'strike'); expect(s.enemies[0].hp).toBe(989);
    s = play(s, 'defense'); expect(s.player.armor).toBe(11);
  });
  it('living Restriction sources retaliate, a killed one cannot', () => {
    const s = setup(['strike']); const enemy = s.enemies[0]; enemy.statuses.restriction = 1; s.powers[`restrictionKind:${enemy.id}`] = 1;
    expect(play(s, 'strike').player.hp).toBe(57);
    enemy.hp = 5; const won = play(s, 'strike'); expect(won.player.hp).toBe(60); expect(won.phase).toBe('won');
  });
  it('Cloud minions spawn as distinct units and do not act on their creation turn', () => {
    const s = createCombat({ seed: 1, realm: 0, hp: 60, maxHp: 80, deck: [], enemies: ['cloud-beastmaster'] });
    const after = endTurn(s); expect(after.enemies).toHaveLength(3); expect(after.player.hp).toBe(60);
    expect(new Set(after.enemies.map(e => e.id)).size).toBe(3);
  });
});

describe('invariants, inspection, and replay', () => {
  it('every defined stack cap is enforced by repeated legal effects', () => {
    const cases = [ ['battle-roar', 'strength', 10], ['hone-the-edge', 'pierce', 6], ['golden-breath', 'protectiveQi', 5], ['still-sword-heart', 'swordIntent', 10] ] as const;
    for (const [id, status, cap] of cases) {
      let s = setup(Array(8).fill(id)); for (let i = 0; i < 8; i++) s = play(s, id);
      expect(s.player.statuses[status]).toBe(cap);
    }
  });
  it('Scry reveals only its top cards and preserves the remaining top order', () => {
    let s = setup(['test-scry']); s.draw = ['strike', 'defense', 'ragged-banner', 'open-vein'].map(id => instance(id));
    const original = s.draw.map(c => c.uid); s = play(s, 'test-scry');
    expect(s.choice?.ids).toEqual(original.slice(0, 3));
    s = resolveChoice(s, [original[1]]); expect(s.draw.map(c => c.uid)).toEqual([original[0], original[2], original[3]]);
    expect(s.player.statuses.windMomentum ?? 0).toBe(0);
  });
  it('Search filters Attack candidates, allows skip, and shuffles deterministically after selection', () => {
    let s = setup(['seek-the-blade']); s.draw = ['strike', 'defense', 'flying-sword', 'bloodletter'].map(id => instance(id));
    const rng = s.rng; s = play(s, 'seek-the-blade');
    expect(s.choice?.ids).toHaveLength(3);
    expect(s.choice!.ids.map(id => s.draw.find(c => c.uid === id)!.defId)).toEqual(['bloodletter', 'flying-sword', 'strike']);
    const selected = s.choice!.ids[1];
    const first = resolveChoice(s, [selected]), second = resolveChoice(s, [selected]);
    expect(first).toEqual(second); expect(first.hand.some(c => c.uid === selected)).toBe(true); expect(first.rng).not.toBe(rng);
  });
  it('start-turn Divine healing persists and activation itself Exhausts normally', () => {
    let s = setup(['endless-vitality']); s = play(s, 'endless-vitality');
    expect(s.exhaust[0].defId).toBe('endless-vitality'); expect(s.powers.regen).toBe(3);
    s = endTurn(s); expect(s.player.hp).toBe(63); expect(s.powers.regen).toBe(3);
  });
  it('zero-cost hand reductions expire on discard, play, and retained turn boundaries', () => {
    let s = setup(['clear-channel', 'strike', 'mountain-seal']); s = play(s, 'clear-channel');
    expect(cardCost(s, s.hand[0])).toBe(0); s = play(s, 'strike');
    expect(s.discard.find(c => c.defId === 'strike')?.costDelta).toBeUndefined();
    s = endTurn(s); expect(s.hand.find(c => c.defId === 'mountain-seal')?.costDelta).toBeUndefined();
  });
  it('100 seeded mixed-Path battles conserve unique cards and reproduce every committed action', () => {
    const pool = Object.values(CARDS).filter(c => c.starting && c.category === 'dao').map(c => c.id);
    for (let seed = 1; seed <= 100; seed++) {
      const deck = ['strike', 'strike', 'defense', 'defense', ...Array.from({ length: 8 }, (_, i) => pool[(seed + i * 7) % pool.length])].map((defId, i) => ({ uid: `replay-${i}`, defId, grade: 0 as const, retained: 0 }));
      const config = { seed, realm: 0, hp: 70, maxHp: 70, deck, enemies: ['stone-guardian'] };
      let s = createCombat(config);
      for (let step = 0; step < 60 && s.phase === 'player'; step++) {
        if (s.choice) s = resolveChoice(s, s.choice.kind === 'tidal' ? ['rising'] : s.choice.ids.slice(0, s.choice.count));
        else { const card = s.hand.find(c => !playableReason(s, c)); s = card ? playCard(s, card.uid, CARDS[card.defId].target === 'self' ? s.player.id : CARDS[card.defId].target === 'none' ? undefined : s.enemies.find(e => e.hp > 0)!.id) : endTurn(s, 'rising'); }
        const cards = [...s.hand, ...s.draw, ...s.discard, ...s.exhaust, ...(s.resolvingCard ? [s.resolvingCard] : [])];
        expect(new Set(cards.map(c => c.uid)).size).toBe(cards.length);
        expect(cards.filter(c => CARDS[c.defId].category !== 'token')).toHaveLength(deck.length);
        expect(s.hand.length).toBeLessThanOrEqual(10); expect(s.summons.length).toBeLessThanOrEqual(3);
        expect(s.energy).toBeGreaterThanOrEqual(0); expect(s.player.hp).toBeGreaterThanOrEqual(0);
      }
      let replay = createCombat(config);
      for (const value of s.actions) {
        const action = value as { type: string; uid: string; targetId?: string; ids: string[]; tidal?: 'rising' | 'raging' | 'tranquil' };
        if (action.type === 'playCard') replay = playCard(replay, action.uid, action.targetId);
        else if (action.type === 'resolveChoice') replay = resolveChoice(replay, action.ids);
        else if (action.type === 'endTurn') replay = endTurn(replay, action.tidal);
      }
      expect(replay).toEqual(s);
    }
  });
});
