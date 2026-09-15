// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { ARCHETYPES, CARD_ART_ALIASES, CARDS, DAO_CARD_IDS, DIVINE_CARD_IDS, ENEMIES, GRADE_NAMES, IMMORTAL_CARD_IDS, PATHS, REALMS, STARTING_CARD_IDS, STATUS_CARD_IDS, SUMMONS, bossEncounterIds, eliteEncounterIds, normalEncounterIds } from '../src/game/content';
import { createCombat, describeCard, playCard } from '../src/game/combat';
import type { CardDef, Effect, Grade, Text } from '../src/game/types';

const cards = Object.values(CARDS);
const trilingual = (value: Text) => {
  expect(value.en.trim().length).toBeGreaterThan(0);
  expect(value['zh-CN'].trim().length).toBeGreaterThan(0);
  expect(value.en).not.toMatch(/[\u3400-\u9fff]/u);
  expect(value['zh-CN']).toMatch(/[\u3400-\u9fff]/u);
  expect(value.vi.trim().length).toBeGreaterThan(0);
  expect(value.vi).not.toMatch(/[\u3400-\u9fff]/u);
  expect(value.vi).not.toEqual(value.en);
};
// Remove numerical tuning: identical mechanics with different magnitudes do not
// satisfy a path's distinct-design requirement.
const effectShape = (effect: Effect) => ({
  op: effect.op, target: effect.target, status: effect.status, id: effect.id,
  from: effect.from, attackOnly: effect.attackOnly, statusScale: effect.statusScale,
  multiHit: (effect.hits ?? 1) > 1, retainedScaling: Boolean(effect.perRetained),
  condition: effect.condition, pursuit: effect.pursuit?.condition, lifesteal: effect.lifesteal, damageFlags: effect.damageFlags,
});
const mechanicalShape = (card: CardDef) => JSON.stringify({
  kind: card.kind, target:card.target, retain: Boolean(card.retain), innate: Boolean(card.innate),
  exhaust: Boolean(card.exhaust), retainDiscount: Boolean(card.retainCost),
  effects: card.effects.map(effectShape), onDiscard: card.onDiscard?.map(effectShape),
});

