// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import contentVi from './content-vi.json';
import type { CardDef, Effect, EnemyDef, EnemyIntent, Path, SummonDef, Text } from './types';

export const CONTENT_VERSION = 'human-0.3.0';
const t = (en: string, zh: string): Text => {
  const vi = (contentVi as Record<string, string>)[en];
  if (!vi) throw new Error(`Missing authored Vietnamese domain text: ${en}`);
  return { en, 'zh-CN': zh, vi };
};
export const PATHS: { id: Path; name: Text; description: Text; color: string; symbol: string }[] = [
  { id: 'fire', name: t('Fire', '火道'), description: t('Build Flame, detonate a priority target, or spread the blaze.', '积蓄爆炎，集中引爆，或让烈焰蔓延。'), color: '#ec8158', symbol: '火' },
  { id: 'wood', name: t('Wood', '木道'), description: t('Regrow, root your enemies, and shelter behind living plants.', '回复生机，以种子困敌，借草木护身。'), color: '#83ad78', symbol: '木' },
  { id: 'earth', name: t('Earth', '土道'), description: t('Raise a fortress. Decide when to turn its Armor into force.', '筑起厚甲，再决定何时以甲破敌。'), color: '#c8a46b', symbol: '土' },
  { id: 'water', name: t('Water', '水道'), description: t('Stretch your Dao Yuan and awaken the three-state Tidal Domain.', '运转道元，积蓄潮势，唤醒三态潮汐领域。'), color: '#6babc4', symbol: '水' },
  { id: 'metal', name: t('Metal', '金道'), description: t('Pierce defenses and blunt repeated hits with Protective Qi.', '以破甲蓄锋，以罡气抵御连击。'), color: '#d7be72', symbol: '金' },
  { id: 'sword', name: t('Sword', '剑道'), description: t('Hone Sword Intent, then launch a hand full of Flying Swords.', '凝聚剑意，再令满手飞剑齐出。'), color: '#bdcbd2', symbol: '剑' },
  { id: 'wind', name: t('Wind', '风道'), description: t('Gather Wind Momentum into Gale, or plan this turn’s play order for Pursuit bonuses.', '积蓄风势触发狂风，或安排本回合出牌顺序获得追击加成。'), color: '#8ebcab', symbol: '风' },
  { id: 'blood', name: t('Blood', '血道'), description: t('Steal life, burst Bleeding, and trade your own HP for tempo.', '汲血续命，引爆流血，以自身气血换取先机。'), color: '#ca7785', symbol: '血' },
  { id: 'summoning', name: t('Summoning', '奴道'), description: t('Command companions, overwhelm with numbers, or sacrifice them.', '号令灵兽，以众凌寡，亦可献祭求变。'), color: '#b99cc8', symbol: '奴' },
  { id: 'strength', name: t('Strength', '力道'), description: t('Break the enemy with Battle Intent and empowered Basic cards.', '激发战意，让朴素的基础招式成为杀招。'), color: '#c79a79', symbol: '力' },
  { id: 'refinement', name: t('Refinement', '炼道'), description: t('Feed the furnace with Exhaust and temporarily refine card grades.', '以消耗养炉，回收旧术，临阵重炼品阶。'), color: '#cd9f69', symbol: '炼' },
  { id: 'formation', name: t('Formation', '阵道'), description: t('Retain your preparations across turns and choose the right release.', '跨回合保留阵势，等待最合适的发动时机。'), color: '#ab9ec7', symbol: '阵' },
  { id: 'wisdom', name: t('Wisdom', '智道'), description: t('Calculate future draws, or use Hidden Schemes to turn Active Discard into resources.', '演算未来抽牌，或以暗谋将主动弃牌转化为资源。'), color: '#90b1c6', symbol: '智' },
];
export const REALMS = [
  { name: t('Qi Refining', '炼气'), energy: 3, minDeck: 12 },
  { name: t('Foundation Establishment', '筑基'), energy: 4, minDeck: 14 },
  { name: t('Core Formation', '结丹'), energy: 6, minDeck: 16 },
  { name: t('Nascent Soul', '元婴'), energy: 7, minDeck: 18 },
  { name: t('Spirit Transformation', '化神'), energy: 8, minDeck: 20 },
];
export const GRADE_NAMES: Text[] = [t('Ding', '丁'), t('Bing', '丙'), t('Yi', '乙'), t('Jia', '甲'), t('Huang', '黄'), t('Xuan', '玄'), t('Di', '地'), t('Tian', '天')];
export const ARCHETYPES: Record<string, Text> = {
  status: t('Temporary Status', '临时状态'), basic: t('Basic Technique', '基础功法'), explosive: t('Explosive Flame', '爆炎'), spreading: t('Spreading Flame', '蔓延烈焰'),
  regrowth: t('Regrowth', '回春'), seeds: t('Seeds / Rooting', '种子与生根'), plants: t('Living Plants', '草木灵植'),
  fortification: t('Fortification', '坚壁'), mountain: t('Mountain Breaker', '崩山'), flow: t('Flow', '流转'), tide: t('Tidal Domain', '潮汐领域'),
  pierce: t('Armor Pierce', '破甲'), protective: t('Protective Qi', '罡气护体'), intent: t('Sword Intent', '剑意'), flying: t('Flying Swords', '飞剑'),
  discard: t('Hidden Schemes', '暗谋'), calculation: t('Calculation & Deduction', '运筹与推演'), pursuit: t('Pursuit', '追击'), gale: t('Gale', '狂风'), lifesteal: t('Lifesteal', '汲血'), bleeding: t('Bleeding', '流血'), selfharm: t('Self-Harm', '自损'),
  numbers: t('Numerical Superiority', '众势'), overwhelm: t('Overwhelm', '压制'), command: t('Commands', '号令'), sacrifice: t('Sacrifice', '献祭'),
  battle: t('Battle Intent', '战意'), brute: t('Brute Force', '蛮力'), exhaust: t('Refining', '炼化'), rerefine: t('Re-Refinement', '重炼'),
  setup: t('Formation Setup', '布阵'), recover: t('Recovery', '回收'),
};
const damage = (amount: number, upgrade = 2, extra: Partial<Effect> = {}): Effect => ({ op: 'damage', amount, upgrade, target: 'enemy', ...extra });
const armor = (amount: number, upgrade = 2, extra: Partial<Effect> = {}): Effect => ({ op: 'armor', amount, upgrade, target: 'self', ...extra });
const status = (status: NonNullable<Effect['status']>, amount: number, target: Effect['target'] = 'self', extra: Partial<Effect> = {}): Effect => ({ op: 'status', status, amount, upgrade: 1, target, ...extra });
const power = (id: string, amount: number): Effect => ({ op: 'power', id, amount, upgrade: 1 });
const heal = (amount: number, upgrade = 1): Effect => ({ op: 'heal', amount, upgrade, target: 'self' });
const dao = (id: string, en: string, zh: string, path: Path, archetype: string, kind: CardDef['kind'], target: CardDef['target'], cost: number, effects: Effect[], flavor: Text, extra: Partial<CardDef> = {}): CardDef => ({ id, name: t(en, zh), path, category: 'dao', kind, target, cost, rarity: 'common', archetype, starting: false, effects, flavor, art: PATHS.findIndex(p => p.id === path), ...extra });
const immortal = (id: string, en: string, zh: string, path: Path, archetype: string, kind: CardDef['kind'], target: CardDef['target'], cost: number, effects: Effect[], flavor: Text, extra: Partial<CardDef> = {}): CardDef => dao(id, en, zh, path, archetype, kind, target, cost, effects, flavor, { category: 'immortal', rarity: 'rare', art: 14, exhaust: true, ...extra });
const divine = (id: string, en: string, zh: string, path: Path, archetype: string, target: CardDef['target'], effects: Effect[], flavor: Text): CardDef => dao(id, en, zh, path, archetype, 'power', target, 4, effects.map(effect => ({ ...effect, upgrade: 0 })), flavor, { category: 'divine', rarity: 'rare', art: 15, exhaust: true });

