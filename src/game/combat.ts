// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { CARDS, ENEMIES, SUMMONS } from './content';
import { RULES } from './rules';
import { STATUS_NAMES } from './i18n';
import { POWER_NAMES, POWER_TEXT } from './combat-text';
import type { CardDef, CardInstance, Combat, CombatChoice, CombatConfig, Effect, Enemy, Locale, ResolutionContext, ResolutionTask, Status, Summon, Text, TidalState, Unit, PursuitCondition } from './types';

const tr = (en: string, zhCN: string, vi: string): Text => ({ en, 'zh-CN': zhCN, vi });
const copy = <T>(v: T): T => structuredClone(v);
const aliveEnemies = (s: Combat) => s.enemies.filter(e => e.hp > 0);
const aliveSummons = (s: Combat) => s.summons.filter(e => e.hp > 0);
const getUnit = (s: Combat, id?: string): Unit | undefined => id === 'player' ? s.player : s.enemies.find(e => e.id === id) ?? s.summons.find(e => e.id === id);
const stacks = (u: Unit, key: Status) => u.statuses[key] ?? 0;
const grade = (c?: CardInstance) => c ? c.tempGrade ?? c.grade : 0;
const log = (s: Combat, code: string, values?: Record<string, string | number>) => { s.events.push({ code, values }); };
const enqueueFront = (s: Combat, tasks: ResolutionTask[]) => { s.pending = [...tasks, ...(s.pending ?? [])]; };
const effectTasks = (effects: Effect[], context: ResolutionContext): ResolutionTask[] => effects.map(effect => ({ type: 'effect', effect, context }));

