import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const origin = 'https://heavenward.vercel.app';
const directory = 'artifacts/deployment/live-0.3';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const saved = () => page.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('heavenward.save.v2')).payload));
const report = { origin, executedAt: new Date().toISOString(), method: 'Fresh isolated profile; ordinary UI only; browser save read for assertions, never injected or edited', passed: false, checks: [], screenshots: [] };
try {
  await page.goto(origin);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('button', { name: 'Begin a new life', exact: true }).click();
  await page.locator('.starting-offers .card-action').first().click();
  await expect.poll(async () => (await saved()).run.startingRound).toBe(1);
  await page.locator('.starting-offers .card-action').first().click();
  await page.locator('.node-combat').first().click();
  await expect(page.locator('.hand-area .game-card')).toHaveCount(5);
  const before = (await saved()).run.combat;
  const strike = page.locator('.hand-area [data-card="strike"] .card-face').first();
  if (await strike.count()) {
    await strike.dblclick();
    assert.deepEqual((await saved()).run.combat, before, 'Enemy double click selects without resolving');
    await page.locator('.enemy').first().click();
    report.checks.push('Enemy double-click selects, target click commits');
  } else {
    await page.locator('.hand-area [data-card="defense"] .card-face').first().dblclick();
    report.checks.push('Self double-click commits');
  }
  await expect.poll(async () => (await saved()).run.combat.actions.length).toBe(before.actions.length + 1);
  const afterPlay = (await saved()).run.combat;
  assert.equal(afterPlay.energy, before.energy - 1);
  assert.equal(afterPlay.hand.length, before.hand.length - 1);
  report.checks.push('Actual Basic play consumes one card, one energy, one committed action');
  await page.keyboard.press('e');
  await expect.poll(async () => (await saved()).run.combat.turn).toBe(before.turn + 1);
  report.checks.push('End Turn resolves enemies and opens the next player turn');
  for (const [locale, label] of [['en', 'EN'], ['zh-CN', '简中'], ['vi', 'VI']]) {
    const beforeLanguage = (await saved()).run;
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    assert.deepEqual((await saved()).run, beforeLanguage, 'Language must preserve gameplay and RNG');
    await page.evaluate(async () => {
      await document.fonts.ready;
      const urls = [...document.querySelectorAll('.portrait, .card-art')].map(element => getComputedStyle(element).backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1]).filter(Boolean);
      await Promise.all(urls.map(url => new Promise((resolve, reject) => {
        const image = new Image(); image.onload = resolve; image.onerror = () => reject(new Error(`Visible art failed to load: ${url}`)); image.src = url;
      })));
    });
    await page.mouse.move(4, 4);
    await page.screenshot({ path: `${directory}/combat-${locale}.png`, fullPage: true, animations: 'disabled' });
    report.screenshots.push(`${directory}/combat-${locale}.png`);
  }
  report.checks.push('English, Chinese and Vietnamese preserve gameplay and RNG; all photographed');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  const beforeReload = (await saved()).run;
  await page.reload();
  await page.getByRole('button', { name: 'Continue journey', exact: true }).click();
  await expect(page.locator('.battle')).toBeVisible();
  assert.deepEqual((await saved()).run, beforeReload);
  report.checks.push('Reload and Continue preserve the played turn exactly');
  assert.deepEqual(errors, []);
  report.checks.push('No console errors or JavaScript exceptions');
  report.passed = true;
} catch (error) {
  report.error = String(error);
  await page.screenshot({ path: `${directory}/failure.png`, fullPage: true }).catch(() => {});
  process.exitCode = 1;
} finally {
  report.errors = errors;
  await writeFile(`${directory}/results.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
