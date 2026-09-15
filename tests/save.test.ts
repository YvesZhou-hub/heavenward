// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, it, vi } from 'vitest';
import { CARDS, STATUS_CARD_IDS } from '../src/game/content';
import { createCombat, endTurn, playCard, playableReason, resolveChoice } from '../src/game/combat';
import { chooseStarting, commitCombat, enterNode, newRun, retire, updateMeta, instance, continueBreakthrough, takeReward, getPendingProgression, roadLength } from '../src/game/run';
import { SAVE_KEY, LEGACY_SAVE_KEY, exportLegacySave, archiveLegacyAndStartFresh, SaveConflict, checksum, decodeSave, defaultSettings, encodeSave, freshSave, loadSave, saveWithLock, validateSave, writeSave, type SaveData, type StorageLike } from '../src/game/save';

class MemoryStorage implements StorageLike {
 values = new Map<string,string>();
 getItem(key: string) { return this.values.get(key) ?? null; }
 setItem(key: string, value: string) { this.values.set(key, value); }
}
function activeSave(seed = 79): SaveData {
 const data = freshSave(); let r = newRun(seed, 1000);
 r = chooseStarting(r, r.offers[0].uid); r = chooseStarting(r, r.offers[0].uid);
 r = enterNode(r, r.nodes.find(n => n.kind === 'combat')!.id); data.run = r; return data;
}
afterEach(() => vi.unstubAllGlobals());

