import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { CARDS, REALMS } from '../../src/game/content';
import { playCard, validateCardPlay } from '../../src/game/combat';
import { chooseStarting, commitCombat, enterNode, getPendingProgression, instance, newRun, price, restHeal, roadLength, STAGES, updateMeta, type NodeKind, type Run } from '../../src/game/run';
import { encodeSave, freshSave, SAVE_KEY, validateSave, type SaveData } from '../../src/game/save';
import { tr } from '../../src/game/i18n';
import { ui } from '../../src/game/ui-copy';
import type { Locale } from '../../src/game/types';

const errors=new WeakMap<Page,string[]>();
test.beforeEach(({page})=>{const list:string[]=[];errors.set(page,list);page.on('pageerror',error=>list.push(error.message));});
test.afterEach(({page})=>expect(errors.get(page)).toEqual([]));
async function saved(page:Page):Promise<SaveData>{return page.evaluate(key=>JSON.parse(JSON.parse(localStorage.getItem(key)!).payload),SAVE_KEY);}
function initial(){let run=newRun(73271,1000);run=chooseStarting(run,run.offers[0].uid);return chooseStarting(run,run.offers[0].uid);}

/** Explicitly controlled, production-validator-accepted states. These verify UI
 * and persistence, not ordinary acquisition, difficulty or human session time. */
function fixture(kind:NodeKind='combat',size=12,depth=kind==='tribulation'?roadLength(0)-1:kind==='combat'?0:1):Run{
 const run=initial();run.depth=depth;run.gold=2000;
 const pool=Object.values(CARDS).filter(card=>!['divine','token','status'].includes(card.category));
 const opening=['strike','defense','wind-step'];
 run.deck=Array.from({length:size},(_,index)=>instance(run,opening[index]??(size>100?pool[(index-3)%pool.length].id:'defense'),0));
 run.nodes=[{id:`incremental-${kind}-${depth}`,kind,encounter:['combat','elite','tribulation'].includes(kind)?[kind==='tribulation'?'cloud-beastmaster':'road-bandit']:undefined}];
 const next=enterNode(run,run.nodes[0].id);
 if(next.combat){next.combat.hand=structuredClone(next.deck.slice(0,3));next.combat.draw=structuredClone(next.deck.slice(3));next.combat.discard=[];next.combat.exhaust=[];}
 return next;
}
function won(kind:'combat'|'tribulation'='combat',size=12){
 const run=fixture(kind,size);const combat=run.combat!;
 // A one-HP enemy is the only accelerated win condition. The actual attack,
 // reward generation, realm grants and receipt are produced by production code.
 combat.enemies[0].hp=1;combat.enemies[0].armor=0;combat.enemies[0].statuses={};
 run.hp=combat.player.hp=30;
 return {before:structuredClone(run),run:commitCombat(run,playCard(combat,combat.hand[0].uid,combat.enemies[0].id))};
}
async function load(page:Page,run:Run,locale:Locale='en'){
 const data=freshSave();data.revision=1;data.run=run;data.meta=updateMeta(data.meta,run,1000);
 data.settings={...data.settings,locale,tutorial:false,music:0,sfx:0,reducedMotion:true};
 expect(validateSave(data),`valid controlled ${run.phase} state`).toBe(true);
 await page.goto('/');
 await page.evaluate(({key,value})=>{localStorage.clear();localStorage.setItem(key,value);localStorage.setItem(`${key}.mirror`,value);localStorage.setItem(`${key}.head`,'1');},{key:SAVE_KEY,value:encodeSave(data)});
 await page.reload();await resume(page);
}
async function resume(page:Page){await page.locator('.menu-options .primary-button').click();}
const face=(page:Page,id:string)=>page.locator(`.hand-area [data-card="${id}"] .card-face`).first();
async function shot(page:Page,name:string){
 const directory='artifacts/revision/screenshots';await mkdir(directory,{recursive:true});
 await page.mouse.move(2,2);await page.screenshot({path:`${directory}/incremental-${test.info().project.name}-${name}.png`,fullPage:true,animations:'disabled'});
}

test('enemy double-click only selects; Escape and Cancel leave the saved combat unchanged',async({page})=>{
 await load(page,fixture());const before=await saved(page);
 await face(page,'strike').dblclick();
 await expect(page.locator('.hand-area [data-card="strike"]')).toHaveClass(/selected/);
 await expect(page.locator('.battle-decision')).toContainText(ui('en','enemyTarget'));
 expect(await saved(page)).toEqual(before);
 await page.keyboard.press('Escape');await expect(page.locator('.hand-area .selected')).toHaveCount(0);expect(await saved(page)).toEqual(before);
 await face(page,'strike').dblclick();await page.locator('.battle-decision').getByRole('button',{name:/Cancel/}).click();
 await expect(page.locator('.hand-area .selected')).toHaveCount(0);expect(await saved(page)).toEqual(before);
});

