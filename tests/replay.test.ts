// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { createCombat, endTurn, playCard, resolveChoice, migrateCombatRulesV2 } from '../src/game/combat';
import { createCombatReplay, replayCombat } from '../src/game/replay';
import type { CombatConfig } from '../src/game/types';

describe('current-version deterministic combat replay',()=>{
 it('replays real card, discard choice and turn actions after JSON transport; rejects divergence',()=>{
  // Every opening card is the genuine Wisdom discard/draw card, so the seeded
  // shuffle guarantees a real queued choice without changing engine content.
  const config:CombatConfig={seed:7531,realm:0,hp:72,maxHp:72,enemies:['stone-guardian'],deck:Array.from({length:12},(_,i)=>({uid:`replay-${i}`,defId:'empty-sleeve',grade:0,retained:0}))};
  const initial=createCombat(config);const before=structuredClone(initial);
  let final=playCard(initial,initial.hand[0].uid);
  expect(final.choice?.kind).toBe('discard');
  final=resolveChoice(final,final.choice!.ids.slice(0,final.choice!.count));
  final=endTurn(final);
  const replay=createCombatReplay(config,final);
  expect(replay.actions.map(action=>action.type)).toEqual(['playCard','resolveChoice','endTurn']);
  const transported=JSON.parse(JSON.stringify(replay));
  expect(replayCombat(transported)).toEqual(final);
  expect(initial).toEqual(before);
  expect(replayCombat(transported).rng).toBe(final.rng);
  const badAction=structuredClone(transported);badAction.actions[1].ids=['not-a-choice'];
  expect(()=>replayCombat(badAction)).toThrow('was rejected');
  const wrongTurn=structuredClone(transported);wrongTurn.actions[2].turn=9;
  expect(()=>replayCombat(wrongTurn)).toThrow('expects turn 9');
  const divergent=structuredClone(transported);divergent.expectedState.rng+=1;
  expect(()=>replayCombat(divergent)).toThrow('final state differs');
  const future=structuredClone(transported);future.rulesVersion='future-version';
  expect(()=>replayCombat(future)).toThrow('exact installed rules and content versions');
  const old=structuredClone(transported);old.rulesVersion='human-0.2.0';old.contentVersion='human-0.2.0';expect(()=>replayCombat(old)).toThrow('exact installed rules and content versions');
  const migrated=migrateCombatRulesV2({...final,version:2});expect(()=>createCombatReplay(config,migrated)).toThrow('snapshot continuation');
  expect(()=>replayCombat({...transported,expectedState:migrated})).toThrow('snapshot continuation');
 });
});