function random(s: Combat): number {
  let x = s.rng >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  s.rng = x >>> 0;
  return s.rng / 4294967296;
}
function shuffle<T>(s: Combat, xs: T[]): T[] {
  const result = [...xs];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
const cloudMaster = (s: Combat) => aliveEnemies(s).find(e => ENEMIES[e.defId]?.mechanic === 'cloud');
const cloudBeasts = (s: Combat) => aliveEnemies(s).filter(e => e.defId === 'cloud-wisp');
const awaitingCloud = () => ({ name: tr('Await Command', '静候云令', 'Chờ Lệnh Mây'), kind: 'special' as const, effects: [] });
function settle(s: Combat): void {
  for (const beast of cloudBeasts(s)) {
    if (cloudMaster(s)) beast.intent = awaitingCloud();
    else if (!beast.intent.effects.length) beast.intent = copy(ENEMIES[beast.defId].intents[beast.intentIndex]);
  }
  s.summons = aliveSummons(s);
  if (s.player.hp <= 0) s.phase = 'lost';
  else if (aliveEnemies(s).length === 0) s.phase = 'won';
  if (s.phase !== 'player') {
    // A resolving card has a real zone even if combat terminates during its effects.
    if (s.resolvingCard) {
      const c = s.resolvingCard, def = CARDS[c.defId];
      (def.exhaust || def.category === 'divine' || def.kind === 'power' ? s.exhaust : s.discard).push(c);
      delete s.resolvingCard;
    }
    // Temporary status cards leave every zone at combat termination; cleanup is not an Exhaust event.
    for (const zone of ['draw', 'hand', 'discard', 'exhaust'] as const) s[zone] = s[zone].filter(c => CARDS[c.defId].category !== 'status');
    s.nextWindDiscount = 0;
    s.pending = []; s.choice = null;
  }
}
function addStatus(u: Unit, key: Status, amount: number): void {
  const cap = (RULES.statusCaps as Partial<Record<Status, number>>)[key] ?? Number.MAX_SAFE_INTEGER;
  u.statuses[key] = Math.max(0, Math.min(cap, stacks(u, key) + Math.floor(amount)));
}
function heal(s: Combat, u: Unit, amount: number): void {
  if (u.hp <= 0) return;
  const n = Math.max(0, Math.min(Math.floor(amount), u.maxHp - u.hp));
  u.hp += n;
  if (n) log(s, 'heal', { target: u.id, amount: n });
}
function armor(s: Combat, u: Unit, amount: number): void {
  if (u.hp <= 0) return;
  const n = Math.max(0, Math.floor(amount * (1 + stacks(u, 'fortify') * .1)));
  u.armor += n;
  if (n) log(s, 'armor', { target: u.id, amount: n });
}
function addHand(s: Combat, c: CardInstance): void {
  c.retained = 0;
  if (s.hand.length >= RULES.handSize) {
    s.discard.push(c); log(s, 'overflow', { card: c.defId });
  } else s.hand.push(c);
}
function draw(s: Combat, amount: number): void {
  if (s.preview) { s.uncertain = true; return; }
  for (let i = 0; i < Math.max(0, amount); i++) {
    if (!s.draw.length && s.discard.length) {
      s.draw = shuffle(s, s.discard); s.discard = [];
      log(s, 'shuffle');
    }
    const c = s.draw.shift();
    if (!c) break;
    const def = CARDS[c.defId];
    // Draw effects happen before hand overflow. Direct generation/recovery does not Draw.
    for (const effect of def.onDraw ?? []) applyEffect(s, effect, { ownerId: 'player', card: c, kind: 'skill', path: def.path });
    if (def.autoExhaust === 'onDraw') exhaustCard(s, c);
    else addHand(s, c);
    settle(s);
    if (s.phase !== 'player') return;
  }
}
function flyingSwords(s: Combat, amount: number): void {
  for (let i = 0; i < Math.max(0, Math.floor(amount)); i++) {
    addHand(s, { uid: `token-${s.serial++}`, defId: 'flying-sword', grade: 0, retained: 0 });
  }
  log(s, 'flyingSwords', { amount: Math.max(0, Math.floor(amount)) });
}
function exhaustCard(s: Combat, c: CardInstance): void {
  c.retained = 0; delete c.costDelta; s.exhaust.push(c); log(s, 'exhaust', { card: c.defId });
  if (s.player.hp <= 0) return;
  if (s.powers.refiningArmor) armor(s, s.player, s.powers.refiningArmor);
  if (s.powers.refiningStrength) addStatus(s.player, 'strength', s.powers.refiningStrength);
  if (s.powers.refiningHeal) heal(s, s.player, s.powers.refiningHeal);
  if (s.powers.refiningDraw) draw(s, s.powers.refiningDraw);
}
function activeDiscard(s: Combat, c: CardInstance, context?: ResolutionContext, queue = true): ResolutionTask[] {
  c.retained = 0; delete c.costDelta; s.discard.push(c); log(s, 'activeDiscard', { card: c.defId });
  const effects = CARDS[c.defId].onDiscard ?? [];
  const tasks: ResolutionTask[] = [...effectTasks(effects, { ownerId: 'player', targetId: context?.targetId ?? aliveEnemies(s)[0]?.id, card: c, path: CARDS[c.defId].path, kind: 'skill' }), { type: 'boundary' }];
  if (queue) enqueueFront(s, tasks);
  return tasks;
}
interface DamagePacket {
  sourceId?: string;
  targetId: string;
  amount: number;
  attack?: boolean;
  path?: CardDef['path'];
  basic?: boolean;
  ignoreArmor?: boolean;
  armorFraction?: number;
  noIntercept?: boolean;
  linked?: boolean;
  shared?: boolean;
  lifesteal?: boolean;
  /** A packet already received the attacker's modifiers (e.g. intercepted damage). */
  modified?: boolean;
}
function attackAmount(s: Combat, packet: DamagePacket, source?: Unit): number {
  let n = Math.max(0, packet.amount);
  if (packet.attack && source && !packet.modified) {
    n += stacks(source, 'strength') + stacks(source, 'pierce');
    if (source.id === 'player') {
      if (packet.path === 'sword') n += stacks(source, 'swordIntent') * (s.powers.swordIntentMultiplier || 1);
      if (packet.basic) n += stacks(source, 'basicPower') + (s.powers.basicTempering ?? 0);
    }
    if (stacks(source, 'weak')) n = Math.floor(n * .75);
  }
  return Math.max(0, Math.floor(n));
}
/** Resolves one real damage hit. Direct HP loss deliberately never enters this function. */
function damage(s: Combat, packet: DamagePacket): { hp: number; armor: number; total: number } {
  const target = getUnit(s, packet.targetId), source = getUnit(s, packet.sourceId);
  if (!target || target.hp <= 0 || s.player.hp <= 0 || (source && source.hp <= 0)) return { hp: 0, armor: 0, total: 0 };
  let n = attackAmount(s, packet, source);
  if (stacks(target, 'vulnerable')) n = Math.floor(n * 1.5);
  n = Math.max(0, n - stacks(target, 'reduction'));
  if (n > 0 && stacks(target, 'dodge') > 0) {
    addStatus(target, 'dodge', -1); log(s, 'dodge', { target: target.id });
    n = 0;
  }
  if (n > 0 && target.id === 'player' && !packet.noIntercept) {
    const summons = aliveSummons(s);
    const intercepted = Math.floor(n * summons.length * RULES.interceptPercentEach / 100);
    n -= intercepted;
    if (intercepted) {
      log(s, 'intercept', { amount: intercepted });
      const base = Math.floor(intercepted / summons.length), remainder = intercepted % summons.length;
      summons.forEach((summon, i) => damage(s, {
        sourceId: packet.sourceId, targetId: summon.id, amount: base + (i < remainder ? 1 : 0),
        noIntercept: true, linked: packet.linked, shared: true, modified: true,
      }));
    }
  }
  // Cloud sharing is distinct from player Intercept and cannot recursively share itself.
  const enemyTarget = s.enemies.find(e => e.id === target.id);
  if (n > 0 && enemyTarget && ENEMIES[enemyTarget.defId]?.mechanic === 'cloud' && !packet.shared) {
    const minions = aliveEnemies(s).filter(e => e.id !== target.id && e.defId === 'cloud-wisp');
    const share = minions.length ? Math.floor(n * RULES.cloudSharePercent / 100) : 0;
    n -= share;
    minions.forEach((m, i) => damage(s, { sourceId: packet.sourceId, targetId: m.id, amount: Math.floor(share / minions.length) + (i < share % minions.length ? 1 : 0), noIntercept: true, shared: true, linked: packet.linked, modified: true }));
  }
  n = Math.max(0, n - stacks(target, 'protectiveQi'));
  const beforeArmor = target.armor;
  const availableArmor = Math.floor(target.armor * Math.max(0, Math.min(1, packet.armorFraction ?? 1)));
  const blocked = packet.ignoreArmor ? 0 : Math.min(availableArmor, n);
  target.armor -= blocked;
  const loss = Math.min(target.hp, n - blocked);
  target.hp -= loss;
  log(s, 'damage', { source: packet.sourceId ?? 'effect', target: target.id, amount: n, armor: blocked, hp: loss, kind: packet.linked ? 'link' : packet.attack ? 'attack' : 'external' });
  if (packet.attack && source && loss > 0) source.statuses.pierce = 0;
  if (packet.lifesteal && source && source.hp > 0) heal(s, source, loss);
  // Reactions use the resolved damage, including Armor absorption. No link can produce another link.
  if (!packet.linked && target.id !== 'player' && stacks(target, 'link') > 0 && blocked + loss > 0) {
    damage(s, { targetId: 'player', amount: Math.floor((blocked + loss) * (s.powers[`linkPercent:${target.id}`] ?? RULES.linkPercent) / 100), linked: true });
  }
  if (target.hp <= 0) {
    log(s, 'death', { target: target.id });
    if (enemyTarget?.defId === 'cloud-wisp') {
      aliveEnemies(s).filter(e => ENEMIES[e.defId]?.mechanic === 'cloud').forEach(e => armor(s, e, 4));
    }
  }
  if (source?.id === 'player' && enemyTarget && beforeArmor > 0 && target.armor === 0 && s.player.hp > 0) {
    for (const summon of aliveSummons(s)) {
      if (summon.automatic === 'armorBreak' && summon.triggeredTurn !== s.turn && target.hp > 0) {
        summon.triggeredTurn = s.turn;
        summonAttack(s, summon, target.id);
      }
    }
  }
  if (packet.attack && target.id === 'player' && target.hp > 0 && source?.hp && source.hp > 0) {
    for (const summon of aliveSummons(s)) {
      if (summon.automatic === 'counter' && summon.triggeredTurn !== s.turn && source.hp > 0) {
        summon.triggeredTurn = s.turn;
        summonAttack(s, summon, source.id);
      }
    }
  }
  return { hp: loss, armor: blocked, total: n };
}
function directLoss(s: Combat, target: Unit, amount: number): void {
  if (target.hp <= 0) return;
  const n = Math.min(target.hp, Math.max(0, Math.floor(amount)));
  target.hp -= n; log(s, 'directLoss', { target: target.id, amount: n });
  if (target.id === 'player' && target.hp > 0 && n && s.powers.selfHarmDraw) draw(s, s.powers.selfHarmDraw);
}
function summonAttack(s: Combat, summon: Summon, targetId: string, multiplier = 1, bonus = 0): void {
  if (summon.hp <= 0 || s.player.hp <= 0) return;
  damage(s, { sourceId: summon.id, targetId, amount: summon.attack * multiplier + bonus, attack: true });
}
function makeEnemy(s: Combat, defId: string): Enemy {
  const def = ENEMIES[defId];
  if (!def) throw new Error(`Unknown enemy: ${defId}`);
  // Curated enemy identities receive realm scaling, never secret build-dependent damage changes.
  const factor = 1 + Math.max(0, s.realm) * .42;
  const hp = Math.floor(def.hp * factor);
  return { id: `enemy-${s.serial++}`, defId, name: def.name, hp, maxHp: hp, armor: 0, statuses: {}, intentIndex: 0, intent: defId === 'cloud-wisp' && cloudMaster(s) ? awaitingCloud() : copy(def.intents[0]), art: def.art };
}
function summon(s: Combat, id: string, amount = 0): void {
  const def = SUMMONS[id];
  if (!def) throw new Error(`Unknown summon: ${id}`);
  if (aliveSummons(s).length >= RULES.summonSlots) {
    const same = s.summons.find(u => u.defId === id && u.hp > 0);
    if (same) { heal(s, same, Math.max(2, Math.floor(def.hp / 4))); log(s, 'summonRefresh', { target: same.id }); }
    else log(s, 'summonFull');
    return;
  }
  const hp = def.hp + amount;
  const u: Summon = { id: `summon-${s.serial++}`, defId: id, name: def.name, hp, maxHp: hp, armor: 0, statuses: {}, attack: def.attack, automatic: def.automatic };
  addStatus(u, 'strength', s.powers.summonStrength ?? 0);
  s.summons.push(u); log(s, 'summon', { target: u.id, summon: id });
}
function amountOf(effect: Effect, context: ResolutionContext, s: Combat): number {
  let value = (effect.amount ?? 0) + (effect.upgrade ?? 0) * grade(context.card);
  if (context.ownerId !== 'player' && s.enemies.some(e => e.id === context.ownerId)) value += (effect.realmScale ?? 0) * s.realm;
  if (effect.pursuit && context.pursuit?.[effect.pursuit.condition]) value += effect.pursuit.amount;
  value += (effect.retainBonus ?? effect.perRetained ?? 0) * (context.card?.retained ?? 0);
  if (effect.statusScale) {
    const onTarget = ['seed', 'flame', 'bleeding', 'poison'].includes(effect.statusScale);
    const holder = onTarget ? getUnit(s, context.targetId) : getUnit(s, context.ownerId);
    if (holder) value += stacks(holder, effect.statusScale) * (effect.scale ?? 1);
  }
  return Math.max(0, Math.floor(value));
}
function targetsOf(s: Combat, effect: Effect, ctx: ResolutionContext): Unit[] {
  const owner = getUnit(s, ctx.ownerId);
  if (!owner) return [];
  if (effect.target === 'self') return [owner];
  if (effect.target === 'allSummons') return aliveSummons(s);
  if (effect.target === 'allEnemies') return ctx.ownerId === 'player' ? aliveEnemies(s) : [s.player, ...aliveSummons(s)];
  if (effect.target === 'enemy') {
    if (ctx.ownerId !== 'player' && !s.summons.some(u => u.id === ctx.ownerId)) return s.player.hp > 0 ? [s.player] : [];
    const target = getUnit(s, ctx.targetId);
    return target && target.hp > 0 && s.enemies.some(e => e.id === target.id) ? [target] : [];
  }
  return [owner];
}
function choiceFor(s: Combat, kind: CombatChoice['kind'], cards: CardInstance[], count: number, ctx?: ResolutionContext, min = 0): void {
  const n = Math.min(cards.length, Math.max(0, count));
  if (!n) return;
  s.choice = { kind, ids: cards.map(c => c.uid), count: n, min: Math.min(min, n), source: ctx?.card?.uid };
}
function conditionPasses(s: Combat, effect: Effect, ctx: ResolutionContext): boolean {
  switch (effect.condition) {
    case 'twoSummons': return aliveSummons(s).length >= 2;
    case 'threeSummons': return aliveSummons(s).length >= 3;
    case 'retained': return (ctx.card?.retained ?? 0) >= (effect.threshold ?? 1);
    case 'hasFlame': return !!getUnit(s, ctx.targetId) && stacks(getUnit(s, ctx.targetId)!, 'flame') > 0;
    case 'hasSeed': return !!getUnit(s, ctx.targetId) && stacks(getUnit(s, ctx.targetId)!, 'seed') > 0;
    default: return true;
  }
}
function applyEffect(s: Combat, effect: Effect, ctx: ResolutionContext): void {
  const owner = getUnit(s, ctx.ownerId);
  if (!owner || owner.hp <= 0 || s.player.hp <= 0 || !conditionPasses(s, effect, ctx)) return;
  const amount = amountOf(effect, ctx, s), targets = targetsOf(s, effect, ctx);
  const defaultTarget = ctx.targetId ?? aliveEnemies(s)[0]?.id;
  const hits = Math.max(1, effect.hits ?? 1);
  const choiceCount = effect.count == null ? amount : effect.count + (effect.upgrade ?? 0) * grade(ctx.card);
  const isAttack = effect.damageFlags?.attack ?? ctx.kind === 'attack';
  const doDamage = (target: Unit, n: number) => damage(s, {
    sourceId: owner.id, targetId: target.id, amount: n, attack: isAttack,
    path: ctx.path, basic: ctx.card ? CARDS[ctx.card.defId].category === 'basic' : false,
    lifesteal: effect.lifesteal, ignoreArmor: effect.damageFlags?.ignoreArmor, armorFraction: effect.damageFlags?.armorFraction,
    noIntercept: effect.damageFlags?.noIntercept,
  });
  switch (effect.op) {
    case 'damage':
      for (let h = 0; h < hits; h++) for (const t of targets) {
        if (owner.hp <= 0 || s.player.hp <= 0) return;
        doDamage(t, amount);
      }
      if (ctx.ownerId === 'player' && ctx.path === 'fire' && ctx.kind === 'attack' && s.powers.flameEngine) {
        for (const t of targets) if (t.hp > 0) addStatus(t, 'flame', s.powers.flameEngine);
      }
      break;
    case 'armor':
      for (const t of targets) armor(s, t, amount + (ctx.card && CARDS[ctx.card.defId].category === 'basic' ? stacks(owner, 'basicPower') + (s.powers.basicTempering ?? 0) : 0));
      break;
    case 'heal': for (const t of targets) heal(s, t, amount); break;
    case 'directLoss': for (const t of targets) directLoss(s, t, amount); break;
    case 'status':
      if (effect.status) for (const t of targets) {
        addStatus(t, effect.status, amount);
        if (effect.status === 'link' && effect.scale != null) s.powers[`linkPercent:${t.id}`] = effect.scale * 100;
        if (effect.status === 'restriction') {
          // Restriction belongs to its living source; player status is only its visible summary.
          if (owner.id !== 'player') {
            if (t.id !== owner.id) addStatus(owner, 'restriction', amount);
            s.powers[`restrictionKind:${owner.id}`] = effect.id === 'skill' ? 2 : 1;
          }
        }
        log(s, 'status', { target: t.id, status: effect.status, amount });
      }
      break;
    case 'draw': draw(s, amount); break;
    case 'energyLoss': s.energy = Math.max(0, s.energy - amount); log(s, 'energyLoss', { amount }); break;
    case 'nextWindDiscount': s.nextWindDiscount += amount; break;
    case 'energy': s.energy = Math.max(0, s.energy + amount); break;
    case 'maxEnergy': s.maxEnergy += amount; s.energy += amount; break;
    case 'flyingSwords': flyingSwords(s, amount); break;
    case 'addStatusCard': {
      if (!effect.id || CARDS[effect.id]?.category !== 'status') break;
      if (s.preview && (effect.to ?? 'draw') === 'draw') { s.uncertain = true; break; }
      for (let i = 0; i < choiceCount; i++) {
        const card: CardInstance = { uid: `status-${s.serial++}`, defId: effect.id, grade: 0, retained: 0 };
        if (effect.to === 'hand') addHand(s, card);
        else s[effect.to ?? 'draw'].push(card);
      }
      if ((effect.to ?? 'draw') === 'draw') s.draw = shuffle(s, s.draw);
      log(s, 'statusCardAdded', { card: effect.id, amount: choiceCount, zone: effect.to ?? 'draw' });
      break;
    }
    case 'cloudCommand':
      for (const beast of cloudBeasts(s)) {
        if (owner.hp <= 0 || s.player.hp <= 0) break;
        if (beast.hp <= 0) continue;
        damage(s, { sourceId: beast.id, targetId: 'player', amount: RULES.cloudFollowupDamage + amount, attack: true });
      }
      log(s, 'cloudCommand', { amount });
      break;
    case 'discard': {
      if (owner.id !== 'player') {
        if (s.preview) { s.uncertain = true; break; }
        // Forced effects discard leftmost cards; this is deterministic and visible.
        const selected = s.hand.splice(0, choiceCount);
        enqueueFront(s, selected.flatMap(c => activeDiscard(s, c, { ownerId: 'player', targetId: owner.id }, false))); 
      } else choiceFor(s, 'discard', s.hand, choiceCount, ctx, choiceCount);
      break;
    }
    case 'recover': {
      const source = effect.from === 'exhaust' ? s.exhaust : s.discard;
      const candidates = source.filter(c => !effect.attackOnly || CARDS[c.defId].kind === 'attack');
      choiceFor(s, 'recover', candidates, choiceCount, ctx);
      break;
    }
    case 'exhaust': choiceFor(s, 'exhaust', s.hand, choiceCount, ctx); break;
    case 'refine': {
      const candidates = s.hand.filter(c => CARDS[c.defId].category !== 'divine' && CARDS[c.defId].category !== 'token' && CARDS[c.defId].category !== 'status' && grade(c) < Math.min(7, s.realm + 1));
      choiceFor(s, 'refine', candidates, Math.max(1, choiceCount), ctx);
      break;
    }
    case 'reorder':
      if (s.preview) { s.uncertain = true; break; }
      choiceFor(s, 'reorder', s.draw.slice(0, amount), amount, ctx, amount);
      break;
    case 'scry':
      if (s.preview) { s.uncertain = true; break; }
      choiceFor(s, 'scry', s.draw.slice(0, amount), amount, ctx);
      break;
    case 'search':
      if (s.preview) { s.uncertain = true; break; }
      choiceFor(s, 'search', s.draw.filter(c => !effect.attackOnly || CARDS[c.defId].kind === 'attack').sort((a, b) => a.defId < b.defId ? -1 : a.defId > b.defId ? 1 : a.uid < b.uid ? -1 : 1), Math.max(1, choiceCount), ctx);
      break;
    case 'summon':
      if (effect.id) {
        if (owner.id === 'player') summon(s, effect.id, amount);
        else if (ENEMIES[effect.id] && aliveEnemies(s).length < 4) s.enemies.push(makeEnemy(s, effect.id));
      }
      break;
    case 'command':
      for (const u of aliveSummons(s)) if (defaultTarget && s.player.hp > 0) summonAttack(s, u, defaultTarget, effect.scale ?? 1, amount);
      break;
    case 'sacrifice': {
      const required = effect.count ?? 2;
      if (aliveSummons(s).length < required) break;
      const victims = aliveSummons(s).slice(0, required);
      for (const v of victims) { v.hp = 0; log(s, owner.id === 'player' ? 'sacrifice' : 'devour', { target: v.id }); }
      s.summons = aliveSummons(s);
      if (owner.id === 'player') {
        if (effect.id) summon(s, effect.id, amount);
        else if (defaultTarget) damage(s, { sourceId: owner.id, targetId: defaultTarget, amount: amount + required * (effect.scale ?? 5) });
      } else heal(s, owner, amount || 5);
      break;
    }
    case 'mountainBreak': {
      const total = owner.armor; owner.armor = 0;
      for (const t of aliveEnemies(s)) doDamage(t, amount + Math.floor(total * (effect.scale ?? 1)));
      break;
    }
    case 'detonate':
      for (const t of targets) { const flame = stacks(t, 'flame'); t.statuses.flame = 0; doDamage(t, amount + flame * (effect.scale ?? 2)); }
      break;
    case 'spread': {
      const main = getUnit(s, defaultTarget), flame = main ? stacks(main, 'flame') : 0;
      for (const t of aliveEnemies(s)) if (t.id !== main?.id) { addStatus(t, 'flame', flame); doDamage(t, amount); }
      break;
    }
    case 'teamBuff': {
      const count = aliveSummons(s).length;
      if (count >= 2) for (const t of [s.player, ...aliveSummons(s)]) addStatus(t, effect.status ?? 'strength', amount * (count >= 3 ? 2 : 1));
      break;
    }
    case 'overwhelm':
      if (aliveSummons(s).length >= 2) for (const t of aliveEnemies(s)) addStatus(t, effect.status ?? 'vulnerable', amount);
      break;
    case 'consumeSword': {
      const intent = stacks(owner, 'swordIntent');
      // Intent is consumed before the hit, so its ordinary per-hit bonus is not double-counted.
      owner.statuses.swordIntent = 0;
      for (const t of targets) doDamage(t, amount + intent * (effect.scale ?? 3));
      break;
    }
    case 'costReduce':
      for (const c of s.hand) c.costDelta = (c.costDelta ?? 0) - amount;
      break;
    case 'power':
      if (effect.id) {
        if (effect.id === 'swordIntentMultiplier') s.powers[effect.id] = Math.max(s.powers[effect.id] ?? 1, amount);
        else s.powers[effect.id] = (s.powers[effect.id] ?? 0) + amount;
        if (effect.id === 'basicTempering') addStatus(s.player, 'basicCost', 1);
        if (effect.id === 'summonStrength') for (const u of aliveSummons(s)) addStatus(u, 'strength', amount);
        log(s, 'power', { power: effect.id!, amount });
      }
      break;
  }
}
function boundary(s: Combat): void {
  while (s.player.hp > 0 && stacks(s.player, 'windMomentum') >= RULES.galeThreshold && aliveEnemies(s).length) {
    addStatus(s.player, 'windMomentum', -RULES.galeThreshold);
    log(s, 'gale');
    for (const enemy of aliveEnemies(s)) damage(s, { sourceId: 'player', targetId: enemy.id, amount: RULES.galeDamage + (s.powers.gale ?? 0) });
    settle(s);
  }
  for (const enemy of aliveEnemies(s)) {
    while (enemy.hp > 0 && s.player.hp > 0 && stacks(enemy, 'bleeding') >= RULES.bleedingThreshold) {
      addStatus(enemy, 'bleeding', -RULES.bleedingThreshold);
      log(s, 'bleedingBurst', { target: enemy.id });
      damage(s, { sourceId: 'player', targetId: enemy.id, amount: RULES.bleedingDamage });
      settle(s);
    }
  }
  if (s.phase === 'player' && !s.tidal && stacks(s.player, 'tidalMomentum') >= RULES.tidalThreshold) {
    addStatus(s.player, 'tidalMomentum', -RULES.tidalThreshold);
    s.tidal = 'rising';
    s.choice = { kind: 'tidal', ids: ['rising', 'tranquil', 'raging'], count: 1, min: 1 };
    log(s, 'tidalAwakens');
  }
}
function endOwner(s: Combat, owner: Unit): void {
  if (owner.hp <= 0 || s.player.hp <= 0) return;
  const poison = stacks(owner, 'poison');
  if (poison) { damage(s, { targetId: owner.id, amount: poison }); addStatus(owner, 'poison', -1); }
  owner.statuses.protectiveQi = Math.floor(stacks(owner, 'protectiveQi') / 2);
  for (const key of ['weak', 'vulnerable', 'restriction', 'link'] as Status[]) addStatus(owner, key, -1);
}
function endPlayer(s: Combat): void {
  s.nextWindDiscount = 0;
  // Each eligible hand card triggers once, before natural discard (including cards drawn by Exhaust).
  const triggered = new Set<string>();
  while (s.phase === 'player') {
    const c = s.hand.find(c => !triggered.has(c.uid) && CARDS[c.defId].onTurnEnd?.length);
    if (!c) break;
    triggered.add(c.uid);
    const def = CARDS[c.defId];
    if (def.autoExhaust === 'onTurnEnd') s.hand.splice(s.hand.findIndex(h => h.uid === c.uid), 1);
    for (const effect of def.onTurnEnd ?? []) applyEffect(s, effect, { ownerId: 'player', card: c, kind: 'skill', path: def.path });
    if (def.autoExhaust === 'onTurnEnd') exhaustCard(s, c);
    settle(s);
  }
  if (s.phase !== 'player') return;
  if (s.tidal && s.energy >= 1) {
    const momentum = stacks(s.player, 'tidalMomentum');
    if (s.tidal === 'tranquil') { armor(s, s.player, 3 + 2 * momentum); addStatus(s.player, 'tidalMomentum', -1); }
    else {
      const candidates = aliveEnemies(s).sort((a, b) => s.tidal === 'rising' ? a.hp - b.hp : b.hp - a.hp);
      if (candidates[0]) damage(s, { sourceId: 'player', targetId: candidates[0].id, amount: s.tidal === 'rising' ? 3 + momentum : 4 + 2 * momentum });
      addStatus(s.player, 'tidalMomentum', s.tidal === 'rising' ? 1 : -1);
    }
    log(s, 'tidal', { state: s.tidal });
    settle(s);
  }
  if (s.phase !== 'player') return;
  for (const summon of aliveSummons(s)) {
    if (summon.automatic === 'turnEnd') {
      const target = aliveEnemies(s)[0];
      if (target) summonAttack(s, summon, target.id);
      settle(s);
      if (s.phase !== 'player') return;
    }
  }
  const retained: CardInstance[] = [];
  for (const c of s.hand) {
    // One-turn cost effects expire as cards leave hand or cross the turn boundary.
    delete c.costDelta;
    if (CARDS[c.defId].retain) {
      c.retained += 1; retained.push(c);
      if (s.powers.formationPatience) armor(s, s.player, s.powers.formationPatience);
    } else { c.retained = 0; s.discard.push(c); }
  }
  s.hand = retained;
  for (const summon of aliveSummons(s)) endOwner(s, summon);
  endOwner(s, s.player);
  settle(s);
}
function startPlayer(s: Combat): void {
  if (s.phase !== 'player') return;
  s.turn += 1;
  s.player.armor = Math.floor(s.player.armor / 2);
  const debt = stacks(s.player, 'energyDebt');
  s.energy = Math.max(0, s.maxEnergy - debt); s.player.statuses.energyDebt = 0;
  if (s.powers.regen) heal(s, s.player, s.powers.regen);
  if (stacks(s.player, 'regen')) {
    heal(s, s.player, stacks(s.player, 'regen')); addStatus(s.player, 'regen', -1);
  }
  if (s.powers.protectiveCycle) addStatus(s.player, 'protectiveQi', s.powers.protectiveCycle);
  if (s.powers.numericalSuperiority) applyEffect(s, { op: 'teamBuff', amount: s.powers.numericalSuperiority }, { ownerId: 'player' });
  for (const enemy of aliveEnemies(s)) {
    if (stacks(enemy, 'seed') > 0) {
      addStatus(enemy, 'seed', 1 + (s.powers.seedGarden ?? 0));
      if (stacks(enemy, 'seed') >= RULES.seedThreshold) {
        addStatus(enemy, 'seed', -RULES.seedThreshold);
        damage(s, { sourceId: 'player', targetId: enemy.id, amount: RULES.seedDamage });
        if (s.player.hp > 0) heal(s, s.player, RULES.seedHeal);
        log(s, 'seedBloom', { target: enemy.id });
        settle(s);
        if (s.phase !== 'player') return;
      }
    }
  }
  draw(s, RULES.turnDraw + (s.powers.foresight ?? 0));
  if (s.powers.swordFoundry) flyingSwords(s, s.powers.swordFoundry);
  log(s, 'turn', { turn: s.turn });
}
function finishCard(s: Combat, card: CardInstance, targetId?: string): void {
  const def = CARDS[card.defId];
  delete s.resolvingCard;
  if (def.exhaust || def.category === 'divine' || def.kind === 'power') exhaustCard(s, card);
  else { card.retained = 0; delete card.costDelta; s.discard.push(card); }
  // Each living Restriction source can retaliate once against this committed card.
  for (const enemy of aliveEnemies(s)) {
    const restricted = s.powers[`restrictionKind:${enemy.id}`];
    if (stacks(enemy, 'restriction') && ((restricted === 1 && def.kind === 'attack') || (restricted === 2 && def.kind === 'skill'))) {
      damage(s, { sourceId: enemy.id, targetId: 'player', amount: 3 });
      log(s, 'backlash', { source: enemy.id, card: card.defId });
      if (s.player.hp <= 0) return;
    }
  }
  void targetId;
}
function drain(s: Combat): void {
  // Every task is finite; reactive damage has explicit causal guards rather than a hidden combo cap.
  while (s.phase === 'player' && !s.choice && s.pending?.length) {
    const task = s.pending.shift()!;
    switch (task.type) {
      case 'effect': applyEffect(s, task.effect, task.context); break;
      case 'finishCard': finishCard(s, task.card, task.targetId); break;
      case 'boundary': boundary(s); break;
      case 'endPlayer': endPlayer(s); break;
      case 'enemy': {
        const enemy = s.enemies.find(e => e.id === task.enemyId);
        if (!enemy || enemy.hp <= 0) break;
        enemy.armor = 0;
        const context: ResolutionContext = { ownerId: enemy.id, targetId: 'player', kind: enemy.intent.kind === 'attack' ? 'attack' : 'skill' };
        enqueueFront(s, [...effectTasks(enemy.intent.effects, context), ...(ENEMIES[enemy.defId].mechanic === 'cloud' && enemy.intent.kind === 'attack' ? [{ type: 'cloudFollowups' as const, enemyId: enemy.id }] : []), { type: 'boundary' }, { type: 'endEnemy', enemyId: enemy.id }]);
        log(s, enemy.defId === 'cloud-wisp' && cloudMaster(s) ? 'cloudWait' : 'enemyIntent', { enemy: enemy.defId, intent: enemy.intentIndex });
        break;
      }
      case 'cloudFollowups': {
        const master = s.enemies.find(e => e.id === task.enemyId);
        if (!master || master.hp <= 0) break;
        for (const beast of cloudBeasts(s)) {
          if (s.player.hp <= 0 || master.hp <= 0) break;
          if (beast.hp <= 0) continue;
          damage(s, { sourceId: beast.id, targetId: 'player', amount: RULES.cloudFollowupDamage, attack: true });
          log(s, 'cloudFollowup', { target: beast.id, amount: RULES.cloudFollowupDamage });
        }
        break;
      }
      case 'endEnemy': {
        const enemy = s.enemies.find(e => e.id === task.enemyId);
        if (enemy && enemy.hp > 0) {
          endOwner(s, enemy);
          if (enemy.hp > 0) {
            const def = ENEMIES[enemy.defId];
            enemy.intentIndex = (enemy.intentIndex + 1) % def.intents.length;
            enemy.intent = enemy.defId === 'cloud-wisp' && cloudMaster(s) ? awaitingCloud() : copy(def.intents[enemy.intentIndex]);
          }
        }
        break;
      }
      case 'startPlayer': startPlayer(s); break;
    }
    settle(s);
  }
}

export function createCombat(config: CombatConfig): Combat {
  const s: Combat = {
    version: RULES.version, seed: config.seed >>> 0, rng: (config.seed >>> 0) || 0x9e3779b9,
    realm: config.realm, turn: 1, phase: 'player',
    player: { id: 'player', name: tr('Cultivator', '修行者', 'Người Tu Hành'), hp: config.hp, maxHp: config.maxHp, armor: 0, statuses: {} },
    enemies: [], summons: [], draw: [], hand: [], discard: [], exhaust: [],
    energy: RULES.energy[Math.min(4, Math.max(0, config.realm))], maxEnergy: RULES.energy[Math.min(4, Math.max(0, config.realm))],
    powers: {}, tidal: null, choice: null, events: [], actions: [], playHistory: [], nextWindDiscount: 0, serial: 1, pending: [],
  };
  const ids = new Set<string>();
  for (const card of config.deck) {
    if (!CARDS[card.defId]) throw new Error(`Unknown card: ${card.defId}`);
    if (ids.has(card.uid)) throw new Error(`Duplicate card instance: ${card.uid}`);
    ids.add(card.uid);
  }
  s.enemies = config.enemies.map(id => makeEnemy(s, id));
  const deck = shuffle(s, config.deck.map(c => ({ uid: c.uid, defId: c.defId, grade: c.grade, retained: 0 })));
  // Innate prioritizes at most the first five cards; extra Innates remain hidden near the top.
  s.draw = [...deck.filter(c => CARDS[c.defId].innate), ...deck.filter(c => !CARDS[c.defId].innate)];
  draw(s, RULES.turnDraw);
  log(s, 'combatStart', { realm: config.realm, seed: config.seed });
  settle(s);
  return s;
}
/** Conditions observe only earlier committed cards in this player turn. Preview never commits. */
export function pursuitState(state: Combat, card: CardInstance) {
  const prior = state.playHistory.filter(p => p.turn === state.turn), previousPlay = prior.at(-1);
  const condition = CARDS[card.defId]?.effects.find(e => e.pursuit)?.pursuit?.condition ?? null;
  const flags: Record<PursuitCondition, boolean> = { priorWind: prior.some(p => p.path === 'wind'), thirdPlay: prior.length === 2, previousAttack: previousPlay?.kind === 'attack' };
  const bonus = CARDS[card.defId]?.effects.reduce((n, e) => n + (e.pursuit && flags[e.pursuit.condition] ? e.pursuit.amount : 0), 0) ?? 0;
  return { ...flags, condition, met: condition ? flags[condition] : false, bonus, nextOrdinal: prior.length + 1, previousPlay };
}
/** Upgrade a local rules-v2 snapshot without replaying already resolved actions or consuming RNG. */
export function migrateCombatRulesV2(state: Combat): Combat {
  if (state.version !== 2) return state;
  const s = copy(state); s.version = RULES.version; s.rulesMigration = { fromVersion: 2, mode: 'snapshot-continuation' };
  s.pending = s.pending?.flatMap(task => {
    if (task.type !== 'effect' || task.context.card?.defId !== 'scarlet-requiem') return [task];
    if (task.effect.op === 'heal') return [];
    const current = CARDS['scarlet-requiem'].effects.find(e => e.op === task.effect.op && e.status === task.effect.status);
    if (current) return [{ ...task, effect: copy(current) }];
    const effect = { ...task.effect }; delete effect.lifesteal;
    return [{ ...task, effect }];
  });
  return s;
}
export function cardCost(state: Combat, card: CardInstance): number {
  const def = CARDS[card.defId];
  if (!def) return Infinity;
  let cost = def.cost + (card.costDelta ?? 0);
  if (def.path === 'wind') cost -= state.nextWindDiscount;
  if (def.category === 'basic') cost += stacks(state.player, 'basicCost');
  if (def.retainCost && card.retained >= def.retainCost.turns) cost -= def.retainCost.reduction;
  return Math.max(0, cost);
}
/** Eligibility inspection intentionally does not require choosing a target yet. */
export function playableReason(state: Combat, card: CardInstance): Text | null {
  if (state.version !== RULES.version) return tr('This combat needs its rules migration before play.', '此战斗需先完成规则迁移才能继续。', 'Trận này cần chuyển đổi luật trước khi tiếp tục.');
  const def = CARDS[card.defId];
  if (!def) return tr('Unknown technique.', '未知技法。', 'Thuật không xác định.');
  if (state.phase !== 'player') return tr('Combat has ended.', '战斗已结束。', 'Trận đấu đã kết thúc.');
  if (state.choice || state.pending?.length) return tr('Finish the current choice.', '请先完成当前选择。', 'Hãy hoàn tất lựa chọn hiện tại.');
  if (!state.hand.some(c => c.uid === card.uid)) return tr('This card is not in your hand.', '此牌不在手牌中。', 'Lá này không nằm trên tay bạn.');
  if (def.unplayable) return tr('This Status card cannot be played.', '此状态牌无法打出。', 'Không thể đánh lá Trạng Thái này.');
  if (def.category !== 'divine' && def.category !== 'token' && grade(card) > state.realm + 1) return tr('This grade exceeds your realm limit.', '品阶超出当前境界可用上限。', 'Cấp này vượt giới hạn cảnh giới của bạn.');
  const cost = cardCost(state, card);
  if (cost > state.energy) return tr(`Requires ${cost} Dao Yuan; you have ${state.energy}.`, `需要${cost}点道元，当前只有${state.energy}点。`, `Cần ${cost} Đạo Nguyên; bạn hiện có ${state.energy}.`);
  const sacrifice = def.effects.find(e => e.op === 'sacrifice' && e.target !== 'allEnemies');
  if (sacrifice && aliveSummons(state).length < (sacrifice.count ?? 2)) return tr(`Requires ${sacrifice.count ?? 2} living summons.`, `需要${sacrifice.count ?? 2}只存活召唤物。`, `Cần ${sacrifice.count ?? 2} linh thú còn sống.`);
  return null;
}
/** The one play boundary: target validation is pure and happens before resource checks. */
export function validateCardPlay(state: Combat, uid: string, targetId?: string): Text | null {
  if (state.version !== RULES.version) return tr('This combat needs its rules migration before play.', '此战斗需先完成规则迁移才能继续。', 'Trận này cần chuyển đổi luật trước khi tiếp tục.');
  if (state.phase !== 'player') return tr('Combat has ended.', '战斗已结束。', 'Trận đấu đã kết thúc.');
  if (state.choice || state.pending?.length) return tr('Finish the current choice.', '请先完成当前选择。', 'Hãy hoàn tất lựa chọn hiện tại.');
  const instances = [...state.hand, ...state.draw, ...state.discard, ...state.exhaust, ...(state.resolvingCard ? [state.resolvingCard] : [])].filter(c => c.uid === uid);
  if (instances.length > 1) return tr('This card instance has duplicate ownership.', '此卡牌实例存在重复归属。', 'Lá bài này có chủ sở hữu trùng lặp.');
  const card = state.hand.find(c => c.uid === uid), def = card ? CARDS[card.defId] : undefined;
  if (!card || !def) return tr('This card is not in your hand.', '此牌不在手牌中。', 'Lá này không nằm trên tay bạn.');
  const enemy = aliveEnemies(state).some(e => e.id === targetId);
  switch (def.target) {
    case 'self':
      if (targetId !== undefined && targetId !== state.player.id) return tr('This card targets you. Choose your portrait.', '此牌作用于自身，请选择自己的头像。', 'Lá này tác động lên bạn. Hãy chọn chân dung của bạn.');
      break;
    case 'enemy':
      if (!enemy) return tr('Choose a living enemy for this card.', '请为此牌选择一名存活敌人。', 'Hãy chọn một kẻ địch còn sống cho lá này.');
      break;
    case 'allEnemies': case 'randomEnemy':
      if (!aliveEnemies(state).length || targetId !== undefined && !enemy) return tr('Choose a living enemy or use the untargeted action.', '请选择存活敌人，或使用无需点选目标的操作。', 'Chọn một kẻ địch còn sống hoặc dùng thao tác không chọn mục tiêu.');
      break;
    case 'none':
      if (targetId !== undefined) return tr('This card has no target.', '此牌无需目标。', 'Lá này không có mục tiêu.');
      break;
    default: return tr('This card has no valid target declaration.', '此牌缺少有效的目标定义。', 'Lá này chưa có khai báo mục tiêu hợp lệ.');
  }
  return playableReason(state, card);
}
export function playCard(state: Combat, uid: string, targetId?: string): Combat {
  if (validateCardPlay(state, uid, targetId)) return state;
  const original = state.hand.find(c => c.uid === uid)!, def = CARDS[original.defId];
  const s = copy(state), index = s.hand.findIndex(c => c.uid === uid), card = s.hand.splice(index, 1)[0];
  const actualCost = cardCost(s, card), pursuit = pursuitState(s, card);
  s.energy -= actualCost;
  if (def.path === 'wind') s.nextWindDiscount = 0;
  s.playHistory.push({ turn: s.turn, uid, defId: card.defId, path: def.path, kind: def.kind, actualCost, ordinal: pursuit.nextOrdinal });
  const requestedTarget = targetId;
  if (def.target === 'self') targetId = s.player.id;
  else if (def.target === 'none') targetId = undefined;
  else if (def.target === 'randomEnemy') {
    if (s.preview) { s.uncertain = true; targetId ??= aliveEnemies(s)[0]?.id; }
    else { const choices = aliveEnemies(s); targetId = choices[Math.floor(random(s) * choices.length)]?.id; }
  }
  s.resolvingCard = card;
  if (!s.preview) s.actions.push({ type: 'playCard', uid, targetId: requestedTarget, turn: s.turn });
  log(s, 'playCard', { card: card.defId, uid, target: targetId ?? 'player' });
  const ctx: ResolutionContext = { ownerId: 'player', targetId, card, kind: def.kind, path: def.path, activeCard: true, pursuit: { priorWind: pursuit.priorWind, thirdPlay: pursuit.thirdPlay, previousAttack: pursuit.previousAttack } };
  s.pending = [...effectTasks(def.effects, ctx), { type: 'finishCard', card, targetId }, { type: 'boundary' }];
  drain(s);
  return s;
}
export function endTurn(state: Combat, tidal?: TidalState): Combat {
  if (state.version !== RULES.version || state.phase !== 'player' || state.choice || state.pending?.length) return state;
  const s = copy(state);
  s.actions.push({ type: 'endTurn', tidal, turn: s.turn });
  if (s.tidal) {
    if (tidal) { s.tidal = tidal; s.tidalChosenTurn = s.turn; }
    else if (s.tidalChosenTurn !== s.turn) s.choice = { kind: 'tidal', ids: ['rising', 'tranquil', 'raging'], count: 1, min: 1 };
  }
  s.pending = [{ type: 'endPlayer' }, ...aliveEnemies(s).map(e => ({ type: 'enemy' as const, enemyId: e.id })), { type: 'startPlayer' }];
  drain(s);
  return s;
}
export function resolveChoice(state: Combat, ids: string[]): Combat {
  const choice = state.choice;
  if (state.version !== RULES.version || !choice || state.phase !== 'player') return state;
  if (new Set(ids).size !== ids.length || ids.length > choice.count || ids.length < (choice.min ?? 0) || ids.some(id => !choice.ids.includes(id))) return state;
  const s = copy(state); s.choice = null;
  if (!s.preview) s.actions.push({ type: 'resolveChoice', ids: [...ids], turn: s.turn });
  if (choice.kind === 'tidal') {
    s.tidal = ids[0] as TidalState; s.tidalChosenTurn = s.turn;
  } else if (choice.kind === 'reorder') {
    const ordered = ids.map(id => s.draw.find(c => c.uid === id)!);
    s.draw = [...ordered, ...s.draw.filter(c => !ids.includes(c.uid))];
  } else {
    const discardTasks: ResolutionTask[] = [];
    for (const id of ids) {
      if (choice.kind === 'refine') {
        const c = s.hand.find(c => c.uid === id);
        if (c) c.tempGrade = Math.min(7, s.realm + 1, grade(c) + 1) as CardInstance['grade'];
        continue;
      }
      let source: CardInstance[];
      if (choice.kind === 'discard' || choice.kind === 'exhaust') source = s.hand;
      else if (choice.kind === 'scry' || choice.kind === 'search') source = s.draw;
      else source = s.exhaust.some(c => c.uid === id) ? s.exhaust : s.discard;
      const index = source.findIndex(c => c.uid === id);
      if (index < 0) continue;
      const card = source.splice(index, 1)[0];
      switch (choice.kind) {
        case 'discard': discardTasks.push(...activeDiscard(s, card, undefined, false)); break;
        case 'exhaust': exhaustCard(s, card); break;
        case 'scry': card.retained = 0; s.discard.push(card); break;
        case 'recover': case 'search': addHand(s, card); break;
      }
    }
    if (discardTasks.length) enqueueFront(s, discardTasks);
    if (choice.kind === 'search' && ids.length) s.draw = shuffle(s, s.draw);
  }
  if (choice.thenDraw) draw(s, choice.thenDraw);
  drain(s);
  return s;
}
export function previewCard(state: Combat, uid: string, targetId: string): { hp: number; armor: number; selfHp: number; hits: number[]; uncertain?: boolean } {
  const before = copy(state); before.preview = true; before.uncertain = false;
  const startEvents = before.events.length;
  const def = state.hand.find(c => c.uid === uid)?.defId;
  const mode = def ? CARDS[def]?.target : undefined;
  const activationTarget = mode === 'self' ? state.player.id : mode === 'none' ? undefined : targetId;
  const after = playCard(before, uid, activationTarget);
  const packets = after.events.slice(startEvents).filter(e => e.code === 'damage' && e.values?.target === targetId);
  const originalTarget = getUnit(state, targetId), nextTarget = getUnit(after, targetId);
  return {
    hp: Math.max(0, (originalTarget?.hp ?? 0) - (nextTarget?.hp ?? 0)),
    armor: Math.max(0, (originalTarget?.armor ?? 0) - (nextTarget?.armor ?? 0)),
    selfHp: Math.max(0, state.player.hp - after.player.hp),
    hits: packets.map(e => Number(e.values?.amount ?? 0)),
    uncertain: after.uncertain || !!after.choice || undefined,
  };
}
const say = (locale: Locale, en: string, zhCN: string, vi: string): string => ({ en, 'zh-CN': zhCN, vi })[locale];
function describeEffect(effect: Effect, locale: Locale, context: ResolutionContext, state?: Combat): string {
  const e = effect, def = context.card ? CARDS[context.card.defId] : undefined;
  const raw = state ? amountOf(e, context, state) : Math.max(0, (e.amount ?? 0) + (e.upgrade ?? 0) * grade(context.card) + (e.retainBonus ?? e.perRetained ?? 0) * (context.card?.retained ?? 0));
  const count = e.count == null ? raw : e.count + (e.upgrade ?? 0) * grade(context.card);
  const attack = e.damageFlags?.attack ?? context.kind === 'attack';
  const n = state && e.op === 'damage' ? attackAmount(state, { targetId: '', sourceId: context.ownerId, amount: raw, attack, path: context.path, basic: def?.category === 'basic' }, getUnit(state, context.ownerId)) : raw;
  const all = e.target === 'allEnemies', status = e.status ? STATUS_NAMES[e.status][locale] : '';
  const L = (en: string, zhCN: string, vi: string) => say(locale, en, zhCN, vi);
  const entity = e.id ? (SUMMONS[e.id] ?? ENEMIES[e.id])?.name[locale] ?? e.id : '';
  let text = '';
  switch (e.op) {
    case 'damage': {
      const hits = (e.hits ?? 1) > 1 ? ` × ${e.hits}` : '';
      text = L(`Deal ${n}${hits} damage${all ? ' to all enemies' : ''}.`, `对${all ? '所有敌人' : '目标'}造成${n}${hits.replaceAll(' ', '')}点伤害。`, `Gây ${n}${hits} sát thương${all ? ' lên mọi kẻ địch' : ''}.`);
      if (e.lifesteal) text += L(' Heal the HP damage dealt.', ' 回复实际造成的生命伤害。', ' Hồi lượng Sinh Lực thực tế đã gây mất.');
      if (e.damageFlags?.ignoreArmor) text += L(' Ignores Armor.', ' 无视护甲。', ' Bỏ qua Giáp.');
      if (e.damageFlags?.armorFraction != null) { const pct = Math.round(e.damageFlags.armorFraction * 100); text += L(` Only ${pct}% of current Armor can block this hit; consume only the amount blocked.`, `本次仅有当前护甲的${pct}%可吸收伤害；仅扣除实际吸收的护甲。`, `Chỉ ${pct}% Giáp hiện tại có thể chặn đòn này; chỉ tiêu hao phần đã chặn.`); }
      break;
    }
    case 'armor': {
      let value = raw;
      if (state) {
        if (def?.category === 'basic') value += stacks(state.player, 'basicPower') + (state.powers.basicTempering ?? 0);
        const owner = getUnit(state, context.ownerId); value = Math.floor(value * (1 + .1 * (owner ? stacks(owner, 'fortify') : 0)));
      }
      text = L(`Gain ${value} Armor.`, `获得${value}点护甲。`, `Nhận ${value} Giáp.`); break;
    }
    case 'heal': text = L(`Heal ${raw} HP.`, `回复${raw}点生命。`, `Hồi ${raw} Sinh Lực.`); break;
    case 'directLoss': text = L(`Lose ${raw} HP directly.`, `直接失去${raw}点生命。`, `Trực tiếp mất ${raw} Sinh Lực.`); break;
    case 'status': text = L(`${e.target === 'self' ? 'Gain' : 'Apply'} ${raw} ${status}${all ? ' to all enemies' : ''}.`, `${e.target === 'self' ? '获得' : `对${all ? '所有敌人' : '目标'}施加`}${raw}层${status}。`, `${e.target === 'self' ? 'Nhận' : 'Gây'} ${raw} ${status}${all ? ' lên mọi kẻ địch' : ''}.`); break;
    case 'draw': text = L(`Draw ${raw}.`, `抽${raw}张牌。`, `Rút ${raw} lá.`); break;
    case 'energy': text = L(`Gain ${raw} Dao Yuan.`, `获得${raw}点道元。`, `Nhận ${raw} Đạo Nguyên.`); break;
    case 'energyLoss': text = L(`Lose ${raw} current Dao Yuan (minimum 0).`, `失去${raw}点当前道元，最低为0。`, `Mất ${raw} Đạo Nguyên hiện tại (tối thiểu 0).`); break;
    case 'maxEnergy': text = L(`Gain ${raw} maximum Dao Yuan and ${raw} Dao Yuan this combat.`, `本场战斗道元上限增加${raw}，立即获得${raw}道元。`, `Trong trận này, tăng ${raw} Đạo Nguyên tối đa và nhận ngay ${raw} Đạo Nguyên.`); break;
    case 'flyingSwords': text = L(`Create ${raw} Flying Sword${raw === 1 ? '' : 's'}.`, `生成${raw}张飞剑。`, `Tạo ${raw} Phi Kiếm.`); break;
    case 'discard': text = L(`Actively discard ${count} card${count === 1 ? '' : 's'}.`, `主动弃置${count}张牌。`, `Chủ động bỏ ${count} lá.`); break;
    case 'recover': text = L(`Recover up to ${count} ${e.attackOnly ? 'Attack ' : ''}cards from ${e.from === 'exhaust' ? 'Exhaust' : 'Discard'}.`, `从${e.from === 'exhaust' ? '消耗' : '弃牌'}堆取回至多${count}张${e.attackOnly ? '攻击' : ''}牌。`, `Lấy lại tối đa ${count} lá ${e.attackOnly ? 'Tấn Công ' : ''}từ chồng ${e.from === 'exhaust' ? 'Tiêu Hao' : 'Bỏ'}.`); break;
    case 'exhaust': text = L(`Exhaust up to ${count} cards from hand.`, `消耗至多${count}张手牌。`, `Tiêu Hao tối đa ${count} lá trên tay.`); break;
    case 'refine': text = L(`Temporarily upgrade up to ${Math.max(1, count)} cards in hand by one grade, within your realm limit.`, `选择至多${Math.max(1, count)}张手牌，临时提升一级（不超过境界上限）。`, `Tạm nâng tối đa ${Math.max(1, count)} lá trên tay lên một cấp, trong giới hạn cảnh giới.`); break;
    case 'scry': text = L(`Inspect the top ${raw} cards. Discard any of them.`, `查看牌库顶${raw}张，可弃置任意张。`, `Xem ${raw} lá trên cùng. Có thể bỏ bất kỳ lá nào trong số đó.`); break;
    case 'reorder': text = L(`Inspect the top ${raw} cards and put them back in your chosen order, first selected on top.`, `查看牌库顶${raw}张并重新排序；首先选择的牌放在最上方。`, `Xem ${raw} lá trên cùng rồi sắp xếp lại; lá chọn đầu tiên nằm trên cùng.`); break;
    case 'search': text = L(`Search your Draw pile for up to ${Math.max(1, count)} ${e.attackOnly ? 'Attack ' : ''}cards. Shuffle the remainder.`, `从抽牌堆选择至多${Math.max(1, count)}张${e.attackOnly ? '攻击' : ''}牌加入手牌，洗切余牌。`, `Tìm tối đa ${Math.max(1, count)} lá ${e.attackOnly ? 'Tấn Công ' : ''}trong chồng Rút để thêm vào tay. Xáo phần còn lại.`); break;
    case 'summon': text = L(`Summon ${entity}${raw ? ` with +${raw} HP` : ''}.`, `召唤${entity}${raw ? `（生命+${raw}）` : ''}。`, `Triệu hồi ${entity}${raw ? ` với thêm ${raw} Sinh Lực` : ''}.`); break;
    case 'command': text = L(`All summons attack the chosen enemy${e.scale && e.scale !== 1 ? ` at ${e.scale}× damage` : ''}${raw ? ` with +${raw} damage per attack` : ''}.`, `所有召唤物攻击所选敌人${e.scale && e.scale !== 1 ? `，伤害×${e.scale}` : ''}${raw ? `，每次攻击额外+${raw}点伤害` : ''}。`, `Mọi linh thú tấn công kẻ địch được chọn${e.scale && e.scale !== 1 ? ` với sát thương ×${e.scale}` : ''}${raw ? `, mỗi đòn thêm ${raw} sát thương` : ''}.`); break;
    case 'cloudCommand': text = L(`Command each living Cloud Wisp to strike once for ${RULES.cloudFollowupDamage + raw} base damage. This command is not an Attack and triggers no follow-ups.`, `命令每只存活云精攻击一次，基础伤害${RULES.cloudFollowupDamage + raw}。此命令不属于攻击，不触发追击。`, `Lệnh cho mỗi Vân Tinh còn sống đánh một lần, sát thương cơ bản ${RULES.cloudFollowupDamage + raw}. Lệnh này không phải Tấn Công và không kích hoạt đánh tiếp.`); break;
    case 'addStatusCard': {
      const card = CARDS[e.id ?? '']?.name[locale] ?? e.id;
      const zone = L(e.to ?? 'draw', e.to === 'hand' ? '手牌' : e.to === 'discard' ? '弃牌堆' : '抽牌堆', e.to === 'hand' ? 'tay' : e.to === 'discard' ? 'chồng Bỏ' : 'chồng Rút');
      text = L(`Add ${count} temporary ${card} to your ${zone}${(e.to ?? 'draw') === 'draw' ? ' and shuffle that pile' : ''}.`, `将${count}张临时「${card}」加入你的${zone}${(e.to ?? 'draw') === 'draw' ? '并洗切' : ''}。`, `Thêm ${count} lá tạm thời ${card} vào ${zone} của bạn${(e.to ?? 'draw') === 'draw' ? ' rồi xáo chồng đó' : ''}.`); break;
    }
    case 'sacrifice': text = L(`Sacrifice ${e.count ?? 2} summons${e.id ? ` to summon ${entity}` : ` to deal ${raw + (e.count ?? 2) * (e.scale ?? 5)} damage`}.`, `献祭${e.count ?? 2}只召唤物${e.id ? `，召唤${entity}` : `，造成${raw + (e.count ?? 2) * (e.scale ?? 5)}点伤害`}。`, `Hiến tế ${e.count ?? 2} linh thú${e.id ? ` để triệu hồi ${entity}` : ` để gây ${raw + (e.count ?? 2) * (e.scale ?? 5)} sát thương`}.`); break;
    case 'mountainBreak': text = L(`Consume all Armor. Deal Armor × ${e.scale ?? 1}${raw ? ` + ${raw}` : ''} damage to all enemies.`, `消耗全部护甲，对所有敌人造成护甲×${e.scale ?? 1}${raw ? `+${raw}` : ''}点伤害。`, `Tiêu hết Giáp. Gây sát thương bằng Giáp × ${e.scale ?? 1}${raw ? ` + ${raw}` : ''} lên mọi kẻ địch.`); break;
    case 'detonate': text = L(`Consume ${all ? 'each enemy' : "the target"}'s Explosive Flame. Deal ${raw} + Flame × ${e.scale ?? 2} damage.`, `消耗${all ? '每个敌人' : '目标'}全部爆炎，造成${raw}+爆炎×${e.scale ?? 2}点伤害。`, `Tiêu hết Bạo Viêm của ${all ? 'từng kẻ địch' : 'mục tiêu'}. Gây ${raw} + Bạo Viêm × ${e.scale ?? 2} sát thương.`); break;
    case 'spread': text = L(`Copy the target's Explosive Flame to other enemies and deal ${raw} damage to them.`, `将目标爆炎复制给其他敌人，并对其造成${raw}点伤害。`, `Sao chép Bạo Viêm của mục tiêu sang các kẻ địch khác và gây ${raw} sát thương lên chúng.`); break;
    case 'teamBuff': { const name = status || STATUS_NAMES.strength[locale]; text = L(`With 2 summons, your team gains ${raw} ${name}. With 3, double it.`, `拥有2只召唤物时，全队获得${raw}层${name}；3只时翻倍。`, `Khi có 2 linh thú, cả đội nhận ${raw} ${name}. Khi có 3, hiệu quả gấp đôi.`); break; }
    case 'overwhelm': { const name = status || STATUS_NAMES.vulnerable[locale]; text = L(`With at least 2 summons, apply ${raw} ${name} to all enemies.`, `拥有至少2只召唤物时，对所有敌人施加${raw}层${name}。`, `Khi có ít nhất 2 linh thú, gây ${raw} ${name} lên mọi kẻ địch.`); break; }
    case 'consumeSword': text = L(`Consume all Sword Intent. Deal ${raw} + Intent × ${e.scale ?? 3} damage.`, `消耗全部剑意，造成${raw}+剑意×${e.scale ?? 3}点伤害。`, `Tiêu hết Kiếm Ý. Gây ${raw} + Kiếm Ý × ${e.scale ?? 3} sát thương.`); break;
    case 'costReduce': text = L(`Cards in hand cost ${raw} less this turn.`, `本回合手牌耗元减少${raw}。`, `Các lá trên tay tốn ít hơn ${raw} Đạo Nguyên trong lượt này.`); break;
    case 'nextWindDiscount': text = L(`The next Wind card played this turn costs ${raw} less Dao Yuan. Consumed even by a zero-cost card.`, `本回合下一张打出的风道牌耗元减少${raw}；零费牌也会消耗此效果。`, `Lá Phong Đạo tiếp theo được đánh trong lượt này tốn ít hơn ${raw} Đạo Nguyên. Lá miễn phí cũng tiêu thụ hiệu quả này.`); break;
    case 'power': text = (POWER_TEXT[e.id ?? '']?.[locale] ?? L('Gain a persistent combat effect.', '本场战斗获得持续效果。', 'Nhận hiệu quả kéo dài trong trận.')).replaceAll('{n}', String(raw)); break;
  }
  if (e.pursuit) {
    const condition = e.pursuit.condition === 'priorWind' ? L('an earlier Wind card was played this turn', '本回合此前打出过风道牌', 'đã đánh một lá Phong Đạo trước đó trong lượt này') : e.pursuit.condition === 'thirdPlay' ? L('this is exactly your third card this turn', '此牌恰为本回合第三张打出的牌', 'đây chính xác là lá thứ ba được đánh trong lượt này') : L('the previous card played was an Attack', '上一张打出的牌为攻击牌', 'lá vừa đánh trước đó là Tấn Công');
    text += L(` Pursuit: +${e.pursuit.amount} if ${condition}${state ? (context.pursuit?.[e.pursuit.condition] ? ' (included)' : ' (inactive)') : ''}.`, ` 追击：若${condition}，效果+${e.pursuit.amount}${state ? (context.pursuit?.[e.pursuit.condition] ? '（已计入）' : '（未触发）') : ''}。`, ` Truy Kích: +${e.pursuit.amount} nếu ${condition}${state ? (context.pursuit?.[e.pursuit.condition] ? ' (đã tính)' : ' (chưa kích hoạt)') : ''}.`);
  }
  if (e.statusScale) text += L(` Scales with target ${STATUS_NAMES[e.statusScale][locale]} × ${e.scale ?? 1}.`, ` 随目标${STATUS_NAMES[e.statusScale][locale]}×${e.scale ?? 1}提升。`, ` Tăng theo ${STATUS_NAMES[e.statusScale][locale]} của mục tiêu × ${e.scale ?? 1}.`);
  if (e.retainBonus || e.perRetained) text += L(` +${e.retainBonus ?? e.perRetained} per turn Retained.`, ` 每保留一回合+${e.retainBonus ?? e.perRetained}。`, ` +${e.retainBonus ?? e.perRetained} mỗi lượt Giữ Lại.`);
  if (e.condition) {
    const condition = e.condition === 'retained' ? L(`After ${e.threshold ?? 1} turn Retained: `, `保留${e.threshold ?? 1}回合后：`, `Sau ${e.threshold ?? 1} lượt Giữ Lại: `) : e.condition === 'twoSummons' || e.condition === 'threeSummons' ? L(`With ${e.condition === 'twoSummons' ? 2 : 3} summons: `, `拥有${e.condition === 'twoSummons' ? 2 : 3}只召唤物时：`, `Khi có ${e.condition === 'twoSummons' ? 2 : 3} linh thú: `) : L(`If the target has ${e.condition === 'hasFlame' ? 'Explosive Flame' : 'Seeds'}: `, `目标有${e.condition === 'hasFlame' ? '爆炎' : '种子'}时：`, `Nếu mục tiêu có ${e.condition === 'hasFlame' ? 'Bạo Viêm' : 'Hạt Giống'}: `);
    text = condition + text;
  }
  return text;
}
export function describeCard(card: CardInstance, locale: Locale, state?: Combat): string {
  const def = CARDS[card.defId];
  if (!def) return say(locale, 'Unknown technique.', '未知技法。', 'Thuật không xác định.');
  const pursuit = state ? pursuitState(state, card) : undefined;
  const context: ResolutionContext = { ownerId: 'player', card, kind: def.kind, path: def.path, pursuit };
  const clauses = def.effects.map(e => describeEffect(e, locale, context, state));
  const L = (en: string, zhCN: string, vi: string) => say(locale, en, zhCN, vi);
  for (const hook of ['onDiscard', 'onDraw', 'onTurnEnd'] as const) if (def[hook]?.length) {
    const prefix = hook === 'onDiscard' ? L('When actively discarded: ', '主动弃置时：', 'Khi chủ động bỏ: ') : hook === 'onDraw' ? L('When drawn, before hand overflow: ', '抽到时（先于手牌溢出）：', 'Khi rút, trước khi tràn tay: ') : L('At the end of your turn while in hand: ', '回合结束时若在手牌中：', 'Cuối lượt của bạn nếu còn trên tay: ');
    clauses.push(prefix + def[hook]!.map(e => describeEffect(e, locale, { ...context, kind: 'skill' }, state)).join(' '));
  }
  if (def.unplayable) clauses.push(L('Unplayable.', '无法打出。', 'Không thể đánh.'));
  if (def.autoExhaust || def.exhaust) clauses.push(L(def.autoExhaust ? 'Exhaust after triggering.' : 'Exhaust.', def.autoExhaust ? '触发后消耗。' : '消耗。', def.autoExhaust ? 'Tiêu Hao sau khi kích hoạt.' : 'Tiêu Hao.'));
  if (def.category === 'status') clauses.push(L('Temporary: removed when combat ends.', '临时牌：战斗结束时移除。', 'Lá tạm thời: bị loại khi trận đấu kết thúc.'));
  if (def.retainCost) clauses.push(L(`After ${def.retainCost.turns} turns Retained, costs ${def.retainCost.reduction} less.`, `保留${def.retainCost.turns}回合后，耗元减少${def.retainCost.reduction}。`, `Sau ${def.retainCost.turns} lượt Giữ Lại, tốn ít hơn ${def.retainCost.reduction} Đạo Nguyên.`));
  return clauses.join(' ');
}

/** Empty name means internal rule metadata, not a displayable persistent power. */
export function powerName(id: string, locale: Locale): string { return POWER_NAMES[id]?.[locale] ?? ''; }
export function describePower(id: string, amount: number, locale: Locale): string {
  return POWER_TEXT[id]?.[locale].replaceAll('{n}', String(amount)) ?? '';
}
/** Intent values include source Strength, Pierce, and Weak, without assuming target defenses. */
export function enemyAttackValue(state: Combat, enemyId: string, effect: Effect): number {
  const enemy = state.enemies.find(e => e.id === enemyId);
  return attackAmount(state, { sourceId: enemyId, targetId: 'player', amount: (effect.amount ?? 0) + (effect.realmScale ?? 0) * state.realm, attack: effect.damageFlags?.attack ?? enemy?.intent.kind === 'attack' }, enemy);
}
/** Resolves this committed action on a clone using current defenses; no next intent or hidden draw is exposed. */
export function previewEnemyAction(state: Combat, enemyId: string) {
  const s = copy(state); s.preview = true; s.uncertain = false; s.choice = null; s.pending = [{ type: 'enemy', enemyId }];
  const start = s.events.length;
  drain(s);
  const hits = s.events.slice(start).filter(e => e.code === 'damage' && e.values?.target === 'player');
  return { hp: Math.max(0, state.player.hp - s.player.hp), armor: Math.max(0, state.player.armor - s.player.armor), hits: hits.map(e => Number(e.values?.amount ?? 0)), uncertain: s.uncertain || !!s.choice || undefined };
}
/** An explicit Cloud Warning announces its next heavy hit; other enemies expose only their current intent. */
export function enemyIntentThreat(state: Combat, enemyId: string) {
  const enemy = state.enemies.find(e => e.id === enemyId);
  if (!enemy || enemy.hp <= 0) return { warning: false, main: 0, hits: 0, followups: 0, followupTotal: 0, total: 0 };
  const def = ENEMIES[enemy.defId];
  const warning = def.mechanic === 'cloud' && enemy.intentIndex === 3 && enemy.intent.effects.length === 0;
  const intent = warning ? def.intents[(enemy.intentIndex + 1) % def.intents.length] : enemy.intent;
  const attacks = intent.effects.filter(e => e.op === 'damage');
  const main = attacks[0] ? enemyAttackValue(state, enemyId, attacks[0]) : 0;
  const hits = attacks[0]?.hits ?? (attacks.length ? 1 : 0);
  const followups = def.mechanic === 'cloud' && intent.kind === 'attack' ? cloudBeasts(state).length : 0;
  const followupTotal = followups ? cloudBeasts(state).reduce((n, beast) => n + attackAmount(state, {sourceId: beast.id, targetId: 'player', amount: RULES.cloudFollowupDamage, attack: true}, beast), 0) : 0;
  const command = intent.effects.find(e => e.op === 'cloudCommand');
  const commandTotal = command ? cloudBeasts(state).reduce((n, beast) => n + attackAmount(state, {sourceId: beast.id, targetId: 'player', amount: RULES.cloudFollowupDamage + amountOf(command, {ownerId: enemyId}, state), attack: true}, beast), 0) : 0;
  return { warning, main, hits, followups, followupTotal, total: attacks.reduce((n, e) => n + enemyAttackValue(state, enemyId, e) * (e.hits ?? 1), 0) + followupTotal + commandTotal, armorFraction: attacks[0]?.damageFlags?.armorFraction };
}
/** Describes only the visible committed intent, including Cloud commands and follow-ups. */
export function describeEnemyIntent(state: Combat, enemyId: string, locale: Locale): string {
  const enemy = state.enemies.find(e => e.id === enemyId);
  if (!enemy || enemy.hp <= 0) return '';
  const L = (en: string, zhCN: string, vi: string) => say(locale, en, zhCN, vi);
  if (enemy.defId === 'cloud-wisp' && cloudMaster(state)) return L('Await Command: no independent action while the Beastmaster lives. Attacks only when commanded or following its Attack.', '静候云令：御兽师存活时无独立行动；仅响应命令或攻击追击。', 'Chờ Lệnh Mây: không tự hành động khi Ngự Thú Sư còn sống. Chỉ đánh khi được ra lệnh hoặc theo sau Tấn Công của chủ.');
  const ctx: ResolutionContext = { ownerId: enemy.id, targetId: 'player', kind: enemy.intent.kind === 'attack' ? 'attack' : 'skill' };
  const clauses = enemy.intent.effects.map(e => describeEffect(e, locale, ctx, state));
  if (!clauses.length) {
    const threat = enemyIntentThreat(state, enemyId);
    if (threat.warning) {
      const pct = Math.round((threat.armorFraction ?? 1) * 100);
      clauses.push(L(`Warning only: no damage now. After your next full player turn, the heavy hit deals ${threat.main} base damage with only ${pct}% of current Armor available to block. ${threat.followups} currently living beasts can follow up for ${threat.followupTotal} more (${threat.total} total before defenses).`, `仅作预警：此刻无伤害。你有完整的下一回合准备；随后重击基础伤害${threat.main}，仅有当前护甲的${pct}%可吸收。当前${threat.followups}只存活云精可追加${threat.followupTotal}点追击（防御前合计${threat.total}）。`, `Chỉ cảnh báo: chưa gây sát thương. Sau trọn lượt tiếp theo của bạn, trọng kích gây ${threat.main} sát thương cơ bản; chỉ ${pct}% Giáp hiện tại có thể chặn. ${threat.followups} Vân Tinh hiện còn sống có thể đánh tiếp thêm ${threat.followupTotal} (tổng ${threat.total} trước phòng thủ).`));
    } else clauses.push(L('Waits without dealing damage.', '等待，不造成伤害。', 'Chờ, không gây sát thương.'));
  }
  if (ENEMIES[enemy.defId].mechanic === 'cloud' && enemy.intent.kind === 'attack') {
    const beasts = cloudBeasts(state), total = beasts.reduce((n, beast) => n + attackAmount(state, { sourceId: beast.id, targetId: 'player', amount: RULES.cloudFollowupDamage, attack: true }, beast), 0);
    clauses.push(L(`After this entire Attack, ${beasts.length} currently living Cloud Wisps each follow up once (${total} total damage before your defenses). Dead beasts cannot follow up.`, `整次攻击结束后，当前${beasts.length}只存活云精各追击一次（防御前合计${total}点伤害）；死亡云精不能追击。`, `Sau toàn bộ Tấn Công này, ${beasts.length} Vân Tinh hiện còn sống đánh tiếp mỗi con một lần (tổng ${total} sát thương trước phòng thủ). Vân Tinh đã chết không thể đánh tiếp.`));
  }
  return clauses.join(' ');
}
export function describeCombatEvent(event: Combat['events'][number], locale: Locale, state?: Combat): string {
  const v = event.values ?? {}, n = Number(v.amount ?? 0);
  const L = (en: string, zhCN: string, vi: string) => say(locale, en, zhCN, vi);
  const unit = (id: unknown): string => {
    if (id === 'player') return L('You', '你', 'Bạn');
    const actual = state ? getUnit(state, String(id)) : undefined;
    if (actual) return actual.name[locale];
    const past = state?.events.find(e => e.code === 'summon' && e.values?.target === id)?.values?.summon;
    if (past && SUMMONS[String(past)]) return SUMMONS[String(past)].name[locale];
    return ENEMIES[String(id)]?.name[locale] ?? L('The target', '目标', 'Mục tiêu');
  };
  const card = CARDS[String(v.card)]?.name[locale] ?? L('Technique', '技法', 'Thuật');
  const target = unit(v.target);
  switch (event.code) {
    case 'combatStart': return L('Combat begins.', '战斗开始。', 'Trận đấu bắt đầu.');
    case 'turn': return L(`Turn ${v.turn}.`, `第${v.turn}回合。`, `Lượt ${v.turn}.`);
    case 'playCard': return L(`Played ${card}.`, `施展「${card}」。`, `Đã đánh ${card}.`);
    case 'damage': return L(`${target}: ${Number(v.hp)} HP lost, ${Number(v.armor)} absorbed by Armor.`, `${target}承受${Number(v.hp)}点生命伤害，护甲吸收${Number(v.armor)}点。`, `${target}: mất ${Number(v.hp)} Sinh Lực, Giáp hấp thụ ${Number(v.armor)}.`);
    case 'directLoss': return L(`${target}: lost ${n} HP directly.`, `${target}直接失去${n}点生命。`, `${target}: trực tiếp mất ${n} Sinh Lực.`);
    case 'energyLoss': return L(`Lost ${n} current Dao Yuan, down to a minimum of 0.`, `失去${n}点当前道元，最低为0。`, `Mất ${n} Đạo Nguyên hiện tại, tối thiểu còn 0.`);
    case 'armor': return L(`${target}: gained ${n} Armor.`, `${target}获得${n}点护甲。`, `${target}: nhận ${n} Giáp.`);
    case 'heal': return L(`${target}: healed ${n} HP.`, `${target}回复${n}点生命。`, `${target}: hồi ${n} Sinh Lực.`);
    case 'status': { const status = STATUS_NAMES[String(v.status) as Status]?.[locale] ?? L('status', '状态', 'trạng thái'); return L(`${target}: gained ${n} ${status}.`, `${target}获得${n}层${status}。`, `${target}: nhận ${n} ${status}.`); }
    case 'dodge': return L(`${target}: dodged this hit.`, `${target}闪避了这次伤害。`, `${target}: né đòn này.`);
    case 'intercept': return L(`Companions intercepted ${n} damage.`, `召唤物拦截${n}点伤害。`, `Linh thú chặn ${n} sát thương.`);
    case 'death': return L(`${target}: defeated.`, `${target}倒下了。`, `${target}: đã gục ngã.`);
    case 'overflow': return L(`Hand full: ${card} entered Discard.`, `手牌已满，「${card}」进入弃牌堆。`, `Tay đã đầy: ${card} vào chồng Bỏ.`);
    case 'shuffle': return L('Discard shuffled into the Draw pile.', '弃牌堆已洗入抽牌堆。', 'Chồng Bỏ được xáo vào chồng Rút.');
    case 'flyingSwords': return L(`Created ${n} Flying Sword${n === 1 ? '' : 's'}.`, `生成${n}张飞剑。`, `Tạo ${n} Phi Kiếm.`);
    case 'exhaust': return L(`Exhausted ${card}.`, `消耗「${card}」。`, `Đã Tiêu Hao ${card}.`);
    case 'activeDiscard': return L(`Actively discarded ${card}.`, `主动弃置「${card}」。`, `Đã chủ động bỏ ${card}.`);
    case 'statusCardAdded': return L(`Added ${n} temporary ${card}.`, `加入${n}张临时「${card}」。`, `Đã thêm ${n} lá tạm thời ${card}.`);
    case 'summon': { const name = SUMMONS[String(v.summon)]?.name[locale] ?? L('a companion', '灵兽', 'một linh thú'); return L(`Summoned ${name}.`, `${name}应召而来。`, `Triệu hồi ${name}.`); }
    case 'summonRefresh': return L(`${target}: replenished.`, `${target}获得补充。`, `${target}: được bổ sung.`);
    case 'summonFull': return L('All three summon slots are occupied.', '三个召唤位已满。', 'Cả ba ô triệu hồi đều đã đầy.');
    case 'sacrifice': return L(`Sacrificed ${target}.`, `献祭${target}。`, `Hiến tế ${target}.`);
    case 'devour': return L(`${target}: devoured.`, `${target}被吞噬。`, `${target}: bị nuốt chửng.`);
    case 'power': return L(`Activated ${powerName(String(v.power), locale)}.`, `激活「${powerName(String(v.power), locale)}」。`, `Kích hoạt ${powerName(String(v.power), locale)}.`);
    case 'gale': return L('Momentum becomes a Gale, striking all enemies.', '风势化为狂风，席卷敌阵。', 'Phong Thế hóa Cuồng Phong, đánh mọi kẻ địch.');
    case 'bleedingBurst': return L(`${target}: Bleeding erupts.`, `${target}的流血爆发。`, `${target}: Chảy Máu bùng phát.`);
    case 'seedBloom': return L(`${target}: Seeds bloom.`, `${target}身上的种子绽放。`, `${target}: Hạt Giống nảy nở.`);
    case 'tidalAwakens': return L('Tidal Domain awakens. Choose its state.', '潮汐领域苏醒，选择潮态。', 'Thủy Triều Thức Tỉnh. Hãy chọn trạng thái.');
    case 'tidal': { const names: Record<string, Text> = { rising: tr('Rising Tide', '涨潮', 'Triều Dâng'), tranquil: tr('Tranquil Sea', '静海', 'Biển Lặng'), raging: tr('Raging Tide', '怒涛', 'Sóng Dữ') }; const name = names[String(v.state)]?.[locale] ?? L('Tidal Domain', '潮汐', 'Thủy Triều'); return L(`${name} activates.`, `${name}生效。`, `${name} kích hoạt.`); }
    case 'backlash': return L(`${card} triggered Restriction backlash.`, `禁制因「${card}」触发反噬。`, `${card} kích hoạt phản phệ Cấm Chế.`);
    case 'cloudFollowup': return L(`${target} followed up once.`, `${target}追击一次。`, `${target} đánh tiếp một lần.`);
    case 'cloudWait': return L('A Cloud Wisp awaits its master’s command.', '云精静候御兽师号令。', 'Vân Tinh chờ lệnh của chủ.');
    case 'cloudCommand': return L('The living Cloud Wisps obey the command.', '存活云精响应云令。', 'Các Vân Tinh còn sống tuân lệnh.');
    case 'enemyIntent': { const def = ENEMIES[String(v.enemy)], name = def?.name[locale] ?? L('The enemy', '敌人', 'Kẻ địch'), intent = def?.intents[Number(v.intent)]?.name[locale] ?? L('a technique', '技法', 'một thuật'); return L(`${name} used ${intent}.`, `${name}施展「${intent}」。`, `${name} thi triển ${intent}.`); }
    default: return L('Combat state updated.', '战斗状态已更新。', 'Trạng thái trận đấu đã cập nhật.');
  }
}