test('self double-click commits one play and pays its cost once',async({page})=>{
 await load(page,fixture());const before=await saved(page),uid=before.run!.combat!.hand.find(card=>card.defId==='defense')!.uid;
 await face(page,'defense').dblclick();
 await expect.poll(async()=>(await saved(page)).run!.combat!.playHistory.length).toBe(1);
 const after=await saved(page),combat=after.run!.combat!;
 expect(validateSave(after)).toBe(true);expect(after.revision).toBe(before.revision+1);
 expect(combat.playHistory[0]).toMatchObject({uid,defId:'defense',actualCost:1});
 expect(combat.player.armor).toBe(5);expect(combat.energy).toBe(before.run!.combat!.energy-1);
 expect(combat.hand.some(card=>card.uid===uid)).toBe(false);expect(combat.discard.filter(card=>card.uid===uid)).toHaveLength(1);
});

test('wrong targets are reported before cost; zero-energy cards remain draggable and cost0 at0 works',async({page})=>{
 const run=fixture();run.combat!.energy=0;await load(page,run);const before=await saved(page),combat=run.combat!;
 for(const id of ['strike','defense'])await expect(face(page,id)).toHaveAttribute('draggable','true');
 const defense=combat.hand.find(card=>card.defId==='defense')!,strike=combat.hand.find(card=>card.defId==='strike')!;
 const selfError=validateCardPlay(combat,defense.uid,combat.enemies[0].id)!;
 expect(selfError.en).toMatch(/you|self|portrait/i);expect(selfError.en).not.toMatch(/Dao Yuan|energy/i);
 await face(page,'defense').dragTo(page.locator('.enemy').first());await expect(page.getByRole('status')).toHaveText(selfError.en);expect(await saved(page)).toEqual(before);
 const enemyError=validateCardPlay(combat,strike.uid,combat.player.id)!;
 expect(enemyError.en).toMatch(/enemy/i);expect(enemyError.en).not.toMatch(/Dao Yuan|energy/i);
 await face(page,'strike').dragTo(page.locator('.cultivator'));await expect(page.getByRole('status')).toHaveText(enemyError.en);expect(await saved(page)).toEqual(before);
 const costError=validateCardPlay(combat,defense.uid,combat.player.id)!;
 expect(costError.en).toMatch(/Dao Yuan|energy/i);
 await face(page,'defense').dragTo(page.locator('.cultivator'));await expect(page.getByRole('status')).toHaveText(costError.en);expect(await saved(page)).toEqual(before);
 await expect(page.locator('.hand-area [data-card="wind-step"] .card-cost')).toHaveText('0');
 await face(page,'wind-step').dblclick();await expect.poll(async()=>(await saved(page)).run!.combat!.playHistory.length).toBe(1);
 const after=(await saved(page)).run!.combat!;expect(after.energy).toBe(0);expect(after.nextWindDiscount).toBe(1);expect(after.playHistory[0].defId).toBe('wind-step');
});