describe('curated content contract', () => {
  it('preserves source-exact Basics and combat-only Flying Swords', () => {
    expect(cards.filter(c => c.category === 'basic').map(c => c.id)).toEqual(['strike', 'defense']);
    expect(CARDS.strike).toMatchObject({ kind: 'attack', cost: 1, effects: [{ op: 'damage', amount: 5 }] });
    expect(CARDS.defense).toMatchObject({ kind: 'skill', cost: 1, effects: [{ op: 'armor', amount: 5 }] });
    expect(CARDS['flying-sword']).toMatchObject({ category: 'token', kind: 'attack', path: 'sword', cost: 0, exhaust: true, effects: [{ op: 'damage', amount: 2, upgrade: 0 }] });
    expect([...STARTING_CARD_IDS, ...DAO_CARD_IDS, ...IMMORTAL_CARD_IDS, ...DIVINE_CARD_IDS]).not.toContain('flying-sword');
  });

  it('authors every primary target while preserving mixed effects and untargeted status cards', () => {
    const targets=['self','enemy','allEnemies','randomEnemy','none'];
    for(const card of cards){
      expect(targets,card.id).toContain(card.target);
      // Single-target enemy effects cannot be redirected by an incidental heal,
      // Armor grant, or other benefit to the player on the same card.
      if(card.effects.some(effect=>effect.target==='enemy'))expect(card.target,card.id).toBe('enemy');
      if(card.target==='allEnemies')expect(card.effects.some(effect=>effect.target==='allEnemies'||effect.op==='overwhelm'),card.id).toBe(true);
      if(card.target==='none')expect(card.effects,card.id).toEqual([]);
    }
    for(const id of ['verdant-harvest','earthen-fist','hardened-edge','white-hot-edge','banked-coals','overwhelm-by-numbers'])expect(CARDS[id].target,id).toBe('enemy');
    for(const id of ['ancient-grove','gravel-snare','phantom-lattice'])expect(CARDS[id].target,id).toBe('self');
    for(const id of ['ash-rain','ashen-sun','mountain-breaker','world-bearing-mountain','wind-shears','red-mist','encirclement','heaven-earth-array','pursuing-tempest'])expect(CARDS[id].target,id).toBe('allEnemies');
    for(const id of STATUS_CARD_IDS)expect(CARDS[id].target,id).toBe('none');
    for(const id of DIVINE_CARD_IDS)expect(CARDS[id].target,id).toBe('self');
  });

  it('keeps Scarlet Requiem damage, Bleeding and Exhaust while removing its lifesteal at every grade', () => {
    const def=CARDS['scarlet-requiem'];
    expect(def).toMatchObject({category:'immortal',kind:'attack',archetype:'bleeding',cost:3,exhaust:true});
    expect(def.effects).toEqual([
      expect.objectContaining({op:'status',status:'bleeding',target:'enemy',amount:6,upgrade:1}),
      expect.objectContaining({op:'damage',target:'enemy',amount:16,upgrade:3}),
    ]);
    expect(def.effects.every(effect=>!effect.lifesteal&&effect.op!=='heal')).toBe(true);
    for(let value=0;value<8;value++){
      const card={uid:'scarlet-probe',defId:def.id,grade:value as Grade,retained:0};
      for(const locale of ['en','zh-CN','vi'] as const)expect(describeCard(card,locale)).not.toMatch(/lifesteal|heal|汲血|回复|hút sinh lực|hồi sinh lực/i);
      // Controlled combat isolates the card. Grades above Xuan are unavailable
      // in the Human Realm, so only grades 0–5 are actual-play probes.
      if(value>5)continue;
      const combat=createCombat({seed:7401,realm:4,hp:30,maxHp:72,deck:[card],enemies:['stone-guardian']});
      combat.energy=3;combat.enemies[0].hp=combat.enemies[0].maxHp=2000;
      combat.enemies[0].armor=0;combat.enemies[0].statuses={};
      const result=playCard(combat,card.uid,combat.enemies[0].id);
      expect(result.player.hp).toBe(30);
      expect(result.energy).toBe(0);
      expect(result.exhaust.map(c=>c.uid)).toContain(card.uid);
      expect(result.enemies[0].statuses.bleeding).toBe((6+value)%10);
      expect(2000-result.enemies[0].hp).toBe(16+3*value+(value>=4?12:0));
    }
    expect(CARDS['crimson-fang'].effects[0].lifesteal).toBe(true);
  });

  it('gives every Path distinct mechanics, starting access and rare payoff', () => {
    expect(PATHS.map(p => p.id)).toEqual(['fire', 'wood', 'earth', 'water', 'metal', 'sword', 'wind', 'blood', 'summoning', 'strength', 'refinement', 'formation', 'wisdom']);
    for (const path of PATHS) {
      const arts = cards.filter(card => card.path === path.id && card.category === 'dao');
      expect(new Set(arts.map(mechanicalShape)).size, path.id).toBeGreaterThanOrEqual(6);
      expect(arts.filter(card => card.starting).length, path.id).toBeGreaterThanOrEqual(3);
      expect(cards.some(card => card.path === path.id && card.category === 'immortal'), path.id).toBe(true);
      for (const art of arts) expect(DAO_CARD_IDS).toContain(art.id);
    }
    expect(new Set(cards.map(c => c.id)).size).toBe(cards.length);
    for (const id of Object.keys(ARCHETYPES)) expect(cards.some(card => card.archetype === id), `unused archetype ${id}`).toBe(true);
  });

  it('keeps gated categories separate from normal and starting acquisition pools', () => {
    for (const id of STARTING_CARD_IDS) {
      expect(CARDS[id]).toMatchObject({ category: 'dao', starting: true });
      expect(CARDS[id].cost).toBeLessThanOrEqual(REALMS[0].energy);
    }
    for (const id of DIVINE_CARD_IDS) {
      expect(CARDS[id]).toMatchObject({ category: 'divine', kind: 'power', exhaust: true, art: 15 });
      expect(CARDS[id].cost).toBeLessThanOrEqual(REALMS[1].energy);
      expect(CARDS[id].effects.every(effect => !effect.upgrade)).toBe(true);
      expect([...STARTING_CARD_IDS, ...DAO_CARD_IDS, ...IMMORTAL_CARD_IDS]).not.toContain(id);
    }
  });

  it('resolves every card, summon and enemy reference and validates meaningful effect data', () => {
    const powers = new Set(['flameEngine', 'seedGarden', 'protectiveCycle', 'swordFoundry', 'gale', 'numericalSuperiority', 'refiningArmor', 'refiningDraw', 'refiningStrength', 'refiningHeal', 'basicTempering', 'formationPatience', 'foresight', 'regen', 'selfHarmDraw', 'summonStrength', 'swordIntentMultiplier']);
    const validateEffect = (effect: Effect, isEnemy: boolean) => {
      for (const value of [effect.amount, effect.scale, effect.upgrade, effect.hits, effect.count, effect.perRetained]) {
        if (value !== undefined) { expect(Number.isFinite(value)).toBe(true); expect(value).toBeGreaterThanOrEqual(0); }
      }
      if (effect.op === 'status') expect(effect.status).toBeTruthy();
      if (effect.op === 'addStatusCard') { expect(isEnemy).toBe(true); expect(STATUS_CARD_IDS).toContain(effect.id); }
      if (effect.op === 'power') expect(powers.has(effect.id ?? ''), effect.id).toBe(true);
      if (effect.op === 'summon') expect((isEnemy ? ENEMIES : SUMMONS)[effect.id ?? ''], effect.id).toBeDefined();
      if (effect.op === 'sacrifice' && effect.id) expect(SUMMONS[effect.id]).toBeDefined();
      if (effect.hits !== undefined) expect(Number.isInteger(effect.hits) && effect.hits > 0).toBe(true);
    };
    for (const card of cards) {
      expect(ARCHETYPES[card.archetype], card.id).toBeDefined();
      if (card.category !== 'status') expect(card.effects.length, card.id).toBeGreaterThan(0);
      expect(Number.isInteger(card.cost) && card.cost >= 0, card.id).toBe(true);
      expect(card.art, card.id).toBeGreaterThanOrEqual(0);
      expect(card.art, card.id).toBeLessThan(16);
      if (card.category === 'dao' || card.category === 'immortal') expect(card.effects.some(e => (e.upgrade ?? 0) > 0), `${card.id}: upgrading must change an effect`).toBe(true);
      [...card.effects, ...(card.onDiscard ?? []), ...(card.onDraw ?? []), ...(card.onTurnEnd ?? [])].forEach(effect => validateEffect(effect, false));
    }
    for (const enemy of Object.values(ENEMIES)) {
      expect(enemy.hp).toBeGreaterThan(0);
      expect(enemy.intents.length).toBeGreaterThan(0);
      enemy.intents.forEach(intent => intent.effects.forEach(effect => validateEffect(effect, true)));
    }
  });

  it('contains working enablers and payoffs for every required cross-Path bridge', () => {
    expect(CARDS['flying-arsenal'].effects.some(e => e.op === 'flyingSwords')).toBe(true);
    expect(CARDS['five-weapons-return'].effects).toContainEqual(expect.objectContaining({ op: 'recover', from: 'exhaust', count: 5, attackOnly: true }));
    expect(CARDS['exchange-thought'].effects[0].op).toBe('discard');
    expect(CARDS['ragged-banner']).toMatchObject({ path: 'wisdom', archetype: 'discard' });
    expect(CARDS['ragged-banner'].onDiscard).toContainEqual(expect.objectContaining({ op: 'draw' }));
    expect(CARDS['hidden-spring'].effects[0].op).toBe('energy');
    expect(CARDS['ripple-guard'].effects.some(e => e.status === 'tidalMomentum')).toBe(true);
    expect(CARDS['mountain-breaker'].effects[0].op).toBe('mountainBreak');
    expect(CARDS['thorn-familiar'].effects[0].op).toBe('summon');
    expect(CARDS['shared-standard'].effects[0].op).toBe('teamBuff');
    expect(CARDS.encirclement.effects[0].op).toBe('overwhelm');
    expect(CARDS['ancestral-offering'].effects[0]).toMatchObject({ op: 'sacrifice', count: 3 });
    expect(CARDS['still-sword-heart'].effects[0].status).toBe('swordIntent');
    expect(new Set(Object.values(SUMMONS).map(s => s.automatic))).toEqual(new Set(['turnEnd', 'counter', 'armorBreak']));
    expect(cards.some(c => c.innate && c.category === 'dao')).toBe(true);
    expect(cards.some(c => c.retainCost && c.effects.some(e => e.condition === 'retained'))).toBe(true);
  });

  it('implements the revised Wind examples with one atomic packet and moves discard schemes to Wisdom', () => {
    expect(CARDS['wind-slash']).toMatchObject({ cost: 1, path: 'wind', effects: [{ op: 'damage', amount: 5, pursuit: { condition: 'priorWind', amount: 3 } }] });
    expect(CARDS['wind-slash'].effects).toHaveLength(1);
    expect(CARDS['chasing-blade']).toMatchObject({ cost: 1, effects: [{ op: 'damage', amount: 4, pursuit: { condition: 'thirdPlay', amount: 4 } }] });
    expect(CARDS['chasing-blade'].effects).toHaveLength(1);
    expect(CARDS['flowing-guard']).toMatchObject({ cost: 1, effects: [{ op: 'armor', amount: 4, pursuit: { condition: 'previousAttack', amount: 4 } }] });
    expect(CARDS['wind-step']).toMatchObject({ cost: 0, effects: [{ op: 'nextWindDiscount', amount: 1 }] });
    for (const id of ['swallow-slip', 'ragged-banner', 'empty-sleeve', 'sky-unbound']) {
      expect(CARDS[id]).toMatchObject({ path: 'wisdom', archetype: 'discard', art: 6 });
      expect([...CARDS[id].effects, ...(CARDS[id].onDiscard ?? [])].some(e => e.status === 'windMomentum')).toBe(false);
    }
    for (const id of ['read-the-current', 'retrieve-the-page', 'inner-sight', 'seek-the-blade', 'master-strategist']) expect(CARDS[id]).toMatchObject({ path: 'wisdom', archetype: 'calculation' });
    for (const card of cards.filter(c => c.path === 'wind')) expect(card.onDiscard).toBeUndefined();
    expect(CARDS['inner-sight'].effects).toEqual([{ op: 'reorder', amount: 3, upgrade: 1 }]);
    expect(CARDS['master-strategist'].effects.map(effect => effect.op)).toEqual(['scry', 'reorder', 'draw', 'recover']);
    for (const [id, alias] of Object.entries(CARD_ART_ALIASES)) {
      expect(CARDS[id], id).toBeDefined(); expect(CARDS[alias], alias).toBeDefined(); expect(id).not.toBe(alias);
      expect(CARD_ART_ALIASES[alias]).toBeUndefined();
    }
  });

  it('keeps the six Status cards temporary, ungraded by contract and outside every acquisition pool', () => {
    expect(STATUS_CARD_IDS).toEqual(['qi-disorder', 'meridian-disruption', 'internal-injury', 'heart-demon', 'scorched-meridian', 'cloud-obscuration']);
    for (const id of STATUS_CARD_IDS) {
      expect(CARDS[id]).toMatchObject({ category: 'status', path: 'basic' });
      expect(CARDS[id].starting).toBeFalsy();
      expect([...DAO_CARD_IDS, ...STARTING_CARD_IDS, ...IMMORTAL_CARD_IDS, ...DIVINE_CARD_IDS]).not.toContain(id);
      const effects = [...CARDS[id].effects, ...(CARDS[id].onDraw ?? []), ...(CARDS[id].onTurnEnd ?? [])];
      expect(effects.every(effect => !(effect.upgrade ?? 0))).toBe(true);
    }
    expect(CARDS['heart-demon']).toMatchObject({ cost: 1, exhaust: true });
    expect(CARDS['heart-demon'].unplayable).toBeFalsy();
    expect(CARDS['meridian-disruption'].onDraw).toEqual([{ op: 'energyLoss', amount: 1 }]);
    expect(CARDS['scorched-meridian'].onDraw?.[0]).toMatchObject({ op: 'damage', amount: 2, target: 'self', damageFlags: { attack: false } });
    expect(CARDS['internal-injury'].onTurnEnd).toEqual([{ op: 'directLoss', amount: 2, target: 'self' }]);
    expect(CARDS['cloud-obscuration'].onDraw?.[0]).toMatchObject({ op: 'status', status: 'weak', amount: 1, upgrade: 0 });
  });

  it('keeps encounter pools valid and the five authored Tribulations actionable', () => {
    for (const pool of [normalEncounterIds, eliteEncounterIds]) for (const group of pool) {
      expect(group.length).toBeGreaterThan(0);
      group.forEach(id => expect(ENEMIES[id], id).toBeDefined());
    }
    for (const group of normalEncounterIds) group.forEach(id => expect(ENEMIES[id].boss || ENEMIES[id].elite).toBeFalsy());
    for (const group of eliteEncounterIds) expect(group.some(id => ENEMIES[id].elite)).toBe(true);
    expect(new Set(bossEncounterIds.map(id => ENEMIES[id].mechanic))).toEqual(new Set(['cloud', 'link', 'restriction', 'thunder', 'mirror']));
    for (const id of bossEncounterIds) {
      expect(ENEMIES[id].boss).toBe(true);
      expect(ENEMIES[id].intents.length).toBeGreaterThanOrEqual(3);
      trilingual(ENEMIES[id].omen!);
    }
    const cloud = ENEMIES['cloud-beastmaster'];
    expect(cloud.intents.some(intent => intent.effects.some(effect => effect.op === 'summon'))).toBe(true);
    expect(cloud.intents.map(intent => intent.kind)).toEqual(['summon', 'attack', 'special', 'special', 'attack']);
    expect(cloud.intents[0].effects.filter(effect => effect.op === 'summon')).toHaveLength(2);
    expect(cloud.intents[1].effects[0]).toMatchObject({ op: 'damage', amount: 8 });
    expect(cloud.intents[1].effects[1]).toMatchObject({ op: 'addStatusCard', id: 'cloud-obscuration' });
    expect(cloud.intents[2].effects).toEqual([{ op: 'cloudCommand', amount: 2 }]);
    expect(cloud.intents[3].effects).toEqual([]);
    expect(cloud.intents[4].effects[0]).toMatchObject({ op: 'damage', amount: 26, realmScale: 3, damageFlags: { attack: true, armorFraction: 0.5 } });
    const injected = Object.values(ENEMIES).flatMap(enemy => enemy.intents.flatMap(intent => intent.effects.filter(effect => effect.op === 'addStatusCard').map(effect => effect.id)));
    expect(new Set(injected)).toEqual(new Set(STATUS_CARD_IDS));
    const restriction = ENEMIES['restriction-soul'].intents.flatMap(intent => intent.effects);
    expect(restriction.filter(effect => effect.status === 'restriction').map(effect => effect.id)).toEqual(['attack', 'skill']);
    expect(restriction.some(effect => effect.op === 'sacrifice' && effect.target === 'allSummons')).toBe(true);
  });

  it('provides complete trilingual content and executable rules text for every card', () => {
    for (const path of PATHS) { trilingual(path.name); trilingual(path.description); }
    [...GRADE_NAMES, ...REALMS.map(r => r.name), ...Object.values(ARCHETYPES)].forEach(trilingual);
    for (const card of cards) {
      trilingual(card.name); trilingual(card.flavor);
      for (const locale of ['en', 'zh-CN', 'vi'] as const) {
        const rules = describeCard({ uid: 'inspect', defId: card.id, grade: 0, retained: 0 }, locale);
        expect(rules.length, card.id).toBeGreaterThan(0);
        expect(rules, card.id).not.toMatch(/undefined|NaN|\{n\}|persistent combat effect|本场战斗获得持续效果/u);
        if (locale === 'vi') {
          expect(rules, card.id).not.toEqual(describeCard({ uid: 'inspect', defId: card.id, grade: 0, retained: 0 }, 'en'));
          expect(rules, card.id).not.toMatch(/[\u3400-\u9fff]/u);
        }
      }
    }
    for (const value of Object.values(ENEMIES)) {
      trilingual(value.name); trilingual(value.description);
      value.intents.forEach(intent => trilingual(intent.name));
    }
    Object.values(SUMMONS).forEach(summon => trilingual(summon.name));
  });

  it('preserves realm removal floors, removes deck maximums, and keeps Xuan reachable', () => {
    expect(REALMS.map(r => r.minDeck)).toEqual([12, 14, 16, 18, 20]);
    expect(REALMS.every(r => !Object.hasOwn(r, 'maxDeck'))).toBe(true);
    expect(REALMS.map(r => r.energy)).toEqual([3, 4, 6, 7, 8]);
    expect(GRADE_NAMES[REALMS.length]).toEqual({ en: 'Xuan', 'zh-CN': '玄', vi: 'Huyền' });
  });
});