describe('versioned local save and recovery', () => {
 it('migrates older local v2 notices without losing combat, owned IDs, offers or source envelopes',()=>{
  const data=activeSave(),old=structuredClone(data) as unknown as {run:Record<string,unknown>};delete old.run.progressionReceipts;old.run.rulesVersion='human-0.2.0';old.run.contentVersion='human-0.2.0';(old.run.combat as Record<string,unknown>).version=2;
  const payload=JSON.stringify(old),raw=JSON.stringify({payload,checksum:checksum(payload)}),storage=new MemoryStorage();storage.setItem(SAVE_KEY,raw);storage.setItem(`${SAVE_KEY}.mirror`,raw);storage.setItem(`${SAVE_KEY}.head`,'0');
  const expected=structuredClone(data);expected.run!.compatibility={fromRulesVersion:'human-0.2.0',fromContentVersion:'human-0.2.0',mode:'snapshot-continuation',noticeAcknowledged:false};expected.run!.combat!.rulesMigration={fromVersion:2,mode:'snapshot-continuation'};
  const loaded=loadSave(storage);expect(loaded.error).toBeNull();expect(loaded.data).toEqual(expected);expect(storage.getItem(SAVE_KEY)).toBe(raw);
  const next=writeSave(storage,loaded.data!,0);expect(next.run).toEqual(expected.run);
  const archiveKey=[...storage.values.keys()].find(key=>key.startsWith('heavenward.archive.v2.'))!;expect(archiveKey).toBeTruthy();expect(JSON.parse(storage.getItem(archiveKey)!).snapshots[SAVE_KEY]).toBe(raw);
 });
 it('retains older local v2 data if its migration archive cannot be written',()=>{
  const data=activeSave() as unknown as {run:Record<string,unknown>};delete data.run.progressionReceipts;data.run.rulesVersion='human-0.2.0';data.run.contentVersion='human-0.2.0';(data.run.combat as Record<string,unknown>).version=2;const payload=JSON.stringify(data),raw=JSON.stringify({payload,checksum:checksum(payload)}),storage=new MemoryStorage();storage.setItem(SAVE_KEY,raw);
  const write=storage.setItem.bind(storage);storage.setItem=(key,value)=>{if(key.startsWith('heavenward.archive.v2.'))throw new Error('quota');write(key,value);};
  const loaded=loadSave(storage).data!;expect(()=>writeSave(storage,loaded,0)).toThrow('quota');expect(storage.getItem(SAVE_KEY)).toBe(raw);
 });
 it('migrates a controlled old Scarlet queue without changing resolved HP, ownership, RNG or independent healing',()=>{
  const old=activeSave(),r=old.run!,c=r.combat!;r.rulesVersion='human-0.2.0';r.contentVersion='human-0.2.0';c.version=2;r.hp=c.player.hp=40;
  const card=r.deck[0];card.defId='scarlet-requiem';for(const owned of [...c.hand,...c.draw,...c.discard,...c.exhaust])if(owned.uid===card.uid)owned.defId=card.defId;
  const context={ownerId:'player',card:structuredClone(card),targetId:c.enemies[0].id};
  c.pending=[{type:'effect',effect:{op:'status',status:'bleeding',amount:7,target:'enemy'},context},{type:'effect',effect:{op:'damage',amount:12,upgrade:5,lifesteal:true,target:'enemy'},context},{type:'effect',effect:{op:'heal',amount:9,target:'self'},context},{type:'effect',effect:{op:'heal',amount:3,target:'self'},context:{ownerId:'player'}}];
  delete (r as unknown as Record<string,unknown>).progressionReceipts;const original=structuredClone(old),decoded=decodeSave(encodeSave(old))!;
  expect(decoded).not.toBeNull();expect(old).toEqual(original);const migrated=decoded.run!.combat!;
  expect(migrated.player.hp).toBe(40);expect(migrated.rng).toBe(c.rng);expect(migrated.hand).toEqual(c.hand);expect(migrated.draw).toEqual(c.draw);expect(migrated.actions).toEqual(c.actions);expect(migrated.playHistory).toEqual(c.playHistory);
  expect(migrated.pending).toHaveLength(3);expect(migrated.pending![0]).toMatchObject({effect:CARDS['scarlet-requiem'].effects[0],context});expect(migrated.pending![1]).toMatchObject({effect:CARDS['scarlet-requiem'].effects[1],context});expect(migrated.pending![2]).toEqual(c.pending[3]);
  expect(migrated.rulesMigration).toEqual({fromVersion:2,mode:'snapshot-continuation'});expect(decoded.run!.compatibility?.noticeAcknowledged).toBe(false);expect(decodeSave(encodeSave(decoded))).toEqual(decoded);
 });
 it('round-trips an uncapped deck and a grandfathered realm deck while rejecting an unexplained sub-starting deck',()=>{
  const data=activeSave(),r=data.run!;r.combat=null;r.phase='road';r.current=null;r.realm=4;r.depth=0;
  expect(r.deck).toHaveLength(12);expect(validateSave(data)).toBe(true);
  while(r.deck.length<150)r.deck.push(instance(r,'ember-brand'));expect(decodeSave(encodeSave(data))).toEqual(data);
  r.deck=r.deck.slice(0,11);expect(validateSave(data)).toBe(false);
 });
 it('resumes a paid major receipt, Continued choices and fully skipped optional foundation without a second grant',()=>{
  let data=activeSave(),r=data.run!;r.current!.kind='tribulation';r.depth=roadLength(0)-1;const combat=structuredClone(r.combat!);combat.enemies.forEach(e=>{e.hp=0;});combat.phase='won';combat.actions.push({type:'endTurn',turn:combat.turn});r=commitCombat(r,combat);
  data={...data,run:r};const receipt=getPendingProgression(r)!;expect(receipt.kind).toBe('major');expect(decodeSave(encodeSave(data))).toEqual(data);
  const before={gold:r.gold,hp:r.hp,rng:r.rng,deck:r.deck};r=continueBreakthrough(decodeSave(encodeSave(data))!.run!,receipt.id);expect(r).toMatchObject(before);expect(r.progressionReceipts.at(-1)!.view).toBe('choices');
  r=takeReward(r,null);r=takeReward(decodeSave(encodeSave({...data,run:r}))!.run!,null);expect(r.phase).toBe('road');expect(r.deck).toEqual(before.deck);expect(r.gold).toBe(before.gold);expect(decodeSave(encodeSave({...data,run:r}))!.run).toEqual(r);
 });
 it('defaults to English and round-trips real initial/active combat states', () => {
  expect(defaultSettings().locale).toBe('en'); expect(loadSave(new MemoryStorage())).toEqual({ data: freshSave(), error: null, recovered: false });
  for (const data of [freshSave(), { ...freshSave(), run: newRun(1, 0) }, activeSave()]) {
   expect(validateSave(data)).toBe(true); expect(decodeSave(encodeSave(data))).toEqual(data);
  }
 });

 it('validates arbitrary malformed values without throwing, including missing nested combat fields', () => {
  const malformed: unknown[] = [null, undefined, 1, 'save', [], {}, { ...freshSave(), run: {} }, { ...freshSave(), settings: {} }];
  for (const field of ['player','hand','draw','discard','exhaust','summons','enemies','pending','actions','events']) {
   const data = activeSave(); Object.assign(data.run!.combat!, { [field]: null }); malformed.push(data);
  }
  for (const data of malformed) { expect(() => validateSave(data)).not.toThrow(); expect(validateSave(data)).toBe(false); }
 });

 it('rejects malformed settings, metadata, unknown references and illegal permanent ownership', () => {
  const mutate = (fn: (data: SaveData) => void) => { const data = activeSave(); fn(data); expect(validateSave(data)).toBe(false); };
  mutate(d => { d.settings.music = Infinity; }); mutate(d => { d.settings.speed = 3; });
  mutate(d => { Object.assign(d.settings, { tutorial: 'yes' }); });
  mutate(d => { d.meta.discovered.push('missing-card'); }); mutate(d => { d.meta.history.push({} as never); });
  mutate(d => { d.run!.maxHp = NaN; }); mutate(d => { d.run!.gold = -1; }); mutate(d => { d.run!.rulesVersion = 'obsolete'; });
  mutate(d => { d.run!.deck[0].defId = 'flying-sword'; }); mutate(d=>{d.run!.deck[0].defId='toString';}); mutate(d => { d.run!.deck[0].tempGrade = 1; });
  mutate(d => { d.run!.deck[0].costDelta = -1; }); mutate(d => { d.run!.deck[0].uid = d.run!.deck[1].uid; });
  mutate(d => { d.run!.combat!.hand[0].tempGrade = 9 as never; });
  mutate(d => { d.run!.combat!.enemies[0].defId = 'missing-enemy'; });
  mutate(d => { d.run!.combat!.enemies[0].hp = -1; }); mutate(d => { d.run!.combat!.version = 999; });
  mutate(d => { d.run!.combat!.draw.push(d.run!.combat!.hand[0]); });
  mutate(d => { d.run!.combat!.hand.pop(); });
  mutate(d => { d.run!.combat!.phase = 'won'; });
  mutate(d => { d.run!.combat!.choice = { kind: 'recover', ids: ['not-an-instance'], count: 1 }; });
 });

 it('round-trips generated Status owners but rejects permanent ownership and status grades',()=>{
  const data=activeSave();const status={uid:'controlled-status-owner',defId:STATUS_CARD_IDS[0],grade:0 as const,retained:0};
  data.run!.combat!.draw.push(status);expect(validateSave(data)).toBe(true);expect(decodeSave(encodeSave(data))).toEqual(data);
  for(const patch of [{grade:1},{tempGrade:1},{retained:1}]){const invalid=structuredClone(data);Object.assign(invalid.run!.combat!.draw.at(-1)!,patch);expect(validateSave(invalid)).toBe(false);}
  const owned=structuredClone(data);owned.run!.deck.push(status);expect(validateSave(owned)).toBe(false);
 });

 it('preserves a real pending card-selection resolution across refresh', () => {
  const data = activeSave(); const r = data.run!;
  // Controlled deck fixture for a mid-effect persistence boundary. It changes
  // neither engine rules nor player stats and is not a balance win claim.
  r.deck[0].defId = 'exchange-thought';
  r.combat = createCombat({ seed: 13, realm: r.realm, hp: r.hp, maxHp: r.maxHp, deck: r.deck, enemies: ['road-bandit'] });
  for (let turns = 0; !r.combat.hand.some(c => c.defId === 'exchange-thought') && turns < 5; turns++) r.combat = endTurn(r.combat);
  r.hp = r.combat.player.hp;
  const exchange = r.combat.hand.find(c => c.defId === 'exchange-thought')!;
  expect(exchange).toBeDefined(); const pending = playCard(r.combat, exchange.uid); expect(pending.choice?.kind).toBe('discard'); expect(pending.resolvingCard?.uid).toBe(exchange.uid);
  data.run = commitCombat(r, pending); expect(validateSave(data)).toBe(true);
  const decoded = decodeSave(encodeSave(data))!; expect(decoded).not.toBeNull();
  const choice = pending.choice!; const selected = choice.ids.slice(0, choice.min ?? 1);
  const expected = resolveChoice(pending, selected); const resumed = resolveChoice(decoded.run!.combat!, selected);
  expect(resumed).toEqual(expected); expect(validateSave({ ...decoded, run: commitCombat(decoded.run!, resumed) })).toBe(true);
 });

 it('saves a real playable Heart Demon action as committed history while combat continues',()=>{
  const data=activeSave(),r=data.run!,combat=r.combat!;
  combat.hand.push({uid:'generated-heart-demon',defId:'heart-demon',grade:0,retained:0});
  const beforeEnergy=combat.energy,played=playCard(combat,'generated-heart-demon');
  expect(played.phase).toBe('player');expect(played.energy).toBe(beforeEnergy-1);
  expect(played.playHistory.at(-1)).toMatchObject({uid:'generated-heart-demon',defId:'heart-demon',actualCost:1,ordinal:1});
  data.run=commitCombat(r,played);expect(validateSave(data)).toBe(true);expect(decodeSave(encodeSave(data))).toEqual(data);
 });

 it('preserves committed play history, a pending reorder and the unused next-Wind discount',()=>{
  const data=activeSave();const r=data.run!;
  r.deck=Array.from({length:12},(_,i)=>({uid:`sequence-${i}`,defId:i%2?'inner-sight':'wind-step',grade:0 as const,retained:0}));
  r.combat=createCombat({seed:17,realm:0,hp:r.hp,maxHp:r.maxHp,deck:r.deck,enemies:['stone-guardian']});
  const step=r.combat.hand.find(c=>c.defId==='wind-step')!,insight=r.combat.hand.find(c=>c.defId==='inner-sight')!;
  expect(step).toBeDefined();expect(insight).toBeDefined();
  let combat=playCard(r.combat,step.uid);combat=playCard(combat,insight.uid);expect(combat.choice?.kind).toBe('reorder');
  data.run=commitCombat(r,combat);expect(validateSave(data)).toBe(true);
  const restored=decodeSave(encodeSave(data))!;expect(restored.run!.combat!.playHistory).toEqual(combat.playHistory);expect(restored.run!.combat!.nextWindDiscount).toBeGreaterThan(0);
  const ordered=[...combat.choice!.ids].reverse();expect(resolveChoice(restored.run!.combat!,ordered)).toEqual(resolveChoice(combat,ordered));
  for(const mutate of [(d:SaveData)=>{d.run!.combat!.nextWindDiscount=-1;},(d:SaveData)=>{d.run!.combat!.playHistory[0].ordinal=9;},(d:SaveData)=>{d.run!.combat!.playHistory[0].actualCost=-1;},(d:SaveData)=>{d.run!.combat!.choice!.min=0;}]){const invalid=structuredClone(data);mutate(invalid);expect(validateSave(invalid)).toBe(false);}
 });

 it('saves progress and settings without mutating or reshuffling the active combat', () => {
  const storage = new MemoryStorage(); const data = activeSave(); const combat = structuredClone(data.run!.combat);
  const first = writeSave(storage, data, 0); const second = writeSave(storage, { ...first, settings: { ...first.settings, locale: 'zh-CN', speed: 2 } }, 1);
  expect(second.run!.combat).toEqual(combat); expect(loadSave(storage).data).toEqual(second);
  data.settings.locale = 'zh-CN'; expect(first.settings.locale).toBe('en');
  expect(first.revision).toBe(1); expect(second.revision).toBe(2);
 });

 it('rejects checksum edits and incompatible save versions', () => {
  const encoded = JSON.parse(encodeSave(freshSave())); encoded.payload = encoded.payload.replace('"en"', '"zh-CN"');
  expect(decodeSave(JSON.stringify(encoded))).toBeNull(); expect(decodeSave('not JSON')).toBeNull();
  const payload = JSON.stringify({ ...freshSave(), version: 99 }); expect(decodeSave(JSON.stringify({ payload, checksum: checksum(payload) }))).toBeNull();
 });

 it('recovers the current mirror if primary is corrupt and refuses a stale mirror below the revision head', () => {
  const storage = new MemoryStorage(); const current = writeSave(storage, activeSave(), 0);
  storage.setItem(SAVE_KEY, 'corrupt'); expect(loadSave(storage)).toEqual({ data: current, error: null, recovered: true });
  storage.setItem(`${SAVE_KEY}.head`, '2'); expect(loadSave(storage)).toEqual({ data: null, error: 'corrupt', recovered: false });
 });

 it('selects the newest complete snapshot after an interrupted write', () => {
  const storage = new MemoryStorage(); const first = writeSave(storage, activeSave(), 0);
  const second = { ...first, revision: 2, settings: { ...first.settings, locale: 'zh-CN' as const } };
  // Interrupted after primary write and before head/mirror writes.
  storage.setItem(SAVE_KEY, encodeSave(second)); expect(loadSave(storage).data).toEqual(second);
  // Alternate failure boundary: mirror carries the newest valid revision.
  storage.setItem(SAVE_KEY, encodeSave(first)); storage.setItem(`${SAVE_KEY}.mirror`, encodeSave(second));
  expect(loadSave(storage)).toEqual({ data: second, error: null, recovered: true });
 });

 it('distinguishes malformed storage metadata from an unavailable storage API', () => {
  for (const [key, value] of [[`${SAVE_KEY}.head`, 'NaN'], [`${SAVE_KEY}.head`, '-1'], [`${SAVE_KEY}.terminal`, '{'], [`${SAVE_KEY}.terminal`, '[]'], [`${SAVE_KEY}.terminal`, '{"id":"alive"}']]) {
   const storage = new MemoryStorage(); writeSave(storage, activeSave(), 0); storage.setItem(key, value); expect(loadSave(storage).error).toBe('corrupt');
  }
  expect(loadSave({ getItem() { throw new Error('disabled'); }, setItem() {} }).error).toBe('unavailable');
  const missing = new MemoryStorage(); missing.setItem(`${SAVE_KEY}.head`, '2'); expect(loadSave(missing).error).toBe('corrupt');
 });

 it('persists a terminal tombstone and blocks restoration of the same run from stale living saves', () => {
  const storage = new MemoryStorage(); const alive = writeSave(storage, activeSave(), 0);
  const terminalRun = retire(alive.run!); const terminal = writeSave(storage, { ...alive, run: terminalRun, meta: updateMeta(alive.meta, terminalRun, 9000) }, 1);
  expect(loadSave(storage).data?.run?.phase).toBe('dead'); expect(JSON.parse(storage.getItem(`${SAVE_KEY}.terminal`)!)[terminalRun.id]).toBe('dead');
  storage.setItem(SAVE_KEY, encodeSave(alive)); storage.setItem(`${SAVE_KEY}.mirror`, encodeSave(alive)); storage.setItem(`${SAVE_KEY}.head`, '1');
  expect(loadSave(storage).error).toBe('corrupt');
  expect(terminal.meta.history).toHaveLength(1);
 });

 it('allows retirement before starting selection without losing the terminal record', () => {
  const data = freshSave(); data.run = retire(newRun(3, 1000)); data.meta = updateMeta(data.meta, data.run, 2000);
  expect(validateSave(data)).toBe(true); const saved = writeSave(new MemoryStorage(), data, 0); expect(saved.meta.history).toHaveLength(1);
 });

 it('rejects a second tab using a stale expected revision', () => {
  const storage = new MemoryStorage(); const one = loadSave(storage).data!, two = loadSave(storage).data!;
  writeSave(storage, one, 0); expect(() => writeSave(storage, two, 0)).toThrow(SaveConflict);
  expect(loadSave(storage).data?.revision).toBe(1);
 });

 it('serializes simultaneous saves through the browser Web Locks boundary', async () => {
  const storage = new MemoryStorage(); let tail: Promise<unknown> = Promise.resolve(); let requests = 0;
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('navigator', { locks: { request(_key: string, callback: () => unknown) { requests++; const current = tail.then(callback); tail = current.catch(() => {}); return current; } } });
  const outcomes = await Promise.allSettled([saveWithLock(freshSave(), 0), saveWithLock(freshSave(), 0)]);
  expect(requests).toBe(2); expect(outcomes.filter(outcome => outcome.status === 'fulfilled')).toHaveLength(1);
  const rejected = outcomes.find(outcome => outcome.status === 'rejected') as PromiseRejectedResult; expect(rejected.reason).toBeInstanceOf(SaveConflict);
 });

 it('keeps the primary readable if the final mirror write fails', () => {
  const storage = new MemoryStorage(); const original = storage.setItem.bind(storage);
  storage.setItem = (key, value) => { if (key.endsWith('.mirror')) throw new Error('quota'); original(key, value); };
  expect(() => writeSave(storage, activeSave(), 0)).toThrow('quota');
  expect(loadSave(storage).error).toBeNull(); expect(loadSave(storage).data?.revision).toBe(1);
 });

 it('round-trips real combat actions and rejects no-op duplicated UI commits', () => {
  let data = activeSave(),accepted=0; const storage = new MemoryStorage(); data = writeSave(storage, data, 0);
  for (let i = 0; i < 8 && data.run!.phase === 'combat'; i++) {
   const c = data.run!.combat!;
   const card = c.hand.find(card => !playableReason(c, card)),target=card?CARDS[card.defId].target:undefined;
   const targetId=target==='self'?c.player.id:target==='enemy'?c.enemies.find(enemy=>enemy.hp>0)!.id:undefined;
   const next=c.choice?resolveChoice(c,c.choice.kind==='tidal'?['rising']:c.choice.kind==='reorder'?c.choice.ids:c.choice.ids.slice(0,c.choice.min??c.choice.count)):card?playCard(c,card.uid,targetId):endTurn(c);
   expect(next).not.toBe(c);expect(next.actions).toHaveLength(c.actions.length+1);accepted++;
   const run = commitCombat(data.run!, next); expect(commitCombat(run, next)).toBe(run);
   data = writeSave(storage, { ...data, run }, data.revision); expect(loadSave(storage).data).toEqual(data);
  }
  expect(accepted).toBeGreaterThan(0);
 });
});

