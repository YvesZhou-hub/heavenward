// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { CARDS, ENEMIES, REALMS, SUMMONS } from './content';
import { RULES } from './rules';
import { STATUS_NAMES } from './i18n';
import { migrateCombatRulesV2 } from './combat';
import { CONTENT_VERSION, RULES_VERSION, emptyMeta, roadLength, type Meta, type Run } from './run';
import type { CardInstance, Combat, Effect, Locale, Unit } from './types';
export const SAVE_KEY='heavenward.save.v2';
export const LEGACY_SAVE_KEY='heavenward.save.v1';
export const LEGACY_CONTINUE_URL='/legacy/v1/index.html';
export interface Settings {locale:Locale;music:number;sfx:number;speed:number;reducedMotion:boolean;tutorial:boolean;cardback:string;gradeDisplay:'numeric'|'letters'|'traditional';}
export interface SaveData {version:2;revision:number;run:Run|null;meta:Meta;settings:Settings;}
export const defaultSettings=():Settings=>({locale:'en',music:.22,sfx:.5,speed:1,reducedMotion:false,tutorial:true,cardback:'default',gradeDisplay:'numeric'});
export const freshSave=():SaveData=>({version:2,revision:0,run:null,meta:emptyMeta(),settings:defaultSettings()});
export interface StorageLike {getItem(key:string):string|null;setItem(key:string,value:string):void;}
export function checksum(text:string){let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);return (hash>>>0).toString(16);}
const integer = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const textValid = (value: unknown) => object(value) && string(value.en) && string(value['zh-CN']) && string(value.vi);
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(string);
const unique = (values: string[]) => new Set(values).size === values.length;
const statsValid = (value: unknown) => object(value) && ['combats', 'elites', 'tribulations', 'cards', 'gold'].every(key => integer(value[key]));
function cardValid(value: unknown, permanent = false): value is CardInstance {
 if (!object(value)) return false;
 const card = value as unknown as CardInstance, def = CARDS[card.defId];
 return string(card.uid) && Object.hasOwn(CARDS,card.defId) && integer(card.grade, 0, 7) && integer(card.retained) &&
   (card.tempGrade === undefined || integer(card.tempGrade, 0, 7)) &&
   (card.costDelta === undefined || integer(card.costDelta, -1000000, 1000000)) &&
   (!['divine', 'token', 'status'].includes(def.category) || card.grade === 0 && card.tempGrade === undefined) &&
   (def.category !== 'status' || card.retained === 0) &&
   (!permanent || !['token','status'].includes(def.category) && card.tempGrade === undefined && card.costDelta === undefined && card.retained === 0);
}
function cardsValid(value: unknown, permanent = false): value is CardInstance[] { return Array.isArray(value) && value.every(card => cardValid(card, permanent)); }
function unitValid(value: unknown): value is Unit {
 if (!object(value)) return false;
 const unit = value as unknown as Unit;
 return string(unit.id) && textValid(unit.name) && integer(unit.maxHp, 1) && integer(unit.hp, 0, unit.maxHp) && integer(unit.armor) &&
  object(unit.statuses) && Object.entries(unit.statuses).every(([key, amount]) => Object.hasOwn(STATUS_NAMES,key) && integer(amount) && (!Object.hasOwn(RULES.statusCaps,key) || amount <= RULES.statusCaps[key as keyof typeof RULES.statusCaps]));
}
const effectOps = new Set(['damage','armor','heal','status','draw','energy','maxEnergy','flyingSwords','discard','recover','scry','search','exhaust','refine','summon','command','sacrifice','mountainBreak','detonate','spread','teamBuff','overwhelm','power','consumeSword','directLoss','costReduce','nextWindDiscount','energyLoss','addStatusCard','cloudCommand','reorder']);
function effectValid(value: unknown): value is Effect {
 if (!object(value) || !effectOps.has(value.op as string)) return false;
 const effect = value as unknown as Effect;
 return ['amount','upgrade','scale','perRetained','threshold','hits','count','realmScale'].every(key => value[key] === undefined || typeof value[key] === 'number' && Number.isFinite(value[key]) && Number(value[key]) >= 0) &&
  (effect.to === undefined || ['draw','hand','discard'].includes(effect.to)) &&
  (effect.pursuit === undefined || object(effect.pursuit) && ['priorWind','thirdPlay','previousAttack'].includes(effect.pursuit.condition) && typeof effect.pursuit.amount==='number' && Number.isFinite(effect.pursuit.amount) && effect.pursuit.amount>=0) &&
  (effect.damageFlags === undefined || object(effect.damageFlags) && ['attack','ignoreArmor','noIntercept'].every(key=>effect.damageFlags![key as 'attack']===undefined || typeof effect.damageFlags![key as 'attack']==='boolean') && (effect.damageFlags.armorFraction===undefined || typeof effect.damageFlags.armorFraction==='number' && Number.isFinite(effect.damageFlags.armorFraction) && effect.damageFlags.armorFraction>=0 && effect.damageFlags.armorFraction<=1)) &&
  (effect.op !== 'addStatusCard' || Object.hasOwn(CARDS,effect.id??'') && CARDS[effect.id!].category==='status') &&
  (effect.status === undefined || Object.hasOwn(STATUS_NAMES,effect.status)) && (effect.statusScale === undefined || Object.hasOwn(STATUS_NAMES,effect.statusScale)) &&
  (effect.op !== 'status' || !!effect.status) && (effect.op !== 'summon' || Object.hasOwn(SUMMONS,effect.id??'') || Object.hasOwn(ENEMIES,effect.id??''));
}
function intentValid(value: unknown) {
 return object(value) && textValid(value.name) && ['attack','defend','debuff','summon','special'].includes(value.kind as string) && Array.isArray(value.effects) && value.effects.every(effectValid);
}
function combatValid(c: Combat, deck: CardInstance[], requireCompleteDeck = true): boolean {
 if (!object(c) || c.version !== RULES.version || !integer(c.realm, 0, 4) || !integer(c.seed, 0, 4294967295) || !integer(c.rng, 0, 4294967295) || !integer(c.turn, 1) || !integer(c.serial, 1) || !['player','won','lost'].includes(c.phase)) return false;
 if(c.rulesMigration!==undefined&&(!object(c.rulesMigration)||c.rulesMigration.fromVersion!==2||c.rulesMigration.mode!=='snapshot-continuation'))return false;
 if (!unitValid(c.player) || c.player.id !== 'player' || !integer(c.energy) || !integer(c.maxEnergy, 1) || !object(c.powers) || !Object.values(c.powers).every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0)) return false;
 if (!Array.isArray(c.enemies) || !c.enemies.length || !c.enemies.every(enemy => unitValid(enemy) && Object.hasOwn(ENEMIES,enemy.defId) && integer(enemy.intentIndex) && intentValid(enemy.intent) && integer(enemy.art))) return false;
 if (!Array.isArray(c.summons) || c.summons.length > 3 || !c.summons.every(summon => unitValid(summon) && Object.hasOwn(SUMMONS,summon.defId) && integer(summon.attack) && ['turnEnd','counter','armorBreak'].includes(summon.automatic))) return false;
 if (!unique([c.player.id, ...c.enemies.map(e => e.id), ...c.summons.map(s => s.id)])) return false;
 const zones = [c.hand, c.draw, c.discard, c.exhaust];
 if (!zones.every(zone => cardsValid(zone)) || c.hand.length > 10 || c.resolvingCard !== undefined && !cardValid(c.resolvingCard)) return false;
 const cards = [...zones.flat(), ...(c.resolvingCard ? [c.resolvingCard] : [])];
 if (!unique(cards.map(card => card.uid))) return false;
 // Each permanent instance must still have one owner while a choice is open.
 // The resolving card is a separate owner until its effects have completed.
 const permanent = cards.filter(card => !['token','status'].includes(CARDS[card.defId].category));
 if (requireCompleteDeck && permanent.length !== deck.length || !permanent.every(card => deck.some(source => source.uid === card.uid && source.defId === card.defId && source.grade === card.grade))) return false;
 if (!Array.isArray(c.actions) || !c.actions.every(action => {
  if(!object(action)||!integer(action.turn,1,c.turn))return false;
  if(action.type==='playCard')return string(action.uid)&&(action.targetId===undefined||string(action.targetId));
  if(action.type==='endTurn')return action.tidal===undefined||['rising','tranquil','raging'].includes(String(action.tidal));
  return action.type==='resolveChoice'&&strings(action.ids)&&unique(action.ids);
 })) return false;
 if (!integer(c.nextWindDiscount) || !Array.isArray(c.playHistory)) return false;
 const committed=c.actions.filter(action=>object(action)&&action.type==='playCard');
 if(c.playHistory.length!==committed.length)return false;
 const ordinalByTurn=new Map<number,number>();let lastTurn=0;
 for(const [i,play] of c.playHistory.entries()){
  if(!object(play)||!integer(play.turn,1,c.turn)||play.turn<lastTurn||!string(play.uid)||!string(play.defId)||!Object.hasOwn(CARDS,play.defId)||!integer(play.actualCost)||!integer(play.ordinal,1))return false;
  const def=CARDS[play.defId],action=committed[i] as Record<string,unknown>;
  if(def.unplayable||def.path!==play.path||def.kind!==play.kind||action.uid!==play.uid||action.turn!==play.turn||play.ordinal!==(ordinalByTurn.get(play.turn)??0)+1)return false;
  ordinalByTurn.set(play.turn,play.ordinal);lastTurn=play.turn;
 }
 if (!Array.isArray(c.events) || !c.events.every(event => object(event) && string(event.code) && (event.values === undefined || object(event.values) && Object.values(event.values).every(value => typeof value === 'string' || typeof value === 'number' && Number.isFinite(value))))) return false;
 if (c.tidal !== null && !['rising','tranquil','raging'].includes(c.tidal)) return false;
 if (c.choice !== null) {
  const choice = c.choice;
  if (!object(choice) || !['discard','recover','exhaust','refine','scry','search','tidal','reorder'].includes(choice.kind) || !strings(choice.ids) || !unique(choice.ids) || !integer(choice.count) || choice.min !== undefined && !integer(choice.min, 0, choice.count)) return false;
  if(choice.kind==='reorder'&&(choice.count!==choice.ids.length||choice.min!==choice.count))return false;
  const available = choice.kind === 'tidal' ? ['rising','tranquil','raging'] : cards.map(card => card.uid);
  if (!choice.ids.every(id => available.includes(id))) return false;
 }
 if (c.pending !== undefined && (!Array.isArray(c.pending) || !c.pending.every(task => {
  if (!object(task)) return false;
  if (task.type === 'effect') return effectValid(task.effect) && object(task.context) && string(task.context.ownerId) && (task.context.card === undefined || cardValid(task.context.card)) && (task.context.pursuit===undefined || object(task.context.pursuit) && ['priorWind','thirdPlay','previousAttack'].every(key=>typeof task.context.pursuit![key as 'priorWind']==='boolean')); 
  if (task.type === 'finishCard') return cardValid(task.card);
  if (task.type === 'enemy' || task.type === 'endEnemy' || task.type === 'cloudFollowups') return string(task.enemyId) && c.enemies.some(enemy => enemy.id === task.enemyId);
  return ['boundary','endPlayer','startPlayer'].includes(task.type);
 }))) return false;
 if (c.phase === 'lost') return c.player.hp === 0;
 return c.player.hp > 0 && (c.phase === 'won' ? c.enemies.every(enemy => enemy.hp === 0) : c.enemies.some(enemy => enemy.hp > 0));
}
function nodeValid(value: unknown, current = false) {
 if (!object(value) || !string(value.id) || !['combat','elite','event','merchant','rest','inheritance','tribulation'].includes(value.kind as string)) return false;
 return (value.hint === undefined || textValid(value.hint)) && (value.encounter === undefined || strings(value.encounter) && value.encounter.length > 0 && value.encounter.every(id => Object.hasOwn(ENEMIES,id))) &&
  (value.eventId === undefined || integer(value.eventId, 0, 3) || current && value.eventId === 99);
}
function progressionValid(value:unknown):boolean{
 if(!object(value)||!string(value.id)||!['minor','major'].includes(String(value.kind))||typeof value.acknowledged!=='boolean'||!['notice','receipt','choices','complete'].includes(String(value.view)))return false;
 const point=(p:unknown):p is {realm:number;stage:number}=>object(p)&&integer(p.realm,0,4)&&integer(p.stage,0,3);
 const state=(s:unknown)=>object(s)&&integer(s.hp)&&integer(s.maxHp,1)&&s.hp<=s.maxHp&&integer(s.energy,1)&&integer(s.normalGrade,0,7)&&integer(s.removalFloor,12,20);
 if(!point(value.from)||value.to!==null&&!point(value.to)||!state(value.before)||!state(value.after)||!object(value.grants)||!['maxHp','healing','gold','energy','normalGrade'].every(key=>integer((value.grants as Record<string,unknown>)[key])))return false;
 const before=value.before as Record<string,number>,after=value.after as Record<string,number>,grants=value.grants as Record<string,number>;
 if(grants.maxHp!==after.maxHp-before.maxHp||grants.healing!==after.hp-before.hp||grants.energy!==after.energy-before.energy||grants.normalGrade!==after.normalGrade-before.normalGrade)return false;
 if(value.pendingChoices!==null&&(!object(value.pendingChoices)||!['divine','foundation'].includes(String(value.pendingChoices.kind))||!integer(value.pendingChoices.count,0,5)||value.pendingChoices.maxAcquisitions!==1||!integer(value.pendingChoices.roundsRemaining,1)||value.pendingChoices.optional!==true))return false;
 if(value.kind==='minor')return value.view==='notice'&&value.to!==null&&(value.to as {realm:number}).realm===value.from.realm&&(value.to as {stage:number}).stage>value.from.stage&&Object.values(grants).every(n=>n===0)&&value.pendingChoices===null;
 return value.view!=='notice'&&(value.to===null?value.from.realm===4:(value.to as {realm:number;stage:number}).realm===value.from.realm+1&&(value.to as {stage:number}).stage===0);
}
export function validateSave(data: unknown): data is SaveData {
 // This boundary must return false for arbitrary JSON, never throw while trying
 // to inspect an absent nested field. decodeSave is not its only caller.
 try {
  if (!object(data)) return false; const d = data as unknown as SaveData;
  if (d.version !== 2 || !integer(d.revision) || !object(d.settings) || !['en','zh-CN','vi'].includes(d.settings.locale) || !object(d.meta)) return false;
  if (![d.settings.music,d.settings.sfx].every(v => Number.isFinite(v) && v >= 0 && v <= 1) || ![.5,1,1.5,2].includes(d.settings.speed) || ![d.settings.reducedMotion,d.settings.tutorial].every(v => typeof v === 'boolean') || !string(d.settings.cardback) || !['numeric','letters','traditional'].includes(d.settings.gradeDisplay)) return false;
  if (!Array.isArray(d.meta.history) || !strings(d.meta.discovered) || !d.meta.discovered.every(id => Object.hasOwn(CARDS,id) && !['token','status'].includes(CARDS[id].category)) || !unique(d.meta.discovered) || !strings(d.meta.unlocks)) return false;
  if (!d.meta.history.every(h => object(h) && string(h.id) && integer(h.seed, -4294967295, 4294967295) && integer(h.realm, 0, 4) && ['dead','ascended'].includes(h.outcome) && integer(h.duration) && ['active','legacy-wall'].includes(h.durationKind) && statsValid(h.stats) && strings(h.paths) && textValid(h.cause)) || !unique(d.meta.history.map(h => h.id))) return false;
  const r = d.run; if (r === null) return true; if (!object(r)) return false;
  if (!string(r.id) || !integer(r.seed, -4294967295, 4294967295) || !integer(r.rng, 0, 4294967295) || !integer(r.revision) || !integer(r.startedAt) || r.endedAt !== undefined && !integer(r.endedAt, r.startedAt) || !integer(r.serial) || !integer(r.activeMs)) return false;
  if (r.rulesVersion !== RULES_VERSION || r.contentVersion !== CONTENT_VERSION || !integer(r.realm, 0, 4) || !integer(r.depth, 0, roadLength(r.realm)-1) || !integer(r.maxHp, 1) || !integer(r.hp, 0, r.maxHp) || !integer(r.gold)) return false;
  if (!['starting','road','combat','reward','merchant','rest','event','inheritance','breakthrough','dead','ascended'].includes(r.phase) || !cardsValid(r.deck, true) || !unique(r.deck.map(c => c.uid)) || r.deck.filter(c => CARDS[c.defId].category === 'divine').length > 4) return false;
  // Realm minimums restrict removals, never mandatory acquisition after advancement.
  if (r.phase === 'starting'||r.phase==='dead'&&r.startingRound<2 ? r.deck.length !== 10 + r.startingRound || r.startingRound > 1 : r.startingRound!==2||r.deck.length < REALMS[0].minDeck) return false;
  if(!Array.isArray(r.progressionReceipts)||!r.progressionReceipts.every(progressionValid)||!unique(r.progressionReceipts.map(receipt=>receipt.id)))return false;
  if(r.compatibility!==undefined&&(!object(r.compatibility)||r.compatibility.fromRulesVersion!=='human-0.2.0'||r.compatibility.fromContentVersion!=='human-0.2.0'||r.compatibility.mode!=='snapshot-continuation'||typeof r.compatibility.noticeAcknowledged!=='boolean'))return false;
  if (!integer(r.startingRound, 0, 2) || !integer(r.draftRemaining) || !['normal','divine','foundation'].includes(r.rewardKind) || !cardsValid(r.offers, true) || !unique(r.offers.map(c => c.uid))) return false;
  if (!Array.isArray(r.nodes) || !r.nodes.every(node => nodeValid(node)) || !unique(r.nodes.map(n => n.id)) || r.current !== null && !nodeValid(r.current, true) || !Array.isArray(r.visited) || !r.visited.every(kind => ['combat','elite','event','merchant','rest','inheritance','tribulation'].includes(kind))) return false;
  if (!Array.isArray(r.routeHistory) || r.routeHistory.length !== r.visited.length || !r.routeHistory.every((v,i)=>object(v)&&integer(v.realm,0,4)&&integer(v.depth,0,roadLength(v.realm)-1)&&nodeValid(v.node,true)&&v.node.kind===r.visited[i])) return false;
  if (!Array.isArray(r.journal) || !r.journal.every(entry => object(entry) && string(entry.code) && (entry.value === undefined || typeof entry.value === 'string' || typeof entry.value === 'number' && Number.isFinite(entry.value))) || !object(r.shop) || !integer(r.shop.sold, 0, 3) || !integer(r.shop.upgraded, 0, 2) || !strings(r.shop.purchased) || !statsValid(r.stats)) return false;
  if (r.startingRound === 2 && !ENEMIES[r.bossId]?.boss || r.phase === 'combat' && (!r.combat || r.combat.realm !== r.realm || r.hp !== r.combat.player.hp)) return false;
  if (r.combat && !combatValid(r.combat, r.deck, r.phase !== 'breakthrough'&&!(r.phase==='dead'&&r.combat.phase==='won'))) return false;
  // Breakthrough drafts can add cards after the preserved winning snapshot.
  return r.phase !== 'ascended' || r.realm === 4 && r.depth === roadLength(4)-1;
 } catch { return false; }
}
export function encodeSave(data:SaveData){const payload=JSON.stringify(data);return JSON.stringify({checksum:checksum(payload),payload});}
/** Earlier local schema2 had no notice receipts. Preserve all gameplay/offer identities; invent no past grants. */
export function migrateLocalV2Save(value:unknown):SaveData|null{
 try{
  if(!object(value)||value.version!==2)return null;
  const migrated=structuredClone(value);
  if(object(migrated.run)&&migrated.run.rulesVersion==='human-0.2.0'&&migrated.run.contentVersion==='human-0.2.0'){
   const run=migrated.run;run.rulesVersion=RULES_VERSION;run.contentVersion=CONTENT_VERSION;
   if(run.progressionReceipts===undefined)run.progressionReceipts=[];
   if(run.combat!==null){if(!object(run.combat)||run.combat.version!==2)return null;run.combat=migrateCombatRulesV2(run.combat as unknown as Combat);}
   run.compatibility={fromRulesVersion:'human-0.2.0',fromContentVersion:'human-0.2.0',mode:'snapshot-continuation',noticeAcknowledged:false};
  }
  return validateSave(migrated)?migrated:null;
 }catch{return null;}
}
export function decodeSave(raw:string):SaveData|null {try{const e=JSON.parse(raw);if(typeof e.payload!=='string'||checksum(e.payload)!==e.checksum)return null;return migrateLocalV2Save(JSON.parse(e.payload));}catch{return null;}}
export function loadSave(storage:StorageLike):{data:SaveData|null;error:'corrupt'|'unavailable'|'compatibility'|null;recovered:boolean}{
 let primary:string|null, mirror:string|null, rawHead:string|null, rawTerminal:string|null;
 try { primary=storage.getItem(SAVE_KEY);mirror=storage.getItem(`${SAVE_KEY}.mirror`);rawHead=storage.getItem(`${SAVE_KEY}.head`);rawTerminal=storage.getItem(`${SAVE_KEY}.terminal`); }
 catch { return {data:null,error:'unavailable',recovered:false}; }
 const head=rawHead===null?0:Number(rawHead);
 if(!integer(head)||rawHead!==null&&!/^\d+$/.test(rawHead))return{data:null,error:'corrupt',recovered:false};
 let tombstones:Record<string,unknown>;
 try { const parsed:unknown=JSON.parse(rawTerminal??'{}');if(!object(parsed)||!Object.values(parsed).every(value=>value==='dead'||value==='ascended'))return{data:null,error:'corrupt',recovered:false};tombstones=parsed; }
 catch { return{data:null,error:'corrupt',recovered:false}; }
 if(!primary&&!mirror){
  if(head!==0)return{data:null,error:'corrupt',recovered:false};
  try {if(['','.mirror','.head','.terminal'].some(suffix=>storage.getItem(`${LEGACY_SAVE_KEY}${suffix}`)!==null))return{data:null,error:'compatibility',recovered:false};}
  catch{return{data:null,error:'unavailable',recovered:false};}
  return{data:freshSave(),error:null,recovered:false};
 }
 const a=primary?decodeSave(primary):null,b=mirror?decodeSave(mirror):null;
 const data=[a,b].filter((x):x is SaveData=>!!x).sort((a,b)=>b.revision-a.revision)[0];
 if(!data||data.revision<head)return{data:null,error:'corrupt',recovered:false};
 if(data.run&&tombstones[data.run.id]&&!['dead','ascended'].includes(data.run.phase))return{data:null,error:'corrupt',recovered:false};
 return{data,error:null,recovered:!a||data.revision!==a.revision};
}
export class SaveConflict extends Error{constructor(){super('save-conflict');}}
/** Keep exact pre-migration envelopes before the first revised commit; quota failure leaves them untouched. */
function archivePreMigrationV2(storage:StorageLike){
 const snapshots=Object.fromEntries(['','.mirror','.head','.terminal'].map(suffix=>[`${SAVE_KEY}${suffix}`,storage.getItem(`${SAVE_KEY}${suffix}`)]));
 const old=[snapshots[SAVE_KEY],snapshots[`${SAVE_KEY}.mirror`]].some(raw=>{try{if(!raw)return false;const envelope=JSON.parse(raw);if(typeof envelope.payload!=='string'||checksum(envelope.payload)!==envelope.checksum)return false;const data=JSON.parse(envelope.payload);return data.version===2&&object(data.run)&&data.run.rulesVersion==='human-0.2.0'&&data.run.contentVersion==='human-0.2.0';}catch{return false;}});
 if(!old)return;
 const raw=JSON.stringify({format:'heavenward-local-v2-archive',version:2,snapshots}),base=`heavenward.archive.v2.${checksum(raw)}`;let key=base,index=0;
 while(storage.getItem(key)!==null&&storage.getItem(key)!==raw)key=`${base}.${++index}`;
 storage.setItem(key,raw);if(storage.getItem(key)!==raw)throw new Error('v2-archive-verification');
}
function persistSnapshot(storage:StorageLike,next:SaveData):SaveData{
 if(!validateSave(next))throw new Error('save-invalid');const encoded=encodeSave(next);
 archivePreMigrationV2(storage);
 if(next.run&&['dead','ascended'].includes(next.run.phase)){const terminal=JSON.parse(storage.getItem(`${SAVE_KEY}.terminal`)??'{}');terminal[next.run.id]=next.run.phase;storage.setItem(`${SAVE_KEY}.terminal`,JSON.stringify(terminal));}
 storage.setItem(SAVE_KEY,encoded);storage.setItem(`${SAVE_KEY}.head`,String(next.revision));storage.setItem(`${SAVE_KEY}.mirror`,encoded);return next;
}
export function writeSave(storage:StorageLike,data:SaveData,expectedRevision:number):SaveData{
 const loaded=loadSave(storage);if(loaded.error)throw new Error(`save-${loaded.error}`);if(loaded.data?.revision!==expectedRevision)throw new SaveConflict();
 return persistSnapshot(storage,{...structuredClone(data),version:2,revision:expectedRevision+1});
}
export interface LegacyArchive {format:'heavenward-legacy-archive';version:1;continueUrl:string;snapshots:Record<string,string|null>;}
/** Read-only export preserves envelopes, mirrors, revision head and terminal markers byte for byte. */
export function exportLegacySave(storage:StorageLike):LegacyArchive{
 const snapshots:Record<string,string|null>={};
 for(const suffix of ['', '.mirror','.head','.terminal'])snapshots[`${LEGACY_SAVE_KEY}${suffix}`]=storage.getItem(`${LEGACY_SAVE_KEY}${suffix}`);
 return{format:'heavenward-legacy-archive',version:1,continueUrl:LEGACY_CONTINUE_URL,snapshots};
}
function legacyMetadata(archive:LegacyArchive):Pick<SaveData,'meta'|'settings'> {
 const candidates:Record<string,unknown>[]=[];
 for(const suffix of ['','.mirror']){
  try{const raw=archive.snapshots[`${LEGACY_SAVE_KEY}${suffix}`];if(!raw)continue;
   const envelope:unknown=JSON.parse(raw);if(!object(envelope)||typeof envelope.payload!=='string'||checksum(envelope.payload)!==envelope.checksum)continue;
   const data:unknown=JSON.parse(envelope.payload);if(object(data)&&data.version===1&&integer(data.revision))candidates.push(data);
  }catch{ /* Preserve malformed originals; never feed them to the revised resolver. */ }
 }
 candidates.sort((a,b)=>Number(b.revision)-Number(a.revision));const original=candidates[0];
 const rawHead=archive.snapshots[`${LEGACY_SAVE_KEY}.head`],head=rawHead===null?0:Number(rawHead);
 if(!integer(head)||rawHead!==null&&!/^\d+$/.test(rawHead)||original&&Number(original.revision)<head)throw new Error('legacy-revision-incomplete');
 if(!original||!object(original.meta)||!object(original.settings))throw new Error('legacy-metadata-unreadable');
 const meta=structuredClone(original.meta),settings={...defaultSettings(),...original.settings,gradeDisplay:'numeric'};
 if(original.settings.locale==='zh')settings.locale='zh-CN';
 if(Array.isArray(meta.history))for(const history of meta.history){if(object(history)){history.durationKind='legacy-wall';}if(object(history)&&object(history.cause)){const cause=history.cause;if(!cause['zh-CN']&&typeof cause.zh==='string')cause['zh-CN']=cause.zh;if(!cause.vi&&typeof cause.en==='string')cause.vi=cause.en;}}
 const candidate={...freshSave(),meta,settings};
 if(!validateSave(candidate))throw new Error('legacy-metadata-incompatible');
 return{meta:candidate.meta,settings:candidate.settings};
}
/** Explicit user choice only. Original v1 keys are never removed, rewritten, or reinterpreted. */
export function archiveLegacyAndStartFresh(storage:StorageLike,choice:'start-new-revision'):SaveData{
 if(choice!=='start-new-revision'||loadSave(storage).error!=='compatibility')throw new Error('legacy-choice-unavailable');
 const archive=exportLegacySave(storage),raw=JSON.stringify(archive),baseKey=`heavenward.archive.v1.${checksum(raw)}`;
 let archiveKey=baseKey,suffix=0;
 while(storage.getItem(archiveKey)!==null&&storage.getItem(archiveKey)!==raw)archiveKey=`${baseKey}.${++suffix}`;
 storage.setItem(archiveKey,raw);if(storage.getItem(archiveKey)!==raw)throw new Error('legacy-archive-failed');
 const preserved=legacyMetadata(archive);
 // No active run is converted. The complete old owned deck remains in both original and archived saves.
 return persistSnapshot(storage,{...freshSave(),...preserved,revision:1});
}
export async function saveWithLock(data:SaveData,expectedRevision:number):Promise<SaveData>{
 if(typeof navigator!=='undefined'&&navigator.locks){
  // Firefox reports callback exceptions even when the request rejection is
  // caught. Carry storage failures across the native lock boundary as data,
  // then reject here so the caller can show its normal recovery interface.
  const result=await navigator.locks.request(SAVE_KEY,()=>{
   try{return{ok:true as const,data:writeSave(localStorage,data,expectedRevision)};}
   catch(error){return{ok:false as const,error};}
  });
  if(!result.ok)throw result.error;
  return result.data;
 }
 return writeSave(localStorage,data,expectedRevision);
}
// Cloud providers implement this contract separately; local play never reports a cloud sync.
export interface CloudSaveAdapter {read():Promise<SaveData|null>;write(data:SaveData,expectedRevision:number):Promise<void>;}