const definitions: CardDef[] = [
  { id: 'strike', name: t('Strike', '打击'), path: 'basic', category: 'basic', kind: 'attack', target: 'enemy', cost: 1, rarity: 'common', archetype: 'basic', effects: [damage(5)], flavor: t('A thousand secrets begin with one true strike.', '万千妙法，始于一击。'), art: 13 },
  { id: 'defense', name: t('Defense', '防御'), path: 'basic', category: 'basic', kind: 'skill', target: 'self', cost: 1, rarity: 'common', archetype: 'basic', effects: [armor(5)], flavor: t('Settle your breath. Stand your ground.', '调息，守心。'), art: 13 },
  { id: 'flying-sword', name: t('Flying Sword', '飞剑'), path: 'sword', category: 'token', kind: 'attack', target: 'enemy', cost: 0, rarity: 'common', archetype: 'flying', exhaust: true, effects: [damage(2, 0)], flavor: t('A thought given an edge.', '一念成锋。'), art: 5 },

  // FIRE: mark, consume, spread, wide application, defense bridge, repeatable engine.
  dao('ember-brand', 'Ember Brand', '烙火印', 'fire', 'explosive', 'attack', 'enemy', 1, [damage(4), status('flame', 2, 'enemy')], t('A quiet ember remembers its master.', '余烬不忘执火人。'), { starting: true }),
  dao('cinder-fuse', 'Cinder Fuse', '引爆诀', 'fire', 'explosive', 'attack', 'enemy', 1, [{ op: 'detonate', amount: 4, upgrade: 2, scale: 3, target: 'enemy' }], t('The spark was never the threat.', '火星虽小，后患无穷。'), { starting: true }),
  dao('wildfire-thread', 'Wildfire Thread', '引火连枝', 'fire', 'spreading', 'skill', 'enemy', 1, [{ op: 'spread', amount: 3, upgrade: 1, target: 'enemy' }], t('Every branch is a road.', '枝枝皆是火路。'), { starting: true }),
  dao('ash-rain', 'Ash Rain', '飞灰雨', 'fire', 'spreading', 'attack', 'allEnemies', 2, [damage(3, 2, { target: 'allEnemies' }), status('flame', 1, 'allEnemies')], t('Under this sky, nothing remains untouched.', '此雨之下，无处避火。')),
  dao('banked-coals', 'Banked Coals', '藏火守炉', 'fire', 'explosive', 'skill', 'enemy', 1, [armor(7), status('flame', 2, 'enemy')], t('Guard the flame until its hour arrives.', '护住炉火，静待时机。')),
  dao('furnace-heart', 'Furnace Heart', '炉心不灭', 'fire', 'explosive', 'power', 'self', 2, [power('flameEngine', 1)], t('Every strike leaves something burning.', '招招过处，皆留余火。'), { rarity: 'uncommon', exhaust: true }),
  immortal('ashen-sun', 'Ashen Sun', '焚天曜', 'fire', 'spreading', 'attack', 'allEnemies', 3, [status('flame', 3, 'allEnemies'), { op: 'detonate', amount: 9, upgrade: 3, scale: 3, target: 'allEnemies' }], t('For one breath, the sun descends.', '一息之间，天日坠地。')),

  // WOOD: immediate sustain, delayed Seeds, plant Intercept and seeded-target payoff.
  dao('spring-return', 'Spring Return', '回春术', 'wood', 'regrowth', 'skill', 'self', 1, [heal(6, 2)], t('Even the oldest root remembers spring.', '老根亦知春。'), { starting: true, exhaust: true }),
  dao('rootbind', 'Rootbind', '缠根诀', 'wood', 'seeds', 'skill', 'enemy', 1, [status('seed', 2, 'enemy'), status('weak', 1, 'enemy')], t('What grips the earth can grip a soul.', '根入泥土，亦缚心神。'), { starting: true }),
  dao('thorn-familiar', 'Thorn Familiar', '唤棘灵', 'wood', 'plants', 'skill', 'self', 1, [{ op: 'summon', id: 'thorn-vine', amount: 0, upgrade: 2 }], t('A patient friend with sharp manners.', '静候身侧，来犯必刺。'), { starting: true }),
  dao('living-sap', 'Living Sap', '灵液滋生', 'wood', 'regrowth', 'skill', 'self', 1, [status('regen', 3), armor(3, 1)], t('Life travels slowly, then all at once.', '生机潜行，终成满枝。')),
  dao('verdant-harvest', 'Verdant Harvest', '青禾收命', 'wood', 'seeds', 'attack', 'enemy', 1, [damage(4, 2, { statusScale: 'seed', scale: 2 }), heal(2)], t('Every seed carries a promise.', '种下的，终会归来。')),
  dao('seed-garden', 'Seed Garden', '众生苗圃', 'wood', 'seeds', 'power', 'self', 2, [power('seedGarden', 1)], t('The battlefield need not remain barren.', '战地亦可生春。'), { rarity: 'uncommon', exhaust: true }),
  immortal('ancient-grove', 'Ancient Grove', '万古长青', 'wood', 'plants', 'skill', 'self', 3, [{ op: 'summon', id: 'treant' }, status('seed', 2, 'allEnemies'), heal(5, 2)], t('The forest has decided to stand beside you.', '古林有灵，今为你而起。')),

  // EARTH: Armor is both a reserve and a spendable offensive resource.
  dao('stone-rampart', 'Stone Rampart', '垒石成垣', 'earth', 'fortification', 'skill', 'self', 1, [armor(11, 3)], t('One stone holds another.', '块石相依，方成坚壁。'), { starting: true }),
  dao('mountain-breaker', 'Mountain Breaker', '崩山诀', 'earth', 'mountain', 'attack', 'allEnemies', 1, [{ op: 'mountainBreak', amount: 0, upgrade: 3, scale: 1, target: 'allEnemies' }], t('What sheltered you now falls upon them.', '昔日护身山，今朝压敌岳。'), { starting: true }),
  dao('rooted-stance', 'Rooted Stance', '不动桩', 'earth', 'fortification', 'skill', 'self', 1, [status('fortify', 3)], t('Learn from the mountain before moving it.', '欲移山，先如山。'), { starting: true }),
  dao('earthen-fist', 'Earthen Fist', '厚土拳', 'earth', 'mountain', 'attack', 'enemy', 1, [damage(7), armor(4)], t('Strike from a place that will not yield.', '立于不退之地，出不退之拳。')),
  dao('stone-skin', 'Stone Skin', '石肤金骨', 'earth', 'fortification', 'skill', 'self', 2, [armor(8, 3), status('protectiveQi', 3)], t('Cliffs wear the weather lightly.', '千年风雨，不过石上轻痕。')),
  dao('gravel-snare', 'Gravel Snare', '流沙困阵', 'earth', 'mountain', 'skill', 'self', 1, [armor(4), status('weak', 1, 'allEnemies')], t('An unsteady step can end a war.', '步履一乱，胜负已分。')),
  immortal('world-bearing-mountain', 'World-Bearing Mountain', '负天移岳', 'earth', 'mountain', 'attack', 'allEnemies', 3, [armor(15, 3), { op: 'mountainBreak', amount: 0, scale: 1.5, target: 'allEnemies' }], t('Carry the heavens. Then let go.', '肩承青天，而后放手。')),

  // WATER: cost economy and Momentum leave room for the Domain's unused-Yuan gate.
  dao('hidden-spring', 'Hidden Spring', '灵泉涌', 'water', 'flow', 'skill', 'self', 0, [{ op: 'energy', amount: 2, upgrade: 1 }], t('A small spring feeds a long journey.', '一泓灵泉，续万里行。'), { starting: true, exhaust: true }),
  dao('ripple-guard', 'Ripple Guard', '涟漪护身', 'water', 'tide', 'skill', 'self', 1, [armor(5), status('tidalMomentum', 2)], t('Yielding water still turns the blade.', '柔水亦能回锋。'), { starting: true }),
  dao('unbroken-flow', 'Unbroken Flow', '流水不绝', 'water', 'flow', 'skill', 'self', 1, [{ op: 'draw', amount: 2, upgrade: 1 }, { op: 'energy', amount: 1 }], t('The stream keeps its own account.', '流水自有盈亏。'), { starting: true }),
  dao('clear-channel', 'Clear Channel', '疏脉诀', 'water', 'flow', 'skill', 'self', 0, [{ op: 'costReduce', amount: 1, upgrade: 1, from: 'hand' }], t('Remove the stone; the river needs no urging.', '移去阻石，江流自通。'), { exhaust: true }),
  dao('ebb-cut', 'Ebb Cut', '退潮斩', 'water', 'tide', 'attack', 'enemy', 1, [damage(6), status('tidalMomentum', 2)], t('The retreat conceals a gathering tide.', '潮退之处，暗势已生。')),
  dao('deep-reservoir', 'Deep Reservoir', '积水成渊', 'water', 'flow', 'power', 'self', 2, [{ op: 'maxEnergy', amount: 1, upgrade: 1 }], t('Depth is a form of patience.', '渊深，是水的耐心。'), { exhaust: true, rarity: 'uncommon' }),
  immortal('four-seas-return', 'Four Seas Return', '四海归流', 'water', 'tide', 'skill', 'self', 3, [status('tidalMomentum', 4), { op: 'energy', amount: 2 }, { op: 'draw', amount: 2 }], t('All rivers recognize the same horizon.', '百川入海，共见一线天。')),

  // METAL: multi-hit Pierce consumption differs from flat protection.
  dao('hone-the-edge', 'Hone the Edge', '磨锋', 'metal', 'pierce', 'skill', 'self', 0, [status('pierce', 3)], t('A blade is sharpened before it is needed.', '临敌之前，先磨其锋。'), { starting: true }),
  dao('threefold-needles', 'Threefold Needles', '三叠金针', 'metal', 'pierce', 'attack', 'enemy', 1, [damage(3, 1, { hits: 3 })], t('One opens the way. Two follow.', '一针开路，二针随后。'), { starting: true }),
  dao('golden-breath', 'Golden Breath', '吐纳金罡', 'metal', 'protective', 'skill', 'self', 1, [status('protectiveQi', 4)], t('The body rings like a quiet bell.', '身如静钟，不鸣自坚。'), { starting: true }),
  dao('hardened-edge', 'Hardened Edge', '攻守金锋', 'metal', 'protective', 'attack', 'enemy', 1, [damage(6), status('protectiveQi', 2)], t('Hardness and sharpness share one origin.', '坚与锐，本自同源。')),
  dao('razor-lattice', 'Razor Lattice', '金丝甲网', 'metal', 'pierce', 'skill', 'self', 1, [status('pierce', 2), armor(6)], t('Every opening is another edge.', '网眼之间，皆藏利刃。')),
  dao('shattering-chisel', 'Shattering Chisel', '破隙凿', 'metal', 'pierce', 'attack', 'enemy', 2, [damage(10, 3), status('vulnerable', 2, 'enemy')], t('Find the fault that the armor hides.', '甲胄之下，自有裂隙。')),
  immortal('ten-thousand-needles', 'Ten Thousand Needles', '万针破阵', 'metal', 'pierce', 'attack', 'enemy', 3, [status('pierce', 6), damage(3, 1, { hits: 5 })], t('Even a wall has countless doors.', '纵是铁壁，亦有万门。')),

  // SWORD: a persistent resource, Tokens, a consumer, and a renewable generator.
  dao('still-sword-heart', 'Still Sword Heart', '静心凝剑', 'sword', 'intent', 'skill', 'self', 1, [status('swordIntent', 3)], t('Stillness draws the straightest blade.', '心静，则剑直。'), { starting: true, innate: true }),
  dao('twin-stars', 'Twin Stars', '双星引剑', 'sword', 'flying', 'skill', 'self', 1, [status('swordIntent', 1), { op: 'flyingSwords', amount: 2 }], t('Two sparks answer a single thought.', '一念既起，双星相应。'), { starting: true }),
  dao('flying-arsenal', 'Flying Arsenal', '开匣放剑', 'sword', 'flying', 'skill', 'self', 1, [{ op: 'flyingSwords', amount: 4, upgrade: 1 }], t('The empty scabbard was never empty.', '空匣之中，剑气未空。'), { starting: true }),
  dao('last-word', 'Last Word', '断意斩', 'sword', 'intent', 'attack', 'enemy', 1, [{ op: 'consumeSword', amount: 6, upgrade: 2, scale: 3, target: 'enemy' }], t('Spend every thought on one answer.', '倾尽剑意，只此一答。')),
  dao('severing-arc', 'Severing Arc', '回锋双断', 'sword', 'intent', 'attack', 'enemy', 1, [damage(4, 1, { hits: 2 })], t('The returning edge is no less certain.', '去锋既定，回锋亦然。')),
  dao('sword-foundry', 'Sword Foundry', '剑炉长鸣', 'sword', 'flying', 'power', 'self', 2, [power('swordFoundry', 1)], t('So long as the furnace breathes, steel will rise.', '炉息未灭，飞锋不绝。'), { rarity: 'uncommon', exhaust: true }),
  immortal('thousand-sword-dawn', 'Thousand-Sword Dawn', '千剑破晓', 'sword', 'flying', 'skill', 'self', 3, [status('swordIntent', 3), { op: 'flyingSwords', amount: 6 }], t('Morning arrives on the edge of every blade.', '万锋尽处，天光乍现。')),

  // Stable IDs retained: the old active-discard package now belongs to Wisdom Hidden Schemes.
  dao('swallow-slip', 'Swallow Slip', '燕掠笺', 'wisdom', 'discard', 'skill', 'self', 0, [{ op: 'draw', amount: 1, upgrade: 1 }], t('A message the wind would rather carry.', '此笺，当托长风。'), { starting: true, onDiscard: [{ op: 'energy', amount: 1 }] , art: 6 }),
  dao('ragged-banner', 'Ragged Banner', '残旗招风', 'wisdom', 'discard', 'skill', 'self', 1, [armor(7)], t('Even a torn banner knows where to turn.', '残旗犹识风向。'), { starting: true, retain: true, onDiscard: [{ op: 'draw', amount: 1, upgrade: 1 }] , art: 6 }),
  dao('storm-script', 'Storm Script', '聚风箓', 'wind', 'gale', 'skill', 'self', 1, [status('windMomentum', 2), { op: 'draw', amount: 1 }], t('Write the first line; the storm completes it.', '落笔一行，风雷续章。'), { starting: true }),
  dao('empty-sleeve', 'Empty Sleeve', '拂袖换势', 'wisdom', 'discard', 'skill', 'self', 1, [{ op: 'discard', count: 1 }, { op: 'draw', amount: 2, upgrade: 1 }], t('Let one thing go to catch the next.', '舍一念，迎新风。'), { art: 6 }),
  dao('wind-shears', 'Wind Shears', '分风刃', 'wind', 'gale', 'attack', 'allEnemies', 1, [damage(5, 2, { target: 'allEnemies' }), status('windMomentum', 1)], t('An invisible blade needs no sheath.', '无形之刃，何须归鞘。')),
  dao('wind-shrine', 'Wind Shrine', '祭风台', 'wind', 'gale', 'power', 'self', 2, [power('gale', 2)], t('Give the wind a name, and it will answer.', '为长风立名，长风自应。'), { rarity: 'uncommon', exhaust: true }),
  immortal('sky-unbound', 'Sky Unbound', '纵横天风', 'wisdom', 'discard', 'skill', 'self', 3, [{ op: 'discard', count: 3 }, { op: 'energy', amount: 2, upgrade: 1 }, { op: 'draw', amount: 4 }], t('Keep nothing that cannot fly.', '不能随风者，尽皆放下。'), { art: 6 }),

  // BLOOD: lifesteal depends on actual HP damage; directLoss bypasses prevention.
  dao('crimson-fang', 'Crimson Fang', '血牙', 'blood', 'lifesteal', 'attack', 'enemy', 1, [damage(7, 2, { lifesteal: true })], t('Life answers life.', '以命续命。'), { starting: true }),
  dao('bloodletter', 'Bloodletter', '点血指', 'blood', 'bleeding', 'attack', 'enemy', 1, [damage(4), status('bleeding', 4, 'enemy')], t('A small wound, left unanswered.', '伤口虽小，不可置之。'), { starting: true }),
  dao('open-vein', 'Open Vein', '放血行气', 'blood', 'selfharm', 'skill', 'self', 0, [{ op: 'directLoss', amount: 3, target: 'self' }, { op: 'energy', amount: 2, upgrade: 1 }], t('The price is paid before the power arrives.', '先付代价，再借其力。'), { starting: true, exhaust: true }),
  dao('blood-oath', 'Blood Oath', '歃血立誓', 'blood', 'selfharm', 'skill', 'self', 1, [{ op: 'directLoss', amount: 4, target: 'self' }, status('strength', 2)], t('The body will remember this promise.', '此誓，肉身自记。')),
  dao('red-mist', 'Red Mist', '血雾弥天', 'blood', 'bleeding', 'skill', 'allEnemies', 1, [status('bleeding', 3, 'allEnemies')], t('The mist enters where steel cannot.', '铁刃不至，血雾无孔不入。')),
  dao('feast-of-scars', 'Feast of Scars', '伤痕启悟', 'blood', 'selfharm', 'skill', 'self', 1, [{ op: 'directLoss', amount: 3, target: 'self' }, { op: 'draw', amount: 3, upgrade: 1 }], t('Every scar is a passage learned by heart.', '伤痕如经，刻骨而诵。')),
  immortal('scarlet-requiem', 'Scarlet Requiem', '赤霄夺命', 'blood', 'bleeding', 'attack', 'enemy', 3, [status('bleeding', 6, 'enemy'), damage(16, 3)], t('The last heartbeat rings beneath a scarlet sky.', '赤霄之下，余响终成绝息。')),

  // SUMMONING: each companion brings a different trigger; all archetypes are Dao rewards.
  dao('reed-wolf-pact', 'Reed Wolf Pact', '芦狼契', 'summoning', 'numbers', 'skill', 'self', 1, [{ op: 'summon', id: 'reed-wolf', amount: 0, upgrade: 2 }], t('The quiet reeds conceal a loyal shadow.', '芦苇深处，有影相随。'), { starting: true }),
  dao('thorn-sentinel', 'Thorn Sentinel', '荆棘守卫', 'summoning', 'numbers', 'skill', 'self', 2, [{ op: 'summon', id: 'thorn-vine', amount: 0, upgrade: 2 }, armor(3, 1)], t('It does not pursue. It remembers.', '不逐来敌，必报来伤。'), { starting: true }),
  dao('iron-crane-pact', 'Iron Crane Pact', '玄鹤契', 'summoning', 'command', 'skill', 'self', 1, [{ op: 'summon', id: 'iron-crane', amount: 0, upgrade: 2 }], t('A broken guard is an open sky.', '护甲既碎，长空自开。'), { starting: true }),
  dao('shared-standard', 'Shared Standard', '同袍一旗', 'summoning', 'numbers', 'skill', 'self', 1, [{ op: 'teamBuff', amount: 1, upgrade: 1 }], t('Stand together, and the line grows stronger.', '并肩而立，阵势自强。')),
  dao('encirclement', 'Encirclement', '合围之势', 'summoning', 'overwhelm', 'skill', 'allEnemies', 1, [{ op: 'overwhelm', amount: 2, upgrade: 1, status: 'vulnerable' }], t('Count the paths your enemy no longer has.', '敌路渐少，胜机渐近。')),
  dao('beast-command', 'Beast Command', '群灵听令', 'summoning', 'command', 'skill', 'enemy', 1, [{ op: 'command', amount: 0, upgrade: 2, scale: 1, target: 'enemy' }], t('One intent, many willing hearts.', '一念发，众灵应。')),
  dao('ancestral-offering', 'Ancestral Offering', '三灵归祖', 'summoning', 'sacrifice', 'skill', 'self', 2, [{ op: 'sacrifice', count: 3, id: 'ancestral-beast' }, armor(4, 2)], t('Three small flames return as an ancient sun.', '三点灵火，化作古日。'), { rarity: 'uncommon' }),
  immortal('overwhelm-by-numbers', 'Overwhelm by Numbers', '以众凌寡', 'summoning', 'command', 'skill', 'enemy', 3, [{ op: 'teamBuff', amount: 1, upgrade: 1 }, { op: 'command', scale: 2, target: 'enemy' }], t('The mountain hears a thousand footsteps.', '千足齐行，山岳侧耳。')),

  // STRENGTH: Basic-card scaling remains distinct from the capped Strength stat.
  dao('battle-roar', 'Battle Roar', '振气战吼', 'strength', 'battle', 'skill', 'self', 1, [status('strength', 3)], t('Begin the battle before the first blow.', '拳未至，战意先临。'), { starting: true, exhaust: true }),
  dao('crushing-blow', 'Crushing Blow', '摧心重击', 'strength', 'battle', 'attack', 'enemy', 1, [damage(7), status('vulnerable', 1, 'enemy')], t('Power makes its own opening.', '以力破隙。'), { starting: true }),
  dao('fundamentals', 'Fundamentals', '返璞功', 'strength', 'brute', 'skill', 'self', 1, [status('basicPower', 3)], t('The first lesson is the last lesson.', '初学之法，亦是终身之法。'), { starting: true, exhaust: true }),
  dao('heavy-foundations', 'Heavy Foundations', '千钧根基', 'strength', 'brute', 'power', 'self', 2, [power('basicTempering', 6)], t('Simple things can carry impossible weight.', '至简之法，亦承千钧。'), { exhaust: true, rarity: 'uncommon' }),
  dao('measured-practice', 'Measured Practice', '温故习拳', 'strength', 'brute', 'skill', 'self', 1, [status('basicPower', 1), { op: 'draw', amount: 2 }], t('Repeat with purpose, never without thought.', '反复而习，每次皆新。')),
  dao('three-mountain-fist', 'Three-Mountain Fist', '叠岳三拳', 'strength', 'battle', 'attack', 'enemy', 2, [damage(4, 1, { hits: 3 })], t('One mountain behind another.', '一山更有一山。')),
  immortal('unshaken-resolve', 'Unshaken Resolve', '万夫莫开', 'strength', 'brute', 'skill', 'self', 3, [status('strength', 2), armor(14, 3), { op: 'recover', from: 'discard', count: 2, attackOnly: true }], t('A true foundation survives its own strength.', '根基既定，自承万力。')),

  // REFINEMENT: selected Exhaust, triggers, recovery, and temporary grade changes.
  dao('burn-impurities', 'Burn Impurities', '焚去杂质', 'refinement', 'exhaust', 'skill', 'self', 1, [{ op: 'exhaust', from: 'hand', count: 1 }, armor(8, 3)], t('What leaves the crucible still serves it.', '离炉之物，亦有所成。'), { starting: true }),
  dao('crucible-shell', 'Crucible Shell', '炉灰成甲', 'refinement', 'exhaust', 'power', 'self', 1, [power('refiningArmor', 2)], t('Ash settles into a second skin.', '灰烬落处，凝作护身甲。'), { starting: true, exhaust: true }),
  dao('re-refinement', 'Re-Refinement', '临阵重炼', 'refinement', 'rerefine', 'skill', 'self', 1, [{ op: 'refine', from: 'hand', count: 1, amount: 1, upgrade: 1 }], t('A brighter temper need not last forever.', '一时淬亮，足定胜负。'), { starting: true }),
  dao('reclaim-the-edge', 'Reclaim the Edge', '拾锋再用', 'refinement', 'recover', 'skill', 'self', 1, [{ op: 'recover', from: 'exhaust', count: 1, upgrade: 1, attackOnly: true }], t('Nothing sharp should be wasted.', '利器无弃。')),
  dao('ash-insight', 'Ash Insight', '灰中见真', 'refinement', 'exhaust', 'skill', 'self', 0, [{ op: 'exhaust', from: 'hand', count: 1 }, { op: 'draw', amount: 2, upgrade: 1 }], t('Read what the fire has left behind.', '火后余痕，亦藏真意。')),
  dao('white-hot-edge', 'White-Hot Edge', '白炽锋', 'refinement', 'exhaust', 'attack', 'enemy', 1, [damage(10, 3), status('strength', 1)], t('The blade is spent. Its lesson remains.', '刃虽已尽，锋意犹存。'), { exhaust: true }),
  immortal('five-weapons-return', 'Five Weapons Return', '五兵复归', 'refinement', 'recover', 'skill', 'self', 3, [{ op: 'recover', from: 'exhaust', count: 5, attackOnly: true }, { op: 'energy', amount: 0, upgrade: 1 }], t('The furnace remembers every blade.', '炉火不忘每一寸锋。')),

  // FORMATION: all preparation values depend on actual retained boundaries.
  dao('hidden-thunder-array', 'Hidden Thunder Array', '伏雷阵', 'formation', 'setup', 'attack', 'enemy', 1, [damage(7, 2, { perRetained: 3 })], t('The quietest formation is the hardest to read.', '阵静无声，最难测度。'), { starting: true, retain: true }),
  dao('mountain-seal', 'Mountain Seal', '镇岳印', 'formation', 'setup', 'skill', 'self', 1, [armor(8, 2, { perRetained: 3 })], t('Let the seal settle before you trust its weight.', '印成须定，方可镇岳。'), { starting: true, retain: true }),
  dao('silent-array', 'Silent Array', '无声杀阵', 'formation', 'setup', 'attack', 'enemy', 3, [damage(17, 3)], t('Time pays the cost of perfect preparation.', '以静候之时，偿布阵之耗。'), { starting: true, retain: true, retainCost: { turns: 2, reduction: 2 } }),
  dao('phantom-lattice', 'Phantom Lattice', '迷踪锁阵', 'formation', 'setup', 'skill', 'self', 1, [armor(5), status('weak', 2, 'allEnemies', { condition: 'retained', threshold: 2 })], t('A patient maze closes every exit.', '迷阵渐合，退路自失。'), { retain: true }),
  dao('seven-star-array', 'Seven-Star Array', '七星剑阵', 'formation', 'setup', 'skill', 'self', 1, [{ op: 'flyingSwords', amount: 2, upgrade: 1, perRetained: 1 }], t('A new star finds its place each night.', '每候一夜，又定一星。'), { retain: true }),
  dao('patient-circle', 'Patient Circle', '静守阵心', 'formation', 'setup', 'power', 'self', 2, [power('formationPatience', 2)], t('Preparation is its own shelter.', '布阵之时，自有护持。'), { rarity: 'uncommon', exhaust: true }),
  immortal('heaven-earth-array', 'Heaven-Earth Array', '天地合阵', 'formation', 'setup', 'attack', 'allEnemies', 3, [damage(10, 3, { target: 'allEnemies', perRetained: 5 }), status('vulnerable', 2, 'allEnemies', { condition: 'retained', threshold: 3 })], t('Wait until heaven and earth agree.', '待天地同意，再落此阵。'), { retain: true, retainCost: { turns: 2, reduction: 1 } }),

  // WISDOM: the player chooses cards; unknown Draw order is never exposed by inspection UI.
  dao('read-the-current', 'Read the Current', '观势', 'wisdom', 'calculation', 'skill', 'self', 1, [{ op: 'draw', amount: 3, upgrade: 1 }], t('What comes next has already begun.', '未至之势，已于此刻萌生。'), { starting: true }),
  dao('exchange-thought', 'Exchange a Thought', '舍念换机', 'wisdom', 'discard', 'skill', 'self', 0, [{ op: 'discard', count: 1 }, { op: 'draw', amount: 1, upgrade: 1 }], t('Make space for an answer you do not yet know.', '舍旧念，方容新解。'), { starting: true }),
  dao('retrieve-the-page', 'Retrieve the Page', '旧卷重读', 'wisdom', 'calculation', 'skill', 'self', 1, [{ op: 'recover', from: 'discard', count: 2, upgrade: 1 }], t('An earlier answer may fit a later question.', '旧时一解，或答今日之问。'), { starting: true }),
  dao('inner-sight', 'Inner Sight', '内观天机', 'wisdom', 'calculation', 'skill', 'self', 0, [{ op: 'reorder', amount: 3, upgrade: 1 }], t('See what is near. Let the rest remain clouded.', '观近处，远处留白。')),
  dao('seek-the-blade', 'Seek the Blade', '寻锋', 'wisdom', 'calculation', 'skill', 'self', 1, [{ op: 'search', from: 'draw', count: 1, upgrade: 1, attackOnly: true }], t('The right question has a sharp answer.', '问得其要，自见锋芒。')),
  dao('intentional-forgetting', 'Intentional Forgetting', '忘机', 'wisdom', 'discard', 'skill', 'self', 0, [{ op: 'exhaust', from: 'hand', count: 1 }, { op: 'draw', amount: 1, upgrade: 1 }], t('Wisdom includes knowing what to leave behind.', '知取，亦须知舍。')),
  immortal('master-strategist', 'Master Strategist', '算尽天机', 'wisdom', 'calculation', 'skill', 'self', 3, [{ op: 'scry', amount: 5, upgrade: 1 }, { op: 'reorder', amount: 5, upgrade: 1 }, { op: 'draw', amount: 2 }, { op: 'recover', from: 'discard', count: 2 }], t('Read the river, then choose where to stand.', '看尽水势，自择立足之处。')),

  // Revised Wind Pursuit: each bonus changes one packet, never adds another hit.
  dao('wind-slash', 'Wind Slash', '风斩', 'wind', 'pursuit', 'attack', 'enemy', 1, [damage(5, 1, { pursuit: { condition: 'priorWind', amount: 3 } })], t('The first wind opens a road for the next.', '先至之风，为后来者开路。'), { starting: true }),
  dao('wind-step', 'Wind Step', '风步', 'wind', 'pursuit', 'skill', 'self', 0, [{ op: 'nextWindDiscount', amount: 1, upgrade: 1 }], t('One light step leaves room for the next technique.', '轻踏一步，为下式留力。'), { starting: true }),
  dao('chasing-blade', 'Chasing Blade', '追风刃', 'wind', 'pursuit', 'attack', 'enemy', 1, [damage(4, 1, { pursuit: { condition: 'thirdPlay', amount: 4 } })], t('At the third beat, the blade catches its shadow.', '第三拍，锋芒追上影子。')),
  dao('flowing-guard', 'Flowing Guard', '流风护', 'wind', 'pursuit', 'skill', 'self', 1, [armor(4, 1, { pursuit: { condition: 'previousAttack', amount: 4 } })], t('The returning strike becomes a sheltering current.', '回转的攻势，化作护身长风。'), { starting: true }),
  immortal('pursuing-tempest', 'Pursuing Tempest', '逐势天风', 'wind', 'pursuit', 'attack', 'allEnemies', 3, [damage(10, 3, { target: 'allEnemies', pursuit: { condition: 'priorWind', amount: 6 } }), status('windMomentum', 3)], t('Once the wind has passed, the whole sky follows.', '一风既过，满天相随。')),

  // Temporary status cards exist only in combat and never enter acquisition pools.
  { id: 'qi-disorder', name: t('Qi Disorder', '气乱'), path: 'basic', category: 'status', kind: 'skill', target: 'none', cost: 0, rarity: 'common', archetype: 'status', unplayable: true, effects: [], flavor: t('A tangled breath occupies space in the mind.', '气息错乱，占据心神。'), art: 13 },
  { id: 'meridian-disruption', name: t('Meridian Disruption', '经脉紊乱'), path: 'basic', category: 'status', kind: 'skill', target: 'none', cost: 0, rarity: 'common', archetype: 'status', unplayable: true, autoExhaust: 'onDraw', effects: [], onDraw: [{ op: 'energyLoss', amount: 1 }], flavor: t('The current breaks before it reaches the hand.', '气流未至掌间，已然断续。'), art: 13 },
  { id: 'internal-injury', name: t('Internal Injury', '内伤'), path: 'basic', category: 'status', kind: 'skill', target: 'none', cost: 0, rarity: 'common', archetype: 'status', unplayable: true, autoExhaust: 'onTurnEnd', effects: [], onTurnEnd: [{ op: 'directLoss', amount: 2, target: 'self' }], flavor: t('A hidden wound waits for the breath to settle.', '暗伤伏息，静时始痛。'), art: 13 },
  { id: 'heart-demon', name: t('Heart Demon', '心魔'), path: 'basic', category: 'status', kind: 'skill', target: 'none', cost: 1, rarity: 'common', archetype: 'status', exhaust: true, effects: [], flavor: t('Name the doubt, then let it leave.', '识得此念，方能放下。'), art: 13 },
  { id: 'scorched-meridian', name: t('Scorched Meridian', '灼脉'), path: 'basic', category: 'status', kind: 'skill', target: 'none', cost: 0, rarity: 'common', archetype: 'status', unplayable: true, autoExhaust: 'onDraw', effects: [], onDraw: [damage(2, 0, { target: 'self', damageFlags: { attack: false } })], flavor: t('Old thunder leaves a burning thread inside.', '雷痕已旧，灼意犹存。'), art: 13 },
  { id: 'cloud-obscuration', name: t('Cloud Obscuration', '云障'), path: 'basic', category: 'status', kind: 'skill', target: 'none', cost: 0, rarity: 'common', archetype: 'status', unplayable: true, autoExhaust: 'onDraw', effects: [], onDraw: [status('weak', 1, 'self', { upgrade: 0 })], flavor: t('Mist veils the opening you thought you saw.', '雾遮方才所见之隙。'), art: 13 },

  // Divine Abilities: only the progression layer's breakthrough pool may acquire these.
  divine('endless-vitality', 'Endless Vitality', '生生不息', 'wood', 'regrowth', 'self', [power('regen', 3)], t('Spring becomes a state of being.', '春生不再是季节，而是本心。')),
  divine('sea-without-shore', 'Sea Without Shore', '无涯之海', 'water', 'flow', 'self', [{ op: 'maxEnergy', amount: 2 }], t('The horizon recedes with every breath.', '吐纳之间，海天更远。')),
  divine('indestructible-golden-body', 'Indestructible Golden Body', '不坏金身', 'metal', 'protective', 'self', [power('protectiveCycle', 3)], t('The world strikes. The bell remains.', '万物来击，金钟自存。')),
  divine('sword-heart-awakened', 'Sword Heart Awakened', '剑心通明', 'sword', 'intent', 'self', [power('swordIntentMultiplier', 2)], t('Intent and steel no longer differ.', '剑意与剑锋，再无分别。')),
  divine('living-furnace', 'Living Furnace', '万法归炉', 'refinement', 'exhaust', 'self', [power('refiningDraw', 1)], t('Every ending becomes a new technique.', '术尽之处，新法再生。')),
  divine('sky-splitting-gale', 'Sky-Splitting Gale', '裂天长风', 'wind', 'gale', 'self', [power('gale', 4)], t('The storm has learned your name.', '长风已知你的名字。')),
  divine('blood-scripture', 'Blood Scripture', '血海真经', 'blood', 'selfharm', 'self', [power('selfHarmDraw', 1)], t('The body writes what the mind cannot.', '心未能言，血肉自书。')),
  divine('thousand-spirit-sovereign', 'Thousand-Spirit Sovereign', '万灵归心', 'summoning', 'numbers', 'self', [power('summonStrength', 2)], t('Their strength is their own. Their purpose is shared.', '众灵各有其力，亦共此心。')),
];
export const CARDS: Record<string, CardDef> = Object.fromEntries(definitions.map(card => [card.id, card]));
export const STARTING_CARD_IDS = definitions.filter(card => card.starting && card.category === 'dao').map(card => card.id);
export const DAO_CARD_IDS = definitions.filter(card => card.category === 'dao').map(card => card.id);
export const IMMORTAL_CARD_IDS = definitions.filter(card => card.category === 'immortal').map(card => card.id);
export const DIVINE_CARD_IDS = definitions.filter(card => card.category === 'divine').map(card => card.id);
export const STATUS_CARD_IDS = definitions.filter(card => card.category === 'status').map(card => card.id);
/** Intentional reuse of existing original illustrations for revision-only cards. */
export const CARD_ART_ALIASES: Record<string, string> = {
  'wind-slash': 'wind-shears', 'wind-step': 'swallow-slip', 'chasing-blade': 'severing-arc',
  'flowing-guard': 'ragged-banner', 'pursuing-tempest': 'sky-unbound',
  'qi-disorder': 'inner-sight', 'meridian-disruption': 'clear-channel', 'internal-injury': 'open-vein',
  'heart-demon': 'intentional-forgetting', 'scorched-meridian': 'ember-brand', 'cloud-obscuration': 'storm-script',
};

