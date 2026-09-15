// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { ARCHETYPES, CARDS, ENEMIES, GRADE_NAMES, PATHS, REALMS, SUMMONS } from '../src/game/content';
import { DAO_ENCYCLOPEDIA, KEYWORD_GLOSSARY } from '../src/game/encyclopedia';
import { CATEGORY_NAMES, STATUS_NAMES, SUPPORTED_LOCALES, copy, tr } from '../src/game/i18n';
import { STATUS_HELP, STATUS_SHORT } from '../src/game/status-help';
import { EVENTS, NODE_DESCRIPTION, NODE_NAMES, STAGES } from '../src/game/run';
import { RULES } from '../src/game/rules';
import { POWER_NAMES, POWER_TEXT } from '../src/game/combat-text';
import type { Text } from '../src/game/types';

function allText(value: unknown, path = 'root'): [string, Text][] {
  if (!value || typeof value !== 'object') return [];
  if ('en' in value || 'zh-CN' in value || 'vi' in value) return [[path, value as Text]];
  return Object.entries(value).flatMap(([key, child]) => allText(child, `${path}.${key}`));
}
const registries = { POWER_NAMES, POWER_TEXT, CARDS, ENEMIES, SUMMONS, PATHS, REALMS, GRADE_NAMES, ARCHETYPES, copy, CATEGORY_NAMES, STATUS_NAMES, STATUS_HELP, STATUS_SHORT, KEYWORD_GLOSSARY, DAO_ENCYCLOPEDIA, EVENTS, NODE_NAMES, NODE_DESCRIPTION, STAGES };
const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/gu)].map(m => m[1]).sort();

describe('three-language domain localization', () => {
  it('provides authored text in every supported language with matching placeholders', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'zh-CN', 'vi']);
    const entries = allText(registries);
    expect(entries.length).toBeGreaterThan(500);
    for (const [path, value] of entries) {
      expect(Object.keys(value).sort(), path).toEqual([...SUPPORTED_LOCALES].sort());
      for (const locale of SUPPORTED_LOCALES) {
        expect(typeof value[locale], `${path}.${locale}`).toBe('string');
        expect(value[locale].trim().length, `${path}.${locale}`).toBeGreaterThan(0);
        expect(placeholders(value[locale]), `${path}.${locale}`).toEqual(placeholders(value.en));
        expect(value[locale], `${path}.${locale}`).not.toMatch(/\bundefined\b|\bNaN\b|\[missing|\bTODO\b|translation pending/iu);
      }
      expect(value.vi, path).not.toMatch(/[\u3400-\u9fff]/u);
      expect(value.en, path).not.toMatch(/[\u3400-\u9fff]/u);
      // All domain phrases were translated; short numeric values/abbreviations
      // are allowed to coincide, but an English sentence cannot masquerade as VI.
      if (value.en.length > 12) expect(value.vi, path).not.toEqual(value.en);
    }
  });

  it('interpolates live values without replacing localized grammar or leaving placeholders', () => {
    expect(tr('vi', 'turn', { n: 3 })).toBe('LƯỢT CỦA BẠN · 3');
    expect(tr('zh-CN', 'round', { n: 2 })).toBe('第2次择法 · 共2次');
    expect(tr('en', 'healHint', { n: 19 })).toContain('19 HP');
    for (const locale of SUPPORTED_LOCALES) expect(tr(locale, 'foundationHint', { n: 4 })).not.toContain('{n}');
  });

  it('connects every encyclopedia path, archetype, card example and keyword to live content', () => {
    expect(DAO_ENCYCLOPEDIA.map(entry => entry.id)).toEqual(PATHS.map(path => path.id));
    for (const entry of DAO_ENCYCLOPEDIA) {
      expect(entry.name).toEqual(PATHS.find(path => path.id === entry.id)!.name);
      expect(entry.archetypes.length).toBeGreaterThan(0);
      entry.keywords.forEach(id => expect(KEYWORD_GLOSSARY[id], `${entry.id}.${id}`).toBeDefined());
      entry.exampleCardIds.forEach(id => expect(CARDS[id]?.path, `${entry.id}.${id}`).toBe(entry.id));
      for (const archetype of entry.archetypes) {
        expect(archetype.name).toEqual(ARCHETYPES[archetype.id]);
        expect(archetype.cardIds.length).toBeGreaterThan(0);
        archetype.cardIds.forEach(id => expect(CARDS[id]).toMatchObject({ path: entry.id, archetype: archetype.id }));
      }
    }
    expect(DAO_ENCYCLOPEDIA.find(entry => entry.id === 'wisdom')!.archetypes.map(entry => entry.id).sort()).toEqual(['calculation', 'discard']);
    expect(DAO_ENCYCLOPEDIA.find(entry => entry.id === 'wind')!.archetypes.map(entry => entry.id).sort()).toEqual(['gale', 'pursuit']);
  });

  it('uses canonical Basic Mastery vocabulary and preserves each status-specific cap', () => {
    expect(STATUS_NAMES.basicPower).toEqual({ en: 'Basic Mastery', 'zh-CN': '基础精通', vi: 'Tinh Thông Cơ Bản' });
    const caps = { strength: 10, pierce: 6, protectiveQi: 5, swordIntent: 10, tidalMomentum: 5 } as const;
    for (const status of Object.keys(caps) as (keyof typeof caps)[]) {
      expect(RULES.statusCaps[status]).toBe(caps[status]);
      for (const locale of SUPPORTED_LOCALES) expect(STATUS_HELP[status][locale]).toContain(String(caps[status]));
      expect(KEYWORD_GLOSSARY[status].description).toEqual(STATUS_HELP[status]);
    }
    expect(KEYWORD_GLOSSARY.activeDiscard.paths).toEqual(['wisdom']);
    expect(KEYWORD_GLOSSARY.pursuit.paths).toEqual(['wind']);
    expect(KEYWORD_GLOSSARY.statusCard.name).toEqual(CATEGORY_NAMES.status);
    expect(Object.keys(POWER_NAMES).sort()).toEqual(Object.keys(POWER_TEXT).sort());
    for (const card of Object.values(CARDS)) for (const effect of card.effects) if (effect.op === 'power') expect(POWER_TEXT[effect.id!], card.id).toBeDefined();
  });
});
