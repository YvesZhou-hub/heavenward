// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { createCombat, playableReason } from '../src/game/combat';
import { choiceIds, playTarget, scorePlay } from '../scripts/simulate';
import type { CardInstance } from '../src/game/types';

// Controlled board fixtures validate the diagnostic policy, not acquisition.
const card = (defId: string, uid: string): CardInstance => ({ defId, uid, grade: 0, retained: 0 });
describe('diagnostic visible-information policy', () => {
  it('separates the enemy being observed from self, no-target and AoE activation', () => {
    const c=createCombat({seed:9,realm:0,hp:72,maxHp:72,deck:[],enemies:['road-bandit']});
    const enemy=c.enemies[0].id;
    expect(playTarget(c,card('defense','own'),enemy)).toBe(c.player.id);
    expect(playTarget(c,card('heart-demon','none'),enemy)).toBeUndefined();
    expect(playTarget(c,card('strike','chosen'),enemy)).toBe(enemy);
    expect(playTarget(c,card('ash-rain','all'),enemy)).toBe(enemy);
  });
  it('spends a free Flying Sword to remove visible Dodge instead of ending the turn', () => {
    const c = createCombat({ seed: 1, realm: 0, hp: 72, maxHp: 72, deck: [card('flying-sword', 'probe')], enemies: ['cloud-beastmaster'] });
    c.enemies[0].statuses.dodge = 1;
    expect(playableReason(c, c.hand[0])).toBeNull();
    expect(scorePlay(c, c.hand[0], c.enemies[0].id)).toBeGreaterThan(.25);
  });

  it('does not inspect unrevealed draw order or mutate the public state while scoring', () => {
    const c = createCombat({ seed: 2, realm: 0, hp: 72, maxHp: 72, deck: [card('flying-sword', 'probe')], enemies: ['cloud-beastmaster'] });
    c.enemies[0].statuses.dodge = 1;
    c.draw = [card('scorched-meridian', 'unknown-a'), card('defense', 'unknown-b'), card('battle-roar', 'unknown-c')];
    const before = structuredClone(c), score = scorePlay(c, c.hand[0], c.enemies[0].id);
    expect(c).toEqual(before);
    const reversed = structuredClone(c); reversed.draw.reverse();
    expect(scorePlay(reversed, reversed.hand[0], reversed.enemies[0].id)).toBe(score);
    c.choice = { kind: 'reorder', ids: ['unknown-b', 'unknown-c'], count: 2, min: 2 };
    expect(new Set(choiceIds(c, ['strength']))).toEqual(new Set(c.choice.ids));
    expect(choiceIds(c, ['strength'])).not.toContain('unknown-a');
  });
});