export const SUMMONS: Record<string, SummonDef> = {
  'reed-wolf': { id: 'reed-wolf', name: t('Reed Wolf', '芦狼'), hp: 12, attack: 4, automatic: 'turnEnd', art: 8 },
  'thorn-vine': { id: 'thorn-vine', name: t('Thorn Vine', '荆棘灵'), hp: 10, attack: 4, automatic: 'counter', art: 1 },
  'iron-crane': { id: 'iron-crane', name: t('Iron Crane', '玄铁鹤'), hp: 9, attack: 5, automatic: 'armorBreak', art: 4 },
  treant: { id: 'treant', name: t('Ancient Treant', '古木灵'), hp: 17, attack: 5, automatic: 'turnEnd', art: 1 },
  'ancestral-beast': { id: 'ancestral-beast', name: t('Ancestral Beast', '祖灵兽'), hp: 34, attack: 13, automatic: 'turnEnd', art: 8 },
};
const intent = (en: string, zh: string, kind: EnemyIntent['kind'], effects: Effect[]): EnemyIntent => ({ name: t(en, zh), kind, effects });
const attack = (amount: number, hits = 1): Effect => ({ op: 'damage', amount, hits, target: 'enemy', damageFlags: { attack: true } });
const enemy = (id: string, en: string, zh: string, description: Text, hp: number, art: number, intents: EnemyIntent[], extra: Partial<EnemyDef> = {}): EnemyDef => ({ id, name: t(en, zh), description, hp, art, intents, ...extra });
const enemies: EnemyDef[] = [
  enemy('road-bandit', 'Mountain Outlaw', '山道劫修', t('A patient guard followed by an exposed heavy strike.', '先蓄势防守，再以重击夺命。'), 28, 0, [intent('Testing Cut', '试探斩', 'attack', [attack(6)]), intent('Raise Guard', '横刀守势', 'defend', [{ op: 'armor', amount: 6, target: 'self' }]), intent('Reckless Lunge', '孤注一掷', 'attack', [attack(10), status('vulnerable', 1, 'self')])]),
  enemy('thorn-stalker', 'Thorn Stalker', '棘影妖', t('Poison rewards ending the fight before its patient growth.', '毒势渐长，速战方可少受其害。'), 24, 1, [intent('Venom Thorn', '毒棘刺', 'debuff', [attack(4), status('poison', 2, 'enemy')]), intent('Rooted Hide', '木甲生根', 'defend', [{ op: 'armor', amount: 7, target: 'self' }]), intent('Bramble Lash', '乱棘鞭', 'attack', [attack(3, 2)])]),
  enemy('stone-guardian', 'Stone Guardian', '石门卫', t('A slow armored foe that invites a well-timed Armor break.', '行动迟缓，甲厚力沉，破甲时机尤为关键。'), 36, 2, [intent('Stone Mantle', '石甲覆身', 'defend', [{ op: 'armor', amount: 10, target: 'self' }]), intent('Heavy Palm', '沉岩掌', 'attack', [attack(11)]), intent('Grinding Step', '碾石步', 'attack', [attack(7), status('weak', 1, 'enemy')])]),
  enemy('river-spirit', 'River Spirit', '渡水灵', t('Smaller repeated hits meet protection differently from one large attack.', '细浪连击，最忌护体罡气。'), 25, 3, [intent('Ripple Flurry', '连漪', 'attack', [attack(3, 3)]), intent('Drawn Breath', '回水凝息', 'defend', [{ op: 'heal', amount: 4, target: 'self' }]), intent('Undertow', '暗流牵引', 'debuff', [attack(5), { op: 'discard', count: 1 }])]),
  enemy('iron-disciple', 'Iron Disciple', '金骨弟子', t('Protective Qi softens small hits; the heavy strike remains telegraphed.', '罡气抵御小伤，重击则有迹可循。'), 31, 4, [intent('Golden Guard', '金罡守', 'defend', [status('protectiveQi', 3, 'self')]), intent('Iron Fist', '铁骨拳', 'attack', [attack(9)]), intent('Two Needles', '双针', 'attack', [attack(4, 2)])]),
  enemy('gale-thief', 'Gale Thief', '逐风盗', t('Forced discard can become an advantage for Wisdom Hidden Schemes.', '强迫弃牌，却可能为智道暗谋提供助力。'), 25, 5, [intent('Steal a Breath', '窃一息', 'debuff', [{ op: 'discard', count: 1 }, attack(5)]), intent('Feather Step', '飞羽步', 'defend', [status('dodge', 1, 'self')]), intent('Passing Blades', '过风刃', 'attack', [attack(4, 2)])]),
  enemy('blood-moth', 'Blood Moth', '饮血蛾', t('A fragile predator whose small wound can become dangerous.', '妖躯脆弱，血毒却不可小觑。'), 22, 6, [intent('Blood Sip', '啜血', 'attack', [attack(6), { op: 'heal', amount: 3, target: 'self' }]), intent('Crimson Dust', '血尘', 'debuff', [status('vulnerable', 2, 'enemy')]), intent('Wing Flurry', '振翅袭', 'attack', [attack(3, 3)])]),
  enemy('lantern-acolyte', 'Lantern Acolyte', '执灯童子', t('Its growing Strength turns each guarded interval into a threat.', '灯火使其渐强，久拖不利。'), 23, 7, [intent('Kindle Resolve', '燃灯励志', 'special', [status('strength', 1, 'self'), { op: 'armor', amount: 5, target: 'self' }]), intent('Lantern Sweep', '扫灯', 'attack', [attack(8)]), intent('Dimming Light', '晦明', 'debuff', [status('weak', 1, 'enemy'), attack(4)])]),
  enemy('jade-hunter', 'Jade Hunter', '碎玉猎手', t('An Elite that tests both sustain and single-hit defense.', '精英猎手，考验续航与抵御重击的能力。'), 56, 5, [intent('Mark Prey', '锁定猎物', 'debuff', [status('vulnerable', 2, 'enemy'), { op: 'armor', amount: 8, target: 'self' }]), intent('Jade Spear', '碎玉枪', 'attack', [attack(16)]), intent('Scatter Shards', '散玉', 'attack', [attack(4, 3)])], { elite: true }),
  enemy('hollow-monk', 'Hollow Monk', '空壳禅师', t('Protective Qi and a charging palm demand different answers.', '护体罡气与蓄势重掌，需要不同应对。'), 63, 2, [intent('Hollow Bell', '空心钟', 'defend', [status('protectiveQi', 4, 'self'), { op: 'armor', amount: 6, target: 'self' }]), intent('Stillness', '定心', 'special', [status('strength', 2, 'self')]), intent('Temple-Breaking Palm', '破寺掌', 'attack', [attack(17)])], { elite: true }),
  enemy('brood-matriarch', 'Brood Matriarch', '巢母', t('Small allies create a race between spreading damage and target focus.', '眷属相生，群攻与集火各有时机。'), 47, 1, [intent('Call the Brood', '唤子', 'summon', [{ op: 'summon', id: 'cloud-wisp' }]), intent('Venom Veil', '毒幕', 'debuff', [status('poison', 3, 'enemy'), attack(5)]), intent('Hunger', '饥啮', 'attack', [attack(6, 2)])], { elite: true }),
  enemy('script-devourer', 'Script Devourer', '吞卷邪灵', t('Disrupts your hand while announcing exactly when it will strike.', '扰乱手牌，但出手时机清晰可辨。'), 50, 7, [intent('Devour Thought · Qi Disorder', '吞念·气乱', 'debuff', [{ op: 'discard', count: 2 }, status('weak', 1, 'enemy'), { op: 'addStatusCard', id: 'qi-disorder', count: 1, to: 'draw' }]), intent('Ink Armor', '墨甲', 'defend', [{ op: 'armor', amount: 13, target: 'self' }]), intent('Riven Page', '裂卷斩', 'attack', [attack(7, 2)])], { elite: true }),
  enemy('cloud-wisp', 'Cloud Wisp', '云精', t('A brief life borrowed from the surrounding mist.', '借云雾暂得一息形体。'), 10, 0, [intent('Mist Claw', '雾爪', 'attack', [attack(3)]), intent('Vapor Guard', '轻云护', 'defend', [{ op: 'armor', amount: 3, target: 'self' }])]),
  enemy('cloud-beastmaster', 'Cloud-Void Beastmaster', '云虚御兽师', t('Shares damage with cloud minions. A five-step cycle ends in a warned heavy strike.', '与云精分担来伤；五段循环以预警后的重击收尾。'), 92, 0, [
    intent('Gather the Cloud Herd', '聚云成兽', 'summon', [{ op: 'summon', id: 'cloud-wisp' }, { op: 'summon', id: 'cloud-wisp' }, status('dodge', 1, 'self')]),
    intent('Clouded Meridians', '云障侵脉', 'attack', [attack(8), { op: 'addStatusCard', id: 'cloud-obscuration', count: 1, to: 'draw' }]),
    intent('Command the Cloud Herd', '御云号令', 'special', [{ op: 'cloudCommand', amount: 2 }]),
    intent('Warning · Crushing Cloudfall Next', '预警·下一式重云坠', 'special', []),
    intent('Crushing Cloudfall · Half Armor', '重云坠·仅计半数护甲', 'attack', [{ ...attack(26), realmScale: 3, damageFlags: { attack: true, armorFraction: 0.5 } }]),
  ], { boss: true, mechanic: 'cloud', affinity: ['earth', 'summoning', 'fire'], omen: t('A cloud herd gathers. Expect a setup, obscured draws, a command, then a warning before a heavy strike that uses only half your Armor.', '云兽聚集。先布阵、再扰牌、继而号令，预警后降下仅计半数护甲的重击。') }),
  enemy('link-cultivator', 'Blood-Link Cultivator', '血契连命修', t('A temporary link returns part of actual damage received as preventable external damage.', '短暂血契将所受伤害的一部分返还；此伤可防，非自损。'), 96, 1, [
    intent('Bind Fates', '血契连命', 'special', [status('link', 2, 'self')]),
    intent('Crimson Palm · Internal Injury', '血掌·内伤', 'attack', [attack(13), { op: 'addStatusCard', id: 'internal-injury', count: 1, to: 'draw' }]),
    intent('Sever the Contract', '血契稍歇', 'defend', [{ op: 'armor', amount: 11, target: 'self' }, { op: 'heal', amount: 4, target: 'self' }]),
    intent('Sanguine Needles', '血针连刺', 'attack', [attack(4, 3)]),
  ], { boss: true, mechanic: 'link', affinity: ['fire', 'blood', 'sword'], omen: t('A red thread follows your pulse. Guard yourself before unleashing your strongest attack.', '红线随心跳牵动。施展最强攻势之前，先护住自身。') }),
  enemy('restriction-soul', 'Restriction-Soul Cultivator', '禁魂修士', t('Forbidden cards remain playable. Backlash only occurs if the cultivator survives.', '禁制之牌仍可使用；禁魂修士若死，便无反噬。'), 89, 2, [
    intent('Forbid Attacks', '禁攻令', 'debuff', [status('restriction', 2, 'self', { id: 'attack' }), { op: 'armor', amount: 8, target: 'self' }]),
    intent('Soul Tax · Meridian Disruption', '夺元·乱脉', 'debuff', [status('energyDebt', 1, 'enemy'), attack(8), { op: 'addStatusCard', id: 'meridian-disruption', count: 1, to: 'draw' }]),
    intent('Forbid Skills', '禁术令', 'debuff', [status('restriction', 2, 'self', { id: 'skill' }), attack(6)]),
    intent('Devour One Companion', '噬一灵', 'special', [{ op: 'sacrifice', target: 'allSummons', count: 1 }, attack(7)]),
  ], { boss: true, mechanic: 'restriction', affinity: ['summoning', 'wisdom', 'water'], omen: t('Seals settle across the road. Some techniques will demand a price; a killing blow may break the seal.', '禁纹封路。有些招式将招致反噬，制敌一击或可破禁。') }),
  enemy('thunder-judge', 'Thunder Judge', '执雷天判', t('Alternates a visible charge, a heavy sentence, and many smaller bolts.', '先蓄雷，再降重罚，随后落下密集雷击。'), 101, 3, [
    intent('Gather the Verdict · Scorched Meridian', '聚雷定罪·灼脉', 'defend', [{ op: 'armor', amount: 14, target: 'self' }, status('strength', 1, 'self'), { op: 'addStatusCard', id: 'scorched-meridian', count: 1, to: 'draw' }]),
    intent('Heavenly Sentence', '天罚', 'attack', [attack(21)]),
    intent('Ninefold Echo', '叠雷回响', 'attack', [attack(3, 5)]),
    intent('Still Before Thunder', '雷前暂静', 'debuff', [status('vulnerable', 1, 'enemy')]),
  ], { boss: true, mechanic: 'thunder', affinity: ['metal', 'earth', 'strength'], omen: t('Thunder gathers in measured breaths. Prepare for both one crushing blow and a storm of smaller strikes.', '天雷一息一聚。既须承受重罚，也须应对密雷。') }),
  enemy('mirror-hermit', 'Mirror Hermit', '照心隐者', t('A rehearsed sequence of evasion, intent, and double strikes tests patient timing.', '闪避、凝意、连斩依序而来，考验出手时机。'), 94, 4, [
    intent('A Face in Still Water', '止水照影', 'defend', [status('dodge', 1, 'self'), status('protectiveQi', 2, 'self')]),
    intent('Reflected Intent · Heart Demon', '映照战意·心魔', 'special', [status('strength', 2, 'self'), { op: 'armor', amount: 7, target: 'self' }, { op: 'addStatusCard', id: 'heart-demon', count: 1, to: 'draw' }]),
    intent('Twin Reflections', '双影斩', 'attack', [attack(8, 2)]),
    intent('Fracture the Mirror', '碎镜散影', 'attack', [attack(13), status('weak', 1, 'self')]),
  ], { boss: true, mechanic: 'mirror', affinity: ['sword', 'formation', 'wind'], omen: t('Your reflection moves a heartbeat late. Small probes may clear the way for a prepared decisive strike.', '倒影比你慢了一次心跳。轻探虚实，或能为蓄势一击开路。') }),
];
export const ENEMIES: Record<string, EnemyDef> = Object.fromEntries(enemies.map(value => [value.id, value]));
export const normalEncounterIds: string[][] = [['road-bandit'], ['thorn-stalker'], ['stone-guardian'], ['river-spirit'], ['iron-disciple'], ['gale-thief'], ['blood-moth', 'lantern-acolyte']];
export const eliteEncounterIds: string[][] = [['jade-hunter'], ['hollow-monk'], ['brood-matriarch'], ['script-devourer']];
export const bossEncounterIds = enemies.filter(value => value.boss).map(value => value.id);
