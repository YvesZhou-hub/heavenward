// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { CARDS, REALMS, SUMMONS } from '../../src/game/content';
import { chooseStarting, enterNode, instance, newRun, updateMeta, roadLength, upgradeCost, type NodeKind, type Run } from '../../src/game/run';
import { encodeSave, freshSave, SAVE_KEY, validateSave, type SaveData } from '../../src/game/save';
import type { Locale, Summon } from '../../src/game/types';

const evidenceDirectory = 'output/playwright';
const pageErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
});
test.afterEach(async ({ page }) => { expect(pageErrors.get(page), 'No browser runtime or console errors').toEqual([]); });

async function saved(page: Page): Promise<SaveData> {
  return page.evaluate(key => {
    for (const candidate of [key, `${key}.mirror`]) {
      try { return JSON.parse(JSON.parse(localStorage.getItem(candidate)!).payload); } catch { /* The production loader can recover the committed mirror. */ }
    }
    throw new Error('No decodable browser save');
  }, SAVE_KEY);
}
async function phase(page: Page, value: Run['phase']): Promise<void> {
  await expect.poll(async () => (await saved(page)).run?.phase).toBe(value);
}
async function screenshot(page: Page, name: string) {
  await mkdir(evidenceDirectory, { recursive: true });
  await page.mouse.move(5, 5);
  await page.screenshot({ path: `${evidenceDirectory}/${test.info().project.name}-${name}.png`, fullPage: true, animations: 'disabled' });
}
/** Controlled state fixtures exercise UI/persistence boundaries, never measure run balance. */
function controlledRun(seed = 913): Run {
  let run = newRun(seed, 1000);
  run = chooseStarting(run, run.offers[0].uid);
  run = chooseStarting(run, run.offers[0].uid);
  return run;
}
function controlledNode(kind: NodeKind, options: { realm?: number; eventId?: number; enemies?: string[]; hp?: number; cards?: string[] } = {}): Run {
  const run = controlledRun();
  run.realm = options.realm ?? 0;
  run.depth = kind === 'tribulation' ? roadLength(run.realm)-1 : kind === 'merchant' ? 1 : kind === 'rest' ? 2 : 0;
  run.maxHp = 72 + run.realm * 12; run.hp = options.hp ?? run.maxHp; run.gold = 300;
  const ids = options.cards ?? ['strike', 'strike', 'strike', 'strike', 'strike', 'defense', 'defense', 'defense', 'defense', 'defense', 'twin-stars', 'stone-rampart'];
  run.deck = Array.from({ length: REALMS[run.realm].minDeck }, (_, i) => instance(run, ids[i] ?? (i % 2 ? 'defense' : 'strike'), run.realm));
  const encounter = ['combat', 'elite', 'tribulation'].includes(kind) ? options.enemies ?? [kind === 'elite' ? 'jade-hunter' : kind === 'tribulation' ? 'thunder-judge' : 'road-bandit'] : undefined;
  run.nodes = [{ id: 'controlled-node', kind, eventId: options.eventId, encounter }];
  const next = enterNode(run, 'controlled-node');
  if (next.combat && options.cards) {
    // Deliberate test hand from the permanent deck; all remaining cards keep a single Draw owner.
    next.combat.hand = structuredClone(next.deck.slice(0, Math.min(10, options.cards.length)));
    next.combat.draw = structuredClone(next.deck.slice(next.combat.hand.length));
    next.combat.discard = []; next.combat.exhaust = [];
  }
  return next;
}
async function loadFixture(page: Page, run: Run, locale: Locale = 'en'): Promise<void> {
  const data = freshSave(); data.revision = 1; data.run = run;
  data.meta = updateMeta(data.meta, run, 2000);
  data.settings = { ...data.settings, locale, tutorial: false, reducedMotion: true, music: 0, sfx: 0 };
  expect(validateSave(data), `Fixture must satisfy production save validation (${run.phase})`).toBe(true);
  await page.goto('/');
  await page.evaluate(({ key, encoded }) => {
    for (const item of Object.keys(localStorage)) if (item.startsWith('heavenward')) localStorage.removeItem(item);
    localStorage.setItem(key, encoded); localStorage.setItem(`${key}.mirror`, encoded); localStorage.setItem(`${key}.head`, '1');
  }, { key: SAVE_KEY, encoded: encodeSave(data) });
  await page.reload();
  await page.locator('.menu-options .primary-button').click();
  await expect(page.locator(`.phase-${run.phase}`)).toBeVisible();
}
async function clickCard(page: Page, defId: string, target = true) {
  const revision = (await saved(page)).revision;
  const face=page.locator(`.hand-area [data-card="${defId}"] .card-face`).first();
  if(target)await face.click();else await face.dblclick();
  if (target) await page.locator('.enemy').first().click();
  await expect.poll(async () => (await saved(page)).revision).toBeGreaterThan(revision);
}

