// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

export type Locale = 'en' | 'zh-CN' | 'vi';
export type Text = { en: string; 'zh-CN': string; vi: string };
export type Path = 'fire'|'wood'|'earth'|'water'|'metal'|'sword'|'wind'|'blood'|'summoning'|'strength'|'refinement'|'formation'|'wisdom';
export type Grade = 0|1|2|3|4|5|6|7;
export type Category = 'basic'|'dao'|'immortal'|'divine'|'token'|'status';
export type EffectOp = 'damage'|'armor'|'heal'|'status'|'draw'|'energy'|'maxEnergy'|'flyingSwords'|'discard'|'recover'|'scry'|'search'|'exhaust'|'refine'|'summon'|'command'|'sacrifice'|'mountainBreak'|'detonate'|'spread'|'teamBuff'|'overwhelm'|'power'|'consumeSword'|'directLoss'|'costReduce'|'nextWindDiscount'|'energyLoss'|'addStatusCard'|'cloudCommand'|'reorder';
export type Status = 'strength'|'fortify'|'weak'|'vulnerable'|'poison'|'pierce'|'protectiveQi'|'swordIntent'|'tidalMomentum'|'windMomentum'|'bleeding'|'flame'|'seed'|'regen'|'dodge'|'reduction'|'basicPower'|'basicCost'|'link'|'restriction'|'energyDebt';
export interface Effect { op: EffectOp; amount?: number; upgrade?: number; realmScale?: number; scale?: number; statusScale?: Status; perRetained?: number; condition?: 'twoSummons'|'threeSummons'|'retained'|'hasFlame'|'hasSeed'; threshold?: number; pursuit?: {condition: PursuitCondition; amount: number}; damageFlags?: {attack?: boolean; ignoreArmor?: boolean; armorFraction?: number; noIntercept?: boolean}; hits?: number; target?: 'enemy'|'allEnemies'|'self'|'allSummons'; status?: Status; id?: string; from?: 'hand'|'discard'|'exhaust'|'draw'; to?: 'draw'|'hand'|'discard'; attackOnly?: boolean; count?: number; retainBonus?: number; lifesteal?: boolean; }
export type CardTarget = 'self'|'enemy'|'allEnemies'|'randomEnemy'|'none';
export interface CardDef { id: string; name: Text; target: CardTarget; path: Path|'basic'; category: Category; kind: 'attack'|'skill'|'power'; cost: number; rarity: 'common'|'uncommon'|'rare'; archetype: string; starting?: boolean; retain?: boolean; retainCost?: {turns: number; reduction: number}; innate?: boolean; exhaust?: boolean; effects: Effect[]; onDiscard?: Effect[]; onDraw?: Effect[]; onTurnEnd?: Effect[]; autoExhaust?: 'onDraw'|'onTurnEnd'; unplayable?: boolean; flavor: Text; art?: number; }
export interface CardInstance { uid: string; defId: string; grade: Grade; tempGrade?: Grade; retained: number; costDelta?: number; }
export interface Unit { id: string; name: Text; hp: number; maxHp: number; armor: number; statuses: Partial<Record<Status, number>>; }
export interface EnemyIntent { name: Text; kind: 'attack'|'defend'|'debuff'|'summon'|'special'; effects: Effect[]; }
export interface EnemyDef { id: string; name: Text; description: Text; hp: number; art: number; intents: EnemyIntent[]; boss?: boolean; elite?: boolean; affinity?: Path[]; omen?: Text; mechanic?: 'cloud'|'link'|'restriction'|'thunder'|'mirror'; }
export interface Enemy extends Unit { defId: string; intentIndex: number; intent: EnemyIntent; art: number; }
export interface Summon extends Unit { defId: string; attack: number; automatic: 'turnEnd'|'counter'|'armorBreak'; triggeredTurn?: number; }
export interface SummonDef { id: string; name: Text; hp: number; attack: number; automatic: Summon['automatic']; art: number; }
export interface CombatEvent { code: string; values?: Record<string, string|number>; }
export interface CombatChoice { kind: 'discard'|'recover'|'exhaust'|'refine'|'scry'|'search'|'tidal'|'reorder'; ids: string[]; count: number; source?: string; thenDraw?: number; min?: number; }
export type TidalState = 'rising'|'tranquil'|'raging';
export interface Combat { version: number; rulesMigration?: {fromVersion:2;mode:'snapshot-continuation'}; seed: number; rng: number; realm: number; turn: number; phase: 'player'|'won'|'lost'; player: Unit; enemies: Enemy[]; summons: Summon[]; draw: CardInstance[]; hand: CardInstance[]; discard: CardInstance[]; exhaust: CardInstance[]; energy: number; maxEnergy: number; powers: Record<string, number>; tidal: TidalState|null; choice: CombatChoice|null; events: CombatEvent[]; actions: unknown[]; playHistory: CommittedPlay[]; nextWindDiscount: number; serial: number; pending?: ResolutionTask[]; preview?: boolean; uncertain?: boolean; tidalChosenTurn?: number; resolvingCard?: CardInstance; }
export interface CombatConfig { seed: number; realm: number; hp: number; maxHp: number; deck: CardInstance[]; enemies: string[]; }

export type PursuitCondition = 'priorWind'|'thirdPlay'|'previousAttack';
export interface CommittedPlay { turn: number; uid: string; defId: string; path: CardDef['path']; kind: CardDef['kind']; actualCost: number; ordinal: number; }
export interface ResolutionContext { ownerId: string; targetId?: string; card?: CardInstance; kind?: CardDef['kind']; path?: CardDef['path']; activeCard?: boolean; pursuit?: Record<PursuitCondition, boolean>; }
export type ResolutionTask = { type: 'effect'; effect: Effect; context: ResolutionContext } | { type: 'finishCard'; card: CardInstance; targetId?: string } | { type: 'boundary' } | { type: 'endPlayer' } | { type: 'enemy'; enemyId: string } | { type: 'endEnemy'; enemyId: string } | { type: 'startPlayer' } | { type: 'cloudFollowups'; enemyId: string };
