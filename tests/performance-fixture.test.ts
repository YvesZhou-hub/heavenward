import { describe, expect, it } from 'vitest';
import { battleFixture, fixtureSave, MEASURED_ACTIONS } from '../scripts/performance';
import { playCard, playableReason } from '../src/game/combat';
import { commitCombat } from '../src/game/run';
import { decodeSave, encodeSave, validateSave } from '../src/game/save';

// Accelerated, explicitly synthetic presentation workload. Never balance evidence.
describe('production performance fixture', () => {
 it('survives the bounded mixed-input workload with valid v2 ownership and exactly ten plays', () => {
  let run=battleFixture();
  const before=structuredClone(run);
  const data=fixtureSave(run);
  expect(decodeSave(encodeSave(data))).toEqual(data);
  expect(run).toEqual(before);
  expect(run.combat!.hand).toHaveLength(10);
  expect(run.combat!.summons).toHaveLength(3);
  expect(run.combat!.enemies).toHaveLength(3);
  expect(data.settings.gradeDisplay).toBe('numeric');
  for(const action of MEASURED_ACTIONS){
   const combat=run.combat!,card=combat.hand.find(c=>c.defId===action.cardId)!;
   expect(playableReason(combat,card)).toBeNull();
   const resolved=playCard(combat,card.uid,action.mode==='enemy-target-click'?combat.enemies[0].id:undefined);
   expect(resolved.playHistory).toHaveLength(combat.playHistory.length+1);
   expect(resolved.playHistory.at(-1)!.uid).toBe(card.uid);
   run=commitCombat(run,resolved);
   expect(validateSave(fixtureSave(run))).toBe(true);
  }
  expect(run.phase).toBe('combat');
  expect(run.combat!.playHistory).toHaveLength(10);
  expect(run.combat!.hand).toHaveLength(0);
  expect(run.combat!.enemies.every(enemy=>enemy.hp>0)).toBe(true);
  expect(run.combat!.player.armor).toBeGreaterThan(0);
  expect(run.combat!.energy).toBe(10);
 });

 it('rejects an owner missing from the workload instead of bypassing production validation', () => {
  const run=battleFixture();
  run.combat!.hand.pop();
  expect(()=>fixtureSave(run)).toThrow('Performance fixture rejected by production validator');
 });
});