describe('explicit legacy compatibility and presentation preferences',()=>{
 function legacyStorage(){
  const storage=new MemoryStorage();const old=JSON.parse(JSON.stringify(activeSave())) as Record<string,unknown>;
  old.version=1;const settings=old.settings as Record<string,unknown>;settings.locale='zh';delete settings.gradeDisplay;
  const run=old.run as Record<string,unknown>;run.rulesVersion='human-0.1.0';run.contentVersion='human-0.1.0';delete run.activeMs;delete run.routeHistory;
  const payload=JSON.stringify(old),raw=JSON.stringify({payload,checksum:checksum(payload)});
  storage.setItem(LEGACY_SAVE_KEY,raw);storage.setItem(`${LEGACY_SAVE_KEY}.mirror`,raw);storage.setItem(`${LEGACY_SAVE_KEY}.head`,'0');
  return{storage,raw,old};
 }
 it('does not silently create v2 or run an old combat through the new resolver',()=>{
  const {storage,raw}=legacyStorage();expect(loadSave(storage).error).toBe('compatibility');
  expect(storage.getItem(SAVE_KEY)).toBeNull();expect(storage.getItem(LEGACY_SAVE_KEY)).toBe(raw);
  expect(()=>writeSave(storage,freshSave(),0)).toThrow('save-compatibility');
  const exported=exportLegacySave(storage);expect(exported.snapshots[LEGACY_SAVE_KEY]).toBe(raw);expect(exported.continueUrl).toBe('/legacy/v1/index.html');
 });
 it('archives exact original bytes before an explicit new-revision choice, preserving meta and locale',()=>{
  const {storage,raw,old}=legacyStorage();const next=archiveLegacyAndStartFresh(storage,'start-new-revision');
  expect(next.version).toBe(2);expect(next.run).toBeNull();expect(next.settings.locale).toBe('zh-CN');expect(next.settings.gradeDisplay).toBe('numeric');
  expect(next.meta).toEqual(old.meta);expect(storage.getItem(LEGACY_SAVE_KEY)).toBe(raw);
  const archiveKey=[...storage.values.keys()].find(k=>k.startsWith('heavenward.archive.v1.'))!;
  expect(JSON.parse(storage.getItem(archiveKey)!).snapshots[LEGACY_SAVE_KEY]).toBe(raw);
  expect(loadSave(storage).data).toEqual(next);expect(()=>archiveLegacyAndStartFresh(storage,'start-new-revision')).toThrow('legacy-choice-unavailable');
 });
 it('retains historical durations as legacy wall time and never converts the owned active deck',()=>{
  const {storage,old}=legacyStorage();const meta=old.meta as Record<string,unknown>;
  meta.history=[{id:'old-completed',seed:7,realm:0,outcome:'dead',duration:9000,stats:{combats:1,elites:0,tribulations:0,cards:2,gold:22},paths:['fire'],cause:{en:'Old foe',zh:'旧敌'}}];
  const payload=JSON.stringify(old),raw=JSON.stringify({payload,checksum:checksum(payload)});storage.setItem(LEGACY_SAVE_KEY,raw);storage.setItem(`${LEGACY_SAVE_KEY}.mirror`,raw);
  const next=archiveLegacyAndStartFresh(storage,'start-new-revision');expect(next.meta.history[0]).toMatchObject({id:'old-completed',duration:9000,durationKind:'legacy-wall'});
  expect(next.run).toBeNull();const retained=JSON.parse(JSON.parse(storage.getItem(LEGACY_SAVE_KEY)!).payload);
  expect(retained.run.deck).toEqual((old.run as Record<string,unknown>).deck);expect(retained.run.rulesVersion).toBe('human-0.1.0');
 });
 it('fails closed if archival cannot be written; neither v1 nor v2 is altered',()=>{
  const {storage,raw}=legacyStorage();const write=storage.setItem.bind(storage);
  storage.setItem=(key,value)=>{if(key.startsWith('heavenward.archive'))throw new Error('quota');write(key,value);};
  expect(()=>archiveLegacyAndStartFresh(storage,'start-new-revision')).toThrow('quota');expect(storage.getItem(SAVE_KEY)).toBeNull();expect(storage.getItem(LEGACY_SAVE_KEY)).toBe(raw);
 });
 it('persists all explicit locale and grade displays without changing the run, offers or RNG',()=>{
  let data=activeSave();const storage=new MemoryStorage(),run=structuredClone(data.run);
  for(const locale of ['en','zh-CN','vi'] as const)for(const gradeDisplay of ['numeric','letters','traditional'] as const){
   data=writeSave(storage,{...data,settings:{...data.settings,locale,gradeDisplay}},data.revision);
   expect(loadSave(storage).data!.settings).toMatchObject({locale,gradeDisplay});expect(data.run).toEqual(run);
  }
 });
});