test('105-card decks buy, acquire and Skip without replacement or a maximum',async({page})=>{
 const merchant=fixture('merchant',105);await load(page,merchant);const offer=merchant.offers[0];
 await page.locator('.shop-stock .card-action').first().click();await expect.poll(async()=>(await saved(page)).run!.deck.length).toBe(106);
 let after=(await saved(page)).run!;
 expect(after.gold).toBe(merchant.gold-price(offer));expect(after.shop.purchased).toContain(offer.uid);
 expect(after.deck.map(card=>card.uid)).toEqual([...merchant.deck.map(card=>card.uid),offer.uid]);await expect(page.getByRole('dialog')).toHaveCount(0);
 const reward=won('combat',105).run;await load(page,reward);const chosen=reward.offers[0];
 await page.locator('.reward-scene .card-action').first().click();await expect.poll(async()=>(await saved(page)).run!.phase).toBe('road');
 after=(await saved(page)).run!;expect(after.deck.map(card=>card.uid)).toEqual([...reward.deck.map(card=>card.uid),chosen.uid]);await expect(page.getByRole('dialog')).toHaveCount(0);
 await load(page,reward);await page.getByRole('button',{name:tr('en','skip'),exact:true}).click();await expect.poll(async()=>(await saved(page)).run!.phase).toBe('road');
 expect((await saved(page)).run!.deck).toEqual(reward.deck);await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('large permanent deck remains browsable in all three locales',async({page})=>{
 test.setTimeout(45000);const run=fixture('merchant',105);
 for(const locale of ['en','zh-CN','vi'] as const){
  await load(page,run,locale);const before=(await saved(page)).run;
  await page.locator('.run-resources button').click();await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('dialog .game-card')).toHaveCount(run.deck.length);
  await expect(page.locator('dialog .collection-controls')).toContainText(`${run.deck.length} / ${run.deck.length}`);
  await expect(page.locator('dialog .dialog-note')).toContainText(ui(locale,'noDeckMaximum'));
  expect(await page.locator('body').evaluate(element=>element.scrollWidth<=window.innerWidth+1)).toBe(true);
  await shot(page,`large-deck-${locale}`);
  await page.getByLabel(tr(locale,'search'),{exact:true}).fill(CARDS['scarlet-requiem'].name[locale]);
  await expect(page.locator('dialog .game-card')).toHaveCount(run.deck.filter(card=>card.defId==='scarlet-requiem').length);
  expect((await saved(page)).run).toEqual(before);
 }
});

test('major receipt shows committed grants, survives reload, and allows Continue then Skip below the new removal floor',async({page})=>{
 const completed=won('tribulation'),run=completed.run,receipt=getPendingProgression(run)!;
 expect(receipt.kind).toBe('major');expect(run.maxHp-completed.before.maxHp).toBe(receipt.grants.maxHp);
 expect(run.hp-completed.before.hp).toBe(receipt.grants.healing);expect(run.gold-completed.before.gold).toBe(receipt.grants.gold);
 await load(page,run);await expect(page.locator('.progression-scene')).toBeVisible();await expect(page.locator('.reward-scene')).toHaveCount(0);
 await expect(page.locator('.progression-route')).toContainText(`${REALMS[receipt.from.realm].name.en} · ${STAGES[receipt.from.stage].en}`);
 await expect(page.locator('.progression-route')).toContainText(`${REALMS[receipt.to!.realm].name.en} · ${STAGES[receipt.to!.stage].en}`);
 await expect(page.locator('.progression-gold')).toHaveText(ui('en','receivedStones',{n:receipt.grants.gold}));
 for(const [before,after] of [[receipt.before.maxHp,receipt.after.maxHp],[receipt.before.hp,receipt.after.hp],[receipt.before.energy,receipt.after.energy]])await expect(page.locator('.progression-rewards dl')).toContainText(`${before} → ${after}`);
 const preserved=(await saved(page)).run;await page.reload();await resume(page);expect((await saved(page)).run).toEqual(preserved);
 await expect(page.locator('.progression-scene')).toBeVisible();await shot(page,'major-receipt');
 await page.locator('.progression-scene .primary-button').dblclick();await expect(page.locator('.reward-scene .offer')).toHaveCount(receipt.pendingChoices!.count);
 let after=(await saved(page)).run!;expect(after.hp).toBe(run.hp);expect(after.maxHp).toBe(run.maxHp);expect(after.gold).toBe(run.gold);expect(after.deck).toEqual(run.deck);
 await page.reload();await resume(page);await expect(page.locator('.progression-scene')).toHaveCount(0);
 await page.getByRole('button',{name:tr('en','skip'),exact:true}).click();await expect.poll(async()=>(await saved(page)).run!.rewardKind).toBe('foundation');
 await expect(page.locator('.reward-scene')).toContainText(tr('en','foundationHint'));
 await page.getByRole('button',{name:tr('en','skip'),exact:true}).click();await expect.poll(async()=>(await saved(page)).run!.phase).toBe('road');
 after=(await saved(page)).run!;expect(after.deck).toEqual(run.deck);expect(after.deck.length).toBeLessThan(REALMS[after.realm].minDeck);
 expect(after.hp).toBe(run.hp);expect(after.maxHp).toBe(run.maxHp);expect(after.gold).toBe(run.gold);expect(getPendingProgression(after)).toBeNull();
 expect(after.progressionReceipts.filter(item=>item.kind==='major')).toHaveLength(1);
});

test('minor stage notice shows from and to with no fabricated stat grant, and dismisses durably',async({page})=>{
 const rest=fixture('rest');rest.hp=30;const run=restHeal(rest),receipt=getPendingProgression(run)!;
 expect(receipt.kind).toBe('minor');expect(Object.values(receipt.grants).every(value=>value===0)).toBe(true);
 await load(page,run);await expect(page.locator('.stage-notice')).toBeVisible();await expect(page.locator('.progression-scene')).toHaveCount(0);
 await expect(page.locator('.stage-notice')).toContainText(`${REALMS[receipt.from.realm].name.en} · ${STAGES[receipt.from.stage].en}`);
 await expect(page.locator('.stage-notice')).toContainText(`${REALMS[receipt.to!.realm].name.en} · ${STAGES[receipt.to!.stage].en}`);
 await expect(page.locator('.stage-notice')).toContainText(ui('en','noStats'));await shot(page,'minor-notice');
 const before=(await saved(page)).run!;await page.locator('.stage-notice button').click();await expect(page.locator('.stage-notice')).toHaveCount(0);
 const after=(await saved(page)).run!;expect(after.hp).toBe(before.hp);expect(after.gold).toBe(before.gold);expect(after.realm).toBe(before.realm);expect(after.deck).toEqual(before.deck);expect(getPendingProgression(after)).toBeNull();
 await page.reload();await resume(page);await expect(page.locator('.stage-notice')).toHaveCount(0);
});