// These tests start from an empty browser profile and use only ordinary UI actions.
test('ordinary UI: fresh English, two starting drafts, active combat locale switch and resume', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: 'Begin a new life', exact: true })).toBeVisible();
  await screenshot(page, 'fresh-english-menu');
  await page.getByRole('button', { name: 'Begin a new life', exact: true }).click();
  await expect(page.locator('.starting-offers .offer')).toHaveCount(5);
  expect((await saved(page)).settings.gradeDisplay).toBe('numeric');
  expect((await saved(page)).version).toBe(2);
  await expect(page.locator('.starting-offers .card-type').first()).toContainText('Grade 1');
  await page.locator('.starting-offers .card-action').first().click();
  await expect.poll(async () => (await saved(page)).run?.startingRound).toBe(1);
  await expect(page.locator('.starting-offers .offer')).toHaveCount(5);
  await page.locator('.starting-offers .card-action').first().click();
  await phase(page, 'road');
  const drafted = (await saved(page)).run!;
  expect(drafted.deck).toHaveLength(12);
  expect(drafted.deck.filter(c => c.defId === 'strike')).toHaveLength(5);
  expect(drafted.deck.filter(c => c.defId === 'defense')).toHaveLength(5);
  await expect(page.locator('.branch-options .branch-node')).toHaveCount(3);
  for(let i=0;i<3;i++)await expect(page.locator('.branch-options .branch-node').nth(i),`Reachable visible branch ${i+1}`).toBeInViewport({ratio:1});
  await screenshot(page,'ordinary-three-road-choices');
  await page.locator('.node-combat').first().click();
  await phase(page, 'combat'); await expect(page.locator('.hand-area .game-card')).toHaveCount(5);
  const before = (await saved(page)).run!;
  await page.getByRole('button', { name: '简中', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  expect((await saved(page)).run).toEqual(before);
  await screenshot(page, 'ordinary-first-combat-zh');
  await page.getByRole('button', { name: 'VI', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  expect((await saved(page)).run).toEqual(before);
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const english = (await saved(page)).run!;
  await page.reload(); await page.getByRole('button', { name: 'Continue journey', exact: true }).click();
  await expect(page.locator('.battle')).toBeVisible(); expect((await saved(page)).run).toEqual(english);
});

test('controlled combat fixture: keyboard cancel/play, drag target, preview and real saves', async ({ page }) => {
  const run = controlledNode('combat', { cards: ['strike', 'strike', 'defense', 'twin-stars', 'ripple-guard'] });
  run.combat!.energy = 8;
  await loadFixture(page, run);
  const initialHp = run.combat!.enemies[0].hp;
  await page.keyboard.press('1'); await expect(page.locator('.target-preview')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('.target-preview')).toHaveCount(0);
  await page.keyboard.press('1'); await page.locator('.enemy').first().focus(); await page.keyboard.press('Enter');
  await expect.poll(async () => (await saved(page)).run?.combat?.enemies[0].hp).toBe(initialHp - 5);
  await page.locator('.hand-area [data-card="strike"] .card-face').dragTo(page.locator('.enemy').first());
  await expect.poll(async () => (await saved(page)).run?.combat?.enemies[0].hp).toBe(initialHp - 10);
  const beforeSelf=(await saved(page)).run!.combat!;
  await page.locator('.hand-area [data-card="defense"] .card-face').click();
  expect((await saved(page)).run!.combat).toEqual(beforeSelf);
  await clickCard(page, 'defense', false);
  await expect.poll(async () => (await saved(page)).run?.combat?.player.armor).toBe(5);
  const beforeDrop=(await saved(page)).run!.combat!;
  await page.locator('.hand-area [data-card="ripple-guard"] .card-face').dragTo(page.locator('.cultivator'));
  await expect.poll(async ()=>(await saved(page)).run!.combat!.actions.length).toBe(beforeDrop.actions.length+1);
  expect((await saved(page)).run!.combat!.hand.some(c=>c.defId==='ripple-guard')).toBe(false);
  await page.keyboard.press('e');
  await expect.poll(async () => (await saved(page)).run?.combat?.turn).toBe(2);
});

test('controlled Elite fixture: actual lethal play opens one reward and acquisition persists', async ({ page }) => {
  const run = controlledNode('elite', { cards: ['strike', 'defense'] }); run.combat!.enemies[0].hp = 5;
  await loadFixture(page, run); await clickCard(page, 'strike'); await phase(page, 'reward');
  expect((await saved(page)).run!.stats.elites).toBe(1);
  await expect(page.locator('.reward-scene .offer')).toHaveCount(5);
  await screenshot(page, 'controlled-elite-reward');
  await page.locator('.reward-scene .card-action').first().click(); await phase(page, 'road');
  expect((await saved(page)).run!.deck.length).toBe(run.deck.length + 1);
});

test('controlled Merchant fixture: visual upgrade picker, pure cancel, transaction and sale limits', async ({ page }) => {
  const run = controlledNode('merchant'); await loadFixture(page, run);
  await screenshot(page, 'controlled-merchant-stock');
  expect(run.offers.every(c => ['dao','immortal'].includes(CARDS[c.defId].category))).toBe(true);
  await page.locator('.shop-stock .card-action').first().click();
  await expect.poll(async () => (await saved(page)).run?.deck.length).toBe(13);
  const afterBuy = (await saved(page)).run!;
  await page.locator('.shop-services .service-button').first().click();
  await expect(page.locator('dialog .visual-picker .picker-option')).toHaveCount(13);
  await page.locator('dialog .visual-picker .card-action').first().click();
  await expect(page.locator('.comparison .game-card')).toHaveCount(2);
  expect((await saved(page)).run).toEqual(afterBuy);
  await expect(page.locator('.comparison')).toContainText('Grade 1');
  await expect(page.locator('.comparison')).toContainText('Grade 2');
  await screenshot(page, 'controlled-merchant-upgrade-comparison');
  await page.keyboard.press('Escape'); await expect(page.locator('dialog')).toHaveCount(0);
  expect((await saved(page)).run).toEqual(afterBuy);
  await page.locator('.shop-services .service-button').first().click();
  await page.locator('dialog .visual-picker .card-action').first().click();
  await page.locator('dialog .primary-button').click();
  await expect.poll(async () => (await saved(page)).run?.shop.upgraded).toBe(1);
  expect((await saved(page)).run!.gold).toBe(afterBuy.gold - upgradeCost(afterBuy));
  const afterFirst=(await saved(page)).run!;
  await page.locator('.shop-services .service-button').first().click();
  await page.locator('dialog .visual-picker .card-action:not([disabled])').first().click();
  await expect(page.locator('dialog .primary-button')).toContainText(String(upgradeCost(afterFirst)));
  await page.locator('dialog .primary-button').click();
  await expect.poll(async () => (await saved(page)).run?.shop.upgraded).toBe(2);
  await page.locator('.shop-services .service-button').first().click();
  await expect(page.locator('dialog .visual-picker .card-action:not([disabled])')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.locator('.shop-services .service-button').nth(1).click();
  await page.locator('dialog .visual-picker .card-action').nth(1).click();
  await expect(page.locator('dialog .sale-confirm')).toBeVisible();
  await page.locator('dialog .danger-button').click();
  await expect.poll(async () => (await saved(page)).run?.shop.sold).toBe(1);
  expect((await saved(page)).run!.deck.length).toBe(12);
  await page.locator('.shop-services .service-button').nth(1).click();
  await expect(page.locator('dialog .visual-picker .card-action:not([disabled])')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.locator('.shop-services .secondary-button').click(); await phase(page, 'road');
});

test('controlled Rest fixtures: capped heal confirmation, pure cancel and one free visual upgrade', async ({ page }) => {
  const healRun = controlledNode('rest', { hp: 70 }); await loadFixture(page, healRun);
  await screenshot(page, 'controlled-rest-choice');
  await page.locator('.rest-healing').click();
  await expect(page.locator('dialog .rest-confirm')).toContainText('2 HP');
  expect((await saved(page)).run).toEqual(healRun);
  await page.keyboard.press('Escape');expect((await saved(page)).run).toEqual(healRun);
  await page.locator('.rest-healing').click();await page.locator('dialog .primary-button').click(); await phase(page, 'road');
  expect((await saved(page)).run!.hp).toBe(72);
  const upgradeRun = controlledNode('rest', { hp: 30 }); await loadFixture(page, upgradeRun);
  await page.locator('.rest-refining').click();await page.locator('dialog .visual-picker .card-action').first().click();
  await expect(page.locator('.comparison .game-card')).toHaveCount(2);expect((await saved(page)).run).toEqual(upgradeRun);
  await page.locator('dialog .primary-button').click(); await phase(page, 'road');
  expect((await saved(page)).run!.hp).toBe(30); expect((await saved(page)).run!.deck[0].grade).toBe(1);
});

test('controlled Event and Inheritance fixtures: real choices, acquisition, and skip', async ({ page }) => {
  const run = controlledNode('event', { eventId: 1 }); await loadFixture(page, run);
  await expect(page.getByRole('heading', { name: 'A sword beneath the roots' })).toBeVisible();
  await screenshot(page, 'controlled-event');
  await page.locator('.event-options button').first().click(); await phase(page, 'inheritance');
  await page.locator('.reward-scene .card-action').first().click(); await phase(page, 'road');
  expect((await saved(page)).run!.deck.length).toBe(13);
  const inherited = controlledNode('inheritance'); await loadFixture(page, inherited);
  await screenshot(page, 'controlled-inheritance');
  await page.locator('.reward-scene .secondary-button').click(); await phase(page, 'road');
  expect((await saved(page)).run!.deck.length).toBe(12);
});

test('controlled breakthrough fixture: legal Divine reward, foundation drafts and first activation', async ({ page }) => {
  const run = controlledNode('tribulation', { cards: ['strike', 'defense'] }); run.combat!.enemies[0].hp = 5;
  await loadFixture(page, run); await clickCard(page, 'strike'); await phase(page, 'breakthrough');
  let after = (await saved(page)).run!;
  expect(after.realm).toBe(1); expect(after.rewardKind).toBe('divine');
  expect(after.offers.every(c => CARDS[c.defId].category === 'divine')).toBe(true);
  await expect(page.locator('.progression-scene')).toBeVisible();
  await screenshot(page, 'controlled-breakthrough-receipt');
  await page.locator('.progression-scene > .primary-button').click();
  await screenshot(page, 'controlled-breakthrough-divine-reward');
  const divineId = after.offers[0].defId;
  await page.locator('.reward-scene .card-action').first().click();
  await expect.poll(async () => (await saved(page)).run?.rewardKind).toBe('foundation');
  await page.locator('.reward-scene .card-action').first().click(); await phase(page, 'road');
  after = (await saved(page)).run!; expect(after.deck.length).toBe(14);
  // Controlled opening order ensures the acquired Divine is drawable; activation itself uses the UI.
  const battle = controlledNode('combat', { realm: 1, cards: [divineId, 'strike', 'defense'] });
  await loadFixture(page, battle); await clickCard(page, divineId, false);
  await expect.poll(async () => (await saved(page)).run?.combat?.exhaust.some(c => c.defId === divineId)).toBe(true);
  expect((await saved(page)).run!.combat!.energy).toBeGreaterThanOrEqual(0);
});

test('controlled active-choice fixture: discard queue saves and resumes without replaying payment', async ({ page }) => {
  const run = controlledNode('combat', { cards: ['empty-sleeve', 'ragged-banner', 'strike', 'defense'] });
  await loadFixture(page, run); await clickCard(page, 'empty-sleeve', false);
  await expect(page.locator('dialog')).toBeVisible(); const pending = (await saved(page)).run!.combat!;
  expect(pending.choice?.kind).toBe('discard'); expect(pending.energy).toBe(2);
  await page.reload(); await page.getByRole('button', { name: 'Continue journey', exact: true }).click();
  await expect(page.locator('dialog')).toBeVisible();
  expect((await saved(page)).run!.combat).toEqual(pending);
  await page.locator('dialog [data-card="ragged-banner"] .card-face').click();
  await page.locator('dialog .primary-button').click();
  await expect.poll(async () => (await saved(page)).run?.combat?.choice).toBeNull();
  expect((await saved(page)).run!.combat!.energy).toBe(2);
});

test('controlled Tidal fixture: automatic Domain state choice and later end-turn state', async ({ page }) => {
  const run = controlledNode('combat', { cards: ['four-seas-return', 'defense', 'strike'] });
  await loadFixture(page, run); await clickCard(page, 'four-seas-return', false);
  await expect(page.locator('dialog .tidal-options button')).toHaveCount(3);
  await page.locator('dialog .tidal-options button').last().click();
  await expect.poll(async () => (await saved(page)).run?.combat?.tidal).toBe('raging');
  await page.locator('.end-turn').click(); await page.locator('dialog .tidal-options button').nth(1).click();
  await expect.poll(async () => (await saved(page)).run?.combat?.turn).toBe(2);
});

test('controlled death fixture: actual lethal action persists terminal death and history', async ({ page }) => {
  const run = controlledNode('combat', { hp: 2, cards: ['open-vein', 'defense'] });
  await loadFixture(page, run); await clickCard(page, 'open-vein', false); await phase(page, 'dead');
  const dead = await saved(page); expect(dead.meta.history).toHaveLength(1); expect(dead.meta.history[0].outcome).toBe('dead');
  expect(dead.run!.hp).toBe(0); await screenshot(page, 'controlled-permanent-death');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Continue journey', exact: true })).toHaveCount(0);
  expect((await saved(page)).run?.phase).toBe('dead');
  await page.getByRole('button', { name: 'Lives remembered', exact: true }).click();
  await expect(page.locator('.history-list article')).toHaveCount(1);
});

test('controlled final-Tribulation fixture: actual final hit ascends, persists and unlocks content', async ({ page }) => {
  const run = controlledNode('tribulation', { realm: 4, cards: ['strike', 'defense'] }); run.combat!.enemies[0].hp = 1;
  await loadFixture(page, run); await clickCard(page, 'strike'); await phase(page, 'ascended');
  const ascended = await saved(page); expect(ascended.meta.unlocks).toContain('spirit-realm-lore');
  expect(ascended.meta.history[0].outcome).toBe('ascended'); await screenshot(page, 'controlled-final-ascension');
  await page.reload(); expect((await saved(page)).run?.phase).toBe('ascended');
  await page.getByRole('button', { name: 'Continue journey', exact: true }).click();
  await expect(page.locator('.progression-scene')).toBeVisible();
  await page.locator('.progression-scene > .primary-button').dblclick();
  expect((await saved(page)).run!.gold).toBe(ascended.run!.gold);
  await expect(page.locator('.terminal-scene.ascended')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Continue journey', exact: true })).toHaveCount(0);
});


test('controlled save fixture: corrupted primary recovers the same committed mirror', async ({ page }) => {
  const run = controlledNode('combat', { cards: ['strike', 'defense'] }); await loadFixture(page, run);
  await clickCard(page, 'strike'); const committed = (await saved(page)).run!;
  await page.evaluate(key => localStorage.setItem(key, '{corrupted-primary'), SAVE_KEY);
  await page.reload(); await page.getByRole('button', { name: 'Continue journey', exact: true }).click();
  await expect(page.locator('.battle')).toBeVisible();
  // A safe new action repairs the primary from the authoritative mirror revision.
  await clickCard(page, 'defense', false);
  const recovered = (await saved(page)).run!;
  expect(recovered.combat!.enemies[0].hp).toBe(committed.combat!.enemies[0].hp);
  expect(recovered.combat!.actions).toHaveLength(committed.combat!.actions.length + 1);
});

test('controlled multi-tab fixture: committed actions synchronize before the next action', async ({ page, context }) => {
  const run = controlledNode('combat', { cards: ['strike', 'strike', 'defense'] }); await loadFixture(page, run);
  const second = await context.newPage(); const errors: string[] = [];
  second.on('pageerror', error => errors.push(error.message));
  second.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await second.goto('/'); await second.getByRole('button', { name: 'Continue journey', exact: true }).click();
  await clickCard(page, 'strike');
  await expect(second.locator('.hand-area [data-card="strike"]')).toHaveCount(1);
  await clickCard(second, 'strike');
  await expect(page.locator('.hand-area [data-card="strike"]')).toHaveCount(0);
  const after = (await saved(page)).run!;
  expect(after.combat!.enemies[0].hp).toBe(run.combat!.enemies[0].hp - 10);
  expect(after.combat!.actions).toHaveLength(2); expect(errors).toEqual([]);
  await second.close();
});


test('controlled storage-failure fixture: quota failure preserves the last committed combat', async ({ page }) => {
  const run = controlledNode('combat', { cards: ['strike', 'defense'] }); await loadFixture(page, run);
  const before = (await saved(page)).run!;
  await page.evaluate(() => { const nativeSet = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key.startsWith('heavenward')) throw new DOMException('Controlled test quota failure', 'QuotaExceededError'); return nativeSet.call(this, key, value); }; });
  await page.locator('.hand-area [data-card="defense"] .card-face').dblclick();
  await expect(page.locator('.save-error[role="alert"]')).toBeVisible();
  expect((await saved(page)).run).toEqual(before);
  await page.reload(); await page.getByRole('button', { name: 'Continue journey', exact: true }).click();
  await expect(page.locator('.battle')).toBeVisible(); expect((await saved(page)).run).toEqual(before);
});

function worstCaseRun(): Run {
  const run = controlledNode('combat', { realm: 4, enemies: ['cloud-beastmaster', 'restriction-soul', 'thunder-judge'], cards: ['heaven-earth-array', 'five-weapons-return', 'overwhelm-by-numbers', 'master-strategist', 'seven-star-array', 'mountain-seal', 'four-seas-return', 'scarlet-requiem', 'ashen-sun', 'unshaken-resolve'] });
  const combat = run.combat!; combat.energy = 8; combat.tidal = 'raging';
  combat.player.statuses = { strength: 5, protectiveQi: 5, fortify: 3, swordIntent: 10, tidalMomentum: 5, windMomentum: 2, regen: 3 };
  combat.summons = ['reed-wolf', 'thorn-vine', 'iron-crane'].map((id, i): Summon => {
    const def = SUMMONS[id]; return { id: `screenshot-summon-${i}`, defId: id, name: def.name, hp: def.hp, maxHp: def.hp, armor: 3, statuses: { strength: 2 }, attack: def.attack, automatic: def.automatic };
  });
  combat.powers = { refiningArmor: 2, swordFoundry: 2, regen: 3 };
  for (const enemy of combat.enemies) enemy.statuses = { vulnerable: 2, poison: 5, flame: 4, seed: 2, bleeding: 6, protectiveQi: 3 };
  for (const card of combat.hand) if (CARDS[card.defId].retain) card.retained = 3;
  return run;
}
async function assertTidalDoesNotCoverLife(page: Page){
  const overlaps=await page.evaluate(()=>{
    const badge=document.querySelector('.tidal-aura>span')!.getBoundingClientRect();
    const life=document.querySelector('.cultivator .life-bar')!.getBoundingClientRect();
    return Math.min(badge.right,life.right)>Math.max(badge.left,life.left)&&Math.min(badge.bottom,life.bottom)>Math.max(badge.top,life.top);
  });
  expect(overlaps,'Tidal state badge must leave the player life bar and HP text unobscured').toBe(false);
}
async function assertEncounterDoesNotCoverIntents(page: Page){
  const covered=await page.evaluate(async()=>{
    await document.fonts.ready;
    const range=document.createRange();range.selectNodeContents(document.querySelector('.battle-heading h1')!);
    const heading=range.getBoundingClientRect();
    return [...document.querySelectorAll('.enemy-intent')].filter(intent=>{
      const box=intent.getBoundingClientRect();
      return Math.min(heading.right,box.right)>Math.max(heading.left,box.left)&&Math.min(heading.bottom,box.bottom)>Math.max(heading.top,box.top);
    }).map(intent=>intent.textContent?.trim());
  });
  expect.soft(covered,'Enemy intent boxes must leave the encounter heading unobscured').toEqual([]);
  const collisions=await page.locator('.enemy-intent').evaluateAll(intents=>intents.flatMap((intent,i)=>{
    const a=intent.getBoundingClientRect();return intents.slice(i+1).filter(other=>{const b=other.getBoundingClientRect();return Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top);}).map(other=>[intent.textContent,other.textContent]);
  }));
  expect.soft(collisions,'Simultaneous enemy intents must not overlap each other').toEqual([]);

}

test('controlled worst-case screenshots: ten cards, three summons, three enemies, Tidal and statuses in EN/ZH', async ({ page, browser }) => {
  test.setTimeout(120_000);
  const run = worstCaseRun();
  for (const locale of ['en', 'zh-CN'] as const) for (const [width, height] of [[1280, 720], [1366, 768], [1920, 1080]]) {
    await page.setViewportSize({ width, height }); await loadFixture(page, run, locale);
    await expect(page.locator('.hand-area .game-card')).toHaveCount(10);
    await expect(page.locator('.summon')).toHaveCount(3); await expect(page.locator('.enemy')).toHaveCount(3);
    await expect(page.locator('.tidal-aura')).toBeVisible();
    await assertTidalDoesNotCoverLife(page);
    await assertEncounterDoesNotCoverIntents(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    expect(overflow, `No horizontal overflow at ${width}×${height} ${locale}`).toBe(false);
    await screenshot(page, `controlled-worst-${locale}-${width}x${height}`);
    await expect.soft(page.locator('.end-turn'), `End Turn fully visible: ${locale} ${width}x${height}`).toBeInViewport({ ratio: 1, timeout: 1000 });
    if(test.info().project.name==='chromium')await expect.soft(page).toHaveScreenshot(`battle-${locale==='zh-CN'?'zh':locale}-${width}x${height}.png`,{fullPage:true,animations:'disabled',maxDiffPixelRatio:.001});
    if(test.info().project.name==='chromium'&&locale==='en'&&width===1280){
      await page.locator('.hand-slot .card-face').first().hover();
      await expect.poll(()=>page.evaluate(()=>{
        const card=document.querySelector('.hand-slot .game-card')!,box=card.getBoundingClientRect();
        return document.elementFromPoint(box.right-12,box.top+box.height*.6)?.closest('.game-card')===card;
      }),'Hovered card remains in front of adjacent cards across its rules area').toBe(true);
      await page.screenshot({path:`${evidenceDirectory}/chromium-controlled-hover-en-1280x720.png`,fullPage:true,animations:'disabled'});
    }
  }
  const retina = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const retinaPage = await retina.newPage(); const retinaErrors: string[] = [];
  retinaPage.on('pageerror', error => retinaErrors.push(error.message));
  retinaPage.on('console', message => { if (message.type() === 'error') retinaErrors.push(message.text()); });
  await loadFixture(retinaPage, run); await screenshot(retinaPage, 'controlled-worst-en-1440x900-2x');
  await assertTidalDoesNotCoverLife(retinaPage);
  await assertEncounterDoesNotCoverIntents(retinaPage);
  await expect.soft(retinaPage.locator('.end-turn'), 'End Turn fully visible: high DPI').toBeInViewport({ ratio: 1, timeout: 1000 });
  if(test.info().project.name==='chromium')await expect.soft(retinaPage).toHaveScreenshot('battle-en-1440x900-2x.png',{fullPage:true,animations:'disabled',maxDiffPixelRatio:.001});
  expect(retinaErrors).toEqual([]);
  await retina.close();
});
