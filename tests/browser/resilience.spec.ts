// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { SAVE_KEY, type SaveData } from '../../src/game/save';
import { playCard } from '../../src/game/combat';

// Set RESILIENCE_ORIGIN=http://127.0.0.1:3211 to verify the static production export.
test.use({baseURL:process.env.RESILIENCE_ORIGIN??process.env.E2E_BASE_URL??'http://127.0.0.1:3210'});
async function saved(page:Page):Promise<SaveData>{return page.evaluate(key=>JSON.parse(JSON.parse(localStorage.getItem(key)!).payload),SAVE_KEY);}
function observe(page:Page){
 const javascriptErrors:string[]=[];const consoleErrors:ConsoleMessage[]=[];
 const failedAssets=new Map<string,string>();
 page.on('pageerror',error=>javascriptErrors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message);});
 page.on('requestfailed',request=>{if(['image','font'].includes(request.resourceType()))failedAssets.set(request.url(),request.failure()?.errorText??'unknown');});
 return{javascriptErrors,consoleErrors,failedAssets};
}
function assertOnlyInjectedAssetFailures(observation:ReturnType<typeof observe>,allowed:Set<string>){
 expect(observation.javascriptErrors,'No JavaScript exceptions, including under image/network failure').toEqual([]);
  // Browser resource-load diagnostics are expected only for the exact assets
 // failed by this test. Application console errors remain fatal.
 const unexpected=observation.consoleErrors.filter(message=>{
  const location=message.location().url;
  const fontSource=message.text().startsWith('[JavaScript Error: "downloadable font: download failed')?message.text().match(/ source: (https?:\/\/[^\s"]+)"\]$/)?.[1]:undefined;
  if(fontSource&&allowed.has(fontSource)&&observation.failedAssets.has(fontSource))return false;
  return !allowed.has(location)||!/(Failed to load resource|NS_ERROR|NetworkError|Load failed)/i.test(message.text());
 }).map(message=>({text:message.text(),location:message.location().url}));
 expect(unexpected,'Only intentionally failed decorative-resource diagnostics are allowed').toEqual([]);
 expect([...observation.failedAssets.keys()].every(url=>allowed.has(url)),'Every failed decorative asset was intentionally covered').toBe(true);
}
async function freshLifeToCombat(page:Page){
 await page.getByRole('button',{name:'Begin a new life',exact:true}).click();
 for(let round=0;round<2;round++){
  await expect(page.locator('.starting-offers .offer')).toHaveCount(5);
  await page.locator('.starting-offers .card-action').first().click();
  await expect.poll(async()=>{const data=await saved(page);return round===0?data.run?.startingRound:data.run?.phase;}).toBe(round===0?1:'road');
 }
 await page.locator('.node-combat').first().click();
 await expect(page.locator('.battle')).toBeVisible();
 await expect(page.locator('.hand-area .game-card')).toHaveCount(5);
 const before=(await saved(page)).run!.combat!;
 const card=before.hand.find(c=>c.defId==='strike')??before.hand.find(c=>c.defId==='defense')!;
 expect(card,'Ordinary starting deck supplies a playable Basic').toBeTruthy();
 const expected=playCard(before,card.uid,card.defId==='strike'?before.enemies[0].id:before.player.id);
 const face=page.locator(`.hand-area [data-card="${card.defId}"] .card-face`).first();
 await expect(face).toHaveAccessibleName(/Strike|Defense/);
 await expect(face.locator('.card-rules')).not.toBeEmpty();
 await expect(face.locator('.card-cost')).toBeVisible();
 if(card.defId==='strike'){await face.click();await page.locator('.enemy').first().click();}else await face.dblclick();
 await expect.poll(async()=>(await saved(page)).run!.combat!.actions.length).toBe(before.actions.length+1);
 expect((await saved(page)).run!.combat).toEqual(expected);
 await page.getByRole('button',{name:'简中',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('lang','zh-CN');
 await page.getByRole('button',{name:'VI',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('lang','vi');
 await page.getByRole('button',{name:'EN',exact:true}).click();
 expect((await saved(page)).run!.combat).toEqual(expected);
 await page.locator('.end-turn').click();
 await expect.poll(async()=>(await saved(page)).run!.combat!.turn).toBe(2);
}

test('resilience: intentionally failed artwork requests preserve named cards, rules and actual play',async({page},testInfo)=>{
 const observation=observe(page);const intentionallyFailed=new Set<string>();
 await page.route('**/art/**',async route=>{
  if(route.request().resourceType()!=='image')return route.continue();
  intentionallyFailed.add(route.request().url());await route.abort('failed');
 });
 await page.goto('/');await freshLifeToCombat(page);
 await expect.poll(()=>intentionallyFailed.size).toBeGreaterThan(0);
 await expect.poll(()=>observation.failedAssets.size).toBeGreaterThan(0);
 const surface=await page.locator('.hand-area .game-card').first().evaluate(element=>getComputedStyle(element).backgroundColor);
 expect(surface,'Cards retain their opaque fallback surface without artwork').not.toBe('rgba(0, 0, 0, 0)');
 await testInfo.attach('intentional-art-failures.json',{body:JSON.stringify({failed:[...observation.failedAssets],allowed:[...intentionallyFailed]},null,2),contentType:'application/json'});
 assertOnlyInjectedAssetFailures(observation,intentionallyFailed);
});

test('resilience: offline after boot supports fresh drafting, combat, locale switching and local commits',async({page,context},testInfo)=>{
 const observation=observe(page);const offlineAssets=new Set<string>();const runtimeRequests:string[]=[];let offline=false;
 page.on('request',request=>{
  if(!offline)return;
  const url=new URL(request.url());
  if(url.origin===new URL(page.url()).origin&&(request.resourceType()==='image'&&url.pathname.startsWith('/art/')||request.resourceType()==='font'&&url.pathname.startsWith('/_next/static/media/')))offlineAssets.add(request.url());
  else runtimeRequests.push(`${request.resourceType()} ${request.url()}`);
 });
 await page.goto('/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready.then(()=>undefined));
 await expect(page.getByRole('button',{name:'Begin a new life',exact:true})).toBeVisible();
 offline=true;await context.setOffline(true);expect(await page.evaluate(()=>navigator.onLine)).toBe(false);
 await freshLifeToCombat(page);
 expect(runtimeRequests,'Playing after boot requires no API, AI, data or script requests').toEqual([]);
 await testInfo.attach('offline-play-evidence.json',{body:JSON.stringify({navigatorOnLine:await page.evaluate(()=>navigator.onLine),runtimeRequests,failedDecorativeAssets:[...observation.failedAssets],committedTurn:(await saved(page)).run!.combat!.turn},null,2),contentType:'application/json'});
 assertOnlyInjectedAssetFailures(observation,offlineAssets);
 await context.setOffline(false);
});

test('resilience: pending audio activation never blocks a new life or combat',async({page})=>{
 const observation=observe(page);
 await page.addInitScript(()=>{
  const win=window as typeof window&{__resumeAttempts:number};win.__resumeAttempts=0;
  AudioContext.prototype.resume=()=>{win.__resumeAttempts++;return new Promise<void>(()=>{});};
 });
 await page.goto('/');await freshLifeToCombat(page);
 expect(await page.evaluate(()=>(window as typeof window&{__resumeAttempts:number}).__resumeAttempts)).toBe(1);
 assertOnlyInjectedAssetFailures(observation,new Set());
});

test('compatibility: a genuine frozen-v1 journey continues and survives explicit v2 archival',async({page},testInfo)=>{
 const observation=observe(page),legacyKey='heavenward.save.v1';
 await page.goto('/legacy/v1/index.html');
 await page.getByRole('button',{name:'Begin a new life',exact:true}).click();
 for(let round=0;round<2;round++){
  await expect(page.locator('.starting-offers .offer')).toHaveCount(5);
  await page.locator('.starting-offers .card-action').first().click();
  await expect.poll(()=>page.evaluate(({key,round})=>{const run=JSON.parse(JSON.parse(localStorage.getItem(key)!).payload).run;return round===0?run.startingRound:run.phase;},{key:legacyKey,round})).toBe(round===0?1:'road');
 }
 await page.locator('.node-combat').first().click();await expect(page.locator('.battle')).toBeVisible();
 const original=await page.evaluate(key=>localStorage.getItem(key),legacyKey);expect(original).toBeTruthy();
 const parsed=JSON.parse(JSON.parse(original!).payload);expect(parsed.version).toBe(1);expect(parsed.run.rulesVersion).toBe('human-0.1.0');
 await page.goto('/');await expect(page.getByRole('heading',{name:'Your saved journey uses the previous rules'})).toBeVisible();
 expect(await page.evaluate(key=>localStorage.getItem(key),legacyKey)).toBe(original);
 await page.getByRole('link',{name:'Continue previous version',exact:true}).click();
 await page.getByRole('button',{name:'Continue journey',exact:true}).click();await expect(page.locator('.battle')).toBeVisible();
 const basic=parsed.run.combat.hand.find((c:{defId:string})=>c.defId==='strike')??parsed.run.combat.hand.find((c:{defId:string})=>c.defId==='defense');
 expect(basic).toBeTruthy();await page.locator(`.hand-area [data-card="${basic.defId}"] .card-face`).first().click();if(basic.defId==='strike')await page.locator('.enemy').first().click();
 await expect.poll(()=>page.evaluate(key=>JSON.parse(JSON.parse(localStorage.getItem(key)!).payload).run.combat.actions.length,legacyKey)).toBe(parsed.run.combat.actions.length+1);
 const progressed=await page.evaluate(key=>localStorage.getItem(key),legacyKey);
 await page.goto('/');const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download original save',exact:true}).click();
 const download=await downloadPromise;expect(download.suggestedFilename()).toContain('diagnostic');
 const downloaded=JSON.parse(await readFile((await download.path())!,'utf8'));expect(downloaded.storage[legacyKey]).toBe(progressed);
 await page.getByRole('button',{name:'Preserve save & begin revised version',exact:true}).click();
 await expect(page.getByRole('button',{name:'Begin a new life',exact:true})).toBeVisible();
 const revised=await saved(page);expect(revised.version).toBe(2);expect(revised.run).toBeNull();
 const archived=await page.evaluate(key=>({original:localStorage.getItem(key),archives:Object.keys(localStorage).filter(k=>k.startsWith('heavenward.archive.v1.')).map(k=>JSON.parse(localStorage.getItem(k)!))}),legacyKey);
 expect(archived.original).toBe(progressed);expect(archived.archives.some(a=>a.snapshots[legacyKey]===progressed)).toBe(true);
 await testInfo.attach('legacy-compatibility.json',{body:JSON.stringify({legacyVersion:parsed.version,legacyRules:parsed.run.rulesVersion,continuedActions:parsed.run.combat.actions.length+1,revisedVersion:revised.version,originalRetained:archived.original===progressed,archiveCount:archived.archives.length}),contentType:'application/json'});
 assertOnlyInjectedAssetFailures(observation,new Set());
});
