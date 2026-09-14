import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { SUMMONS } from '../../src/game/content';
import { chooseStarting, newRun, instance, enterNode, commitCombat, updateMeta, roadLength, type Run, type NodeKind } from '../../src/game/run';
import { playCard, endTurn } from '../../src/game/combat';
import { freshSave, encodeSave, validateSave, SAVE_KEY, type SaveData } from '../../src/game/save';
import type { Locale, Summon } from '../../src/game/types';

const evidence='artifacts/revision/screenshots';
const errors=new WeakMap<Page,string[]>();
test.beforeEach(({page})=>{const list:string[]=[];errors.set(page,list);page.on('pageerror',e=>list.push(e.message));});
test.afterEach(({page})=>expect(errors.get(page)).toEqual([]));
async function saved(page:Page):Promise<SaveData>{return page.evaluate(key=>JSON.parse(JSON.parse(localStorage.getItem(key)!).payload),SAVE_KEY);}
function initial(){let r=newRun(9411,1000);r=chooseStarting(r,r.offers[0].uid);return chooseStarting(r,r.offers[0].uid);}
/** Explicit save-valid controlled states verify presentation and persistence, never balance or human timing. */
function fixture(kind:NodeKind='combat',ids=['strike','defense','wind-step','wind-slash','chasing-blade','flowing-guard','inner-sight','empty-sleeve','measured-practice','crucible-shell']):Run{
 const r=initial();r.depth=kind==='tribulation'?roadLength(0)-1:kind==='combat'?0:1;r.gold=300;
 r.deck=Array.from({length:12},(_,i)=>instance(r,ids[i]??(i%2?'defense':'strike'),0));
 r.nodes=[{id:'revision-controlled',kind,encounter:['combat','elite','tribulation'].includes(kind)?[kind==='tribulation'?'cloud-beastmaster':'road-bandit']:undefined}];
 const next=enterNode(r,r.nodes[0].id);
 if(next.combat){next.combat.hand=structuredClone(next.deck.slice(0,Math.min(10,ids.length)));next.combat.draw=structuredClone(next.deck.slice(next.combat.hand.length));next.combat.discard=[];next.combat.exhaust=[];}
 return next;
}
async function load(page:Page,run:Run,locale:Locale='en'){
 const data=freshSave();data.revision=1;data.run=run;data.meta=updateMeta(data.meta,run,1000);data.settings={...data.settings,locale,tutorial:false,music:0,sfx:0,reducedMotion:true};
 expect(validateSave(data),`valid fixture ${run.phase}`).toBe(true);
 await page.goto('/');await page.evaluate(({key,value})=>{localStorage.clear();localStorage.setItem(key,value);localStorage.setItem(`${key}.mirror`,value);localStorage.setItem(`${key}.head`,'1');},{key:SAVE_KEY,value:encodeSave(data)});await page.reload();await page.locator('.menu-options .primary-button').click();
}
async function shot(page:Page,name:string){await mkdir(evidence,{recursive:true});await page.mouse.move(2,2);await page.screenshot({path:`${evidence}/${test.info().project.name}-${name}.png`,fullPage:true,animations:'disabled'});}
const face=(page:Page,id:string)=>page.locator(`.hand-area [data-card="${id}"] .card-face`).first();
async function commitPlay(page:Page,id:string,self=false){const before=(await saved(page)).revision;await face(page,id).click();await page.locator(self?'.cultivator':'.enemy').first().click();await expect.poll(async()=>(await saved(page)).revision).toBeGreaterThan(before);}

test('grade preferences are display-only, persistent and shared with inspection',async({page})=>{
 await load(page,fixture());const before=(await saved(page)).run;
 await expect(page.locator('.hand-area [data-card="strike"] .card-type').first()).toContainText('Grade 1');
 await page.getByRole('button',{name:'Settings',exact:true}).click();
 await page.getByLabel('Card grade display').selectOption('letters');await expect(page.locator('.grade-scale')).toContainText('F → E → D → C → B → A → S → SS');
 await page.getByRole('button',{name:'Close',exact:true}).click();await expect(page.locator('.hand-area [data-card="strike"] .card-type').first()).toContainText('F');expect((await saved(page)).run).toEqual(before);
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByLabel('Card grade display').selectOption('traditional');await page.getByRole('button',{name:'Close',exact:true}).click();await expect(page.locator('.hand-area [data-card="strike"] .card-type').first()).toContainText('Ding');
 await page.reload();await page.locator('.menu-options .primary-button').click();expect((await saved(page)).settings.gradeDisplay).toBe('traditional');expect((await saved(page)).run).toEqual(before);
});

test('self and enemy drop targets validate before commit; no-energy cards remain draggable',async({page})=>{
 const r=fixture();await load(page,r);let before=(await saved(page)).run;
 await face(page,'defense').dragTo(page.locator('.enemy').first());await expect(page.getByRole('status')).toContainText('targets you');expect((await saved(page)).run).toEqual(before);
 await face(page,'strike').dragTo(page.locator('.cultivator'));await expect(page.getByRole('status')).toContainText('living enemy');expect((await saved(page)).run).toEqual(before);
 await face(page,'defense').click();expect((await saved(page)).run).toEqual(before);await face(page,'defense').dblclick();await expect.poll(async()=>(await saved(page)).run!.combat!.player.armor).toBe(5);
 before=(await saved(page)).run;expect(before!.combat!.playHistory).toHaveLength(1);
 const poor=fixture();poor.combat!.energy=0;await load(page,poor);before=(await saved(page)).run;await expect(face(page,'strike')).toHaveAttribute('draggable','true');await face(page,'strike').dragTo(page.locator('.enemy').first());await expect(page.getByRole('status')).toContainText('Dao Yuan');expect((await saved(page)).run).toEqual(before);
});

test('Pursuit feedback follows committed order and discounts never consume inspection',async({page})=>{
 await load(page,fixture());const before=(await saved(page)).run!;await page.locator('[data-card="wind-step"] .inspect-button').click();await page.getByRole('button',{name:'Close',exact:true}).first().click();expect((await saved(page)).run).toEqual(before);
 await commitPlay(page,'wind-step',true);await expect(page.locator('[data-card="wind-slash"] .card-cost')).toHaveText('0');await expect(page.locator('[data-card="wind-slash"] .pursuit-state')).toContainText('Condition met');
 await commitPlay(page,'strike');await expect(page.locator('[data-card="chasing-blade"] .pursuit-state')).toContainText('Condition met');
 await shot(page,'pursuit-ready');await commitPlay(page,'chasing-blade');const c=(await saved(page)).run!.combat!;expect(c.playHistory.map(p=>p.ordinal)).toEqual([1,2,3]);expect(c.playHistory[2].actualCost).toBe(0);expect(c.nextWindDiscount).toBe(0);
});

test('five rewards persist through inspection, languages and reload; one choice commits once',async({page})=>{
 const r=fixture('combat',['strike','defense']);r.combat!.enemies[0].hp=1;const won=playCard(r.combat!,r.combat!.hand[0].uid,r.combat!.enemies[0].id);const reward=commitCombat(r,won);await load(page,reward);
 await expect(page.locator('.reward-scene .offer')).toHaveCount(5);const before=(await saved(page)).run!;expect(new Set(before.offers.map(c=>c.defId)).size).toBe(5);
 for(const language of ['VI','简中','EN']){await page.getByRole('button',{name:language,exact:true}).click();await page.locator('.reward-scene .inspect-button').first().click();await page.locator('dialog .dialog-heading button').click();expect((await saved(page)).run).toEqual(before);await shot(page,`reward-${language==='VI'?'vi':language==='简中'?'zh-CN':'en'}`);}
 await page.reload();await page.locator('.menu-options .primary-button').click();expect((await saved(page)).run).toEqual(before);
 await page.locator('.reward-scene .card-action').first().dblclick();await expect.poll(async()=>(await saved(page)).run!.phase).toBe('road');expect((await saved(page)).run!.deck.length).toBe(before.deck.length+1);
});

test('Merchant upgrade and sale pickers preview without mutation and commit once',async({page})=>{
 const r=fixture('merchant');r.deck.push(instance(r,'strike',0));await load(page,r);const before=(await saved(page)).run!;
 await page.getByRole('button',{name:/Choose a card to refine/}).click();await expect(page.locator('.visual-picker .picker-option')).toHaveCount(13);await page.locator('.visual-picker .card-action').first().click();await expect(page.locator('.comparison .game-card')).toHaveCount(2);expect((await saved(page)).run).toEqual(before);await shot(page,'upgrade-compare-en');
 await page.getByRole('button',{name:'Choose another card',exact:true}).click();await page.locator('dialog .dialog-heading button').click();expect((await saved(page)).run).toEqual(before);
 await page.getByRole('button',{name:/Choose a card to refine/}).click();await page.locator('.visual-picker .card-action').first().click();await page.getByRole('button',{name:/Confirm refinement/}).dblclick();await expect.poll(async()=>(await saved(page)).run!.shop.upgraded).toBe(1);let after=(await saved(page)).run!;expect(after.gold).toBe(before.gold-35);expect(after.deck[0].grade).toBe(1);expect(after.deck[1].grade).toBe(0);
 await page.getByRole('button',{name:/Choose a card to sell/}).click();await page.locator('.visual-picker .card-action').last().click();await expect(page.locator('.sale-confirm')).toContainText('13 → 12');await shot(page,'sale-confirm-en');await page.locator('.sale-confirm .danger-button').click();await expect.poll(async()=>(await saved(page)).run!.shop.sold).toBe(1);after=(await saved(page)).run!;expect(after.deck).toHaveLength(12);
 await page.getByRole('button',{name:/Choose a card to sell/}).click();await expect(page.locator('.visual-picker .card-action').first()).toBeDisabled();
});

test('Rest full HP shows zero; cancelling either preview preserves mutually exclusive action',async({page})=>{
 await load(page,fixture('rest'));const before=(await saved(page)).run!;await expect(page.locator('.rest-healing')).toContainText('heals 0');await page.locator('.rest-healing').click();expect((await saved(page)).run).toEqual(before);await page.getByRole('button',{name:'Return',exact:true}).click();
 await page.locator('.rest-refining').click();await page.locator('.visual-picker .card-action').first().click();await page.locator('dialog .dialog-heading button').click();expect((await saved(page)).run).toEqual(before);
 await page.locator('.rest-refining').click();await page.locator('.visual-picker .card-action').first().click();await page.getByRole('button',{name:/Confirm refinement/}).click();await expect.poll(async()=>(await saved(page)).run!.phase).toBe('road');expect((await saved(page)).run!.gold).toBe(before.gold);expect((await saved(page)).run!.deck[0].grade).toBe(1);
});

test('Dao Road renders only immediate branches and completed history',async({page})=>{
 const r=initial();await load(page,r);await expect(page.locator('.branch-node')).toHaveCount(r.nodes.length);const text=await page.locator('.branch-map').innerText();expect(text).not.toContain('road-bandit');expect((await saved(page)).run!.nodes.map(n=>n.id)).toEqual(r.nodes.map(n=>n.id));
 for(const language of ['VI','简中','EN']){await page.getByRole('button',{name:language,exact:true}).click();await shot(page,`map-${language==='VI'?'vi':language==='简中'?'zh-CN':'en'}`);}
 await page.locator('.branch-node').last().click();await expect.poll(async()=>(await saved(page)).run!.phase).toBe('combat');expect((await saved(page)).run!.current!.id).toBe(r.nodes.at(-1)!.id);
});

test('negative cards and three summons have readable trilingual inspection on laptop and narrow layouts',async({page})=>{
 const r=fixture();const c=r.combat!;c.draw.unshift(...c.hand.splice(7));c.hand.push({uid:'temp-qi',defId:'qi-disorder',grade:0,retained:0},{uid:'temp-injury',defId:'internal-injury',grade:0,retained:0},{uid:'temp-heart',defId:'heart-demon',grade:0,retained:0});
 c.player.statuses={strength:10,weak:1,protectiveQi:5,swordIntent:3};c.summons=['reed-wolf','thorn-vine','treant'].map((id,i)=>{const d=SUMMONS[id];return{id:`ally-${i}`,defId:id,name:d.name,hp:d.hp,maxHp:d.hp,armor:0,statuses:{},attack:d.attack,automatic:d.automatic} as Summon;});
 for(const locale of ['en','zh-CN','vi'] as const){await load(page,r,locale);await expect(page.locator('.hand-area .game-card')).toHaveCount(10);await expect(page.locator('.summon')).toHaveCount(3);await shot(page,`ten-hand-${locale}`);await page.locator('[data-card="qi-disorder"] .inspect-button').click();await expect(page.locator('.inspection')).toBeVisible();await shot(page,`status-inspect-${locale}`);await page.locator('dialog .dialog-heading button').click();await page.locator('.statuses .keyword-trigger').first().focus();await expect(page.locator('.keyword-tooltip')).toBeVisible();const rect=await page.locator('.keyword-tooltip').boundingBox();expect(rect!.x).toBeGreaterThanOrEqual(0);expect(rect!.y).toBeGreaterThanOrEqual(0);await page.keyboard.press('Escape');}
 await page.setViewportSize({width:390,height:844});await load(page,r,'vi');await shot(page,'ten-hand-vi-narrow');await page.locator('[data-card="internal-injury"] .inspect-button').click();await shot(page,'long-status-vi-narrow');expect(await page.locator('body').evaluate(e=>e.scrollWidth<=window.innerWidth+1)).toBe(true);
});

test('Cloud Warning exposes next heavy threat and has a real preparation turn',async({page})=>{
 let r=fixture('tribulation',['strike','defense']);for(let i=0;i<3;i++)r=commitCombat(r,endTurn(r.combat!));expect(r.combat!.enemies[0].intentIndex).toBe(3);await load(page,r);await expect(page.locator('.warning-value')).toContainText('26');const before=(await saved(page)).run!.hp;
 await page.locator('.enemy-intent .keyword-trigger').first().click();await expect(page.locator('.keyword-tooltip')).toContainText('50%');await shot(page,'cloud-warning-en');await page.keyboard.press('Escape');await page.getByRole('button',{name:/End turn/}).click();await expect.poll(async()=>(await saved(page)).run!.combat!.turn).toBe(5);expect((await saved(page)).run!.hp).toBe(before);
});

test('another tab committing the selected card cannot crash stale targeting',async({page,context})=>{
 await load(page,fixture());const second=await context.newPage();await second.goto('/');await second.locator('.menu-options .primary-button').click();await face(page,'strike').click();await commitPlay(second,'strike');await expect.poll(async()=>(await saved(page)).run!.combat!.playHistory.length).toBe(1);await expect(page.locator('.battle')).toBeVisible();await face(page,'defense').dblclick();await expect.poll(async()=>(await saved(page)).run!.combat!.playHistory.length).toBe(2);await second.close();
});

test('touch inspection is deliberate and cannot play or buy a card',async({browser},info)=>{
 test.skip(info.project.name!=='chromium','Touch-specific browser context is verified in Chromium; keyboard/mouse flows run in every engine.');
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();
 for(const locale of ['en','zh-CN','vi'] as const){await load(page,fixture('merchant'),locale);const before=(await saved(page)).run;await page.locator('.shop-stock .inspect-button').first().tap();await expect(page.locator('.inspection')).toBeVisible();expect((await saved(page)).run).toEqual(before);await shot(page,`touch-shop-inspect-${locale}`);await page.locator('dialog .dialog-heading button').tap();}
 await load(page,fixture(),'vi');const before=(await saved(page)).run;await page.locator('.hand-area .inspect-button').first().tap();await expect(page.locator('.inspection')).toBeVisible();expect((await saved(page)).run).toEqual(before);await context.close();
});

test('Cloud Command shows its aggregate threat without being labeled an Attack',async({page})=>{
 let r=fixture('tribulation',['strike','defense']);for(let i=0;i<2;i++)r=commitCombat(r,endTurn(r.combat!));expect(r.combat!.enemies[0].intentIndex).toBe(2);await load(page,r);await expect(page.locator('.enemy-intent').first()).toContainText('Command: 10');await shot(page,'cloud-command-en');
});

test('real touch drags share target and cost validation and cancel on empty space',async({browser},info)=>{
 test.skip(info.project.name!=='chromium','Actual touch protocol is verified in Chromium; mouse and keyboard paths run in all three engines.');
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();const session=await context.newCDPSession(page);
 const issues:string[]=[];page.on('pageerror',e=>issues.push(e.message));
 async function drag(id:string,target:'.enemy'|'.cultivator'|null){
  const card=face(page,id);await card.scrollIntoViewIfNeeded();
  const box=(await card.boundingBox())!,x=box.x+box.width/2,y=Math.min(820,box.y+box.height/2);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-20}]});
  if(target){
   // A finger reaching the top scrolls the battle so its Avatar can be reached.
   for(let i=0;i<25&&await page.evaluate(()=>window.scrollY)>0;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:110+i%2,y:25}]});
   const end=(await page.locator(target).first().boundingBox())!;
   await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:end.x+end.width/2,y:end.y+end.height/2}]});
  }else await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:8,y:180}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }
 const poor=fixture();poor.combat!.energy=0;await load(page,poor);const before=(await saved(page)).run;
 await drag('strike','.cultivator');await expect(page.getByRole('status')).toContainText('living enemy');expect((await saved(page)).run).toEqual(before);
 await drag('strike','.enemy');await expect(page.getByRole('status')).toContainText('Requires 1 Dao Yuan');expect((await saved(page)).run).toEqual(before);
 await shot(page,'touch-drag-insufficient-en');
 await drag('wind-step',null);expect((await saved(page)).run).toEqual(before);
 await drag('wind-step','.cultivator');await expect.poll(async()=>(await saved(page)).run!.combat!.playHistory.length).toBe(1);expect((await saved(page)).run!.combat!.energy).toBe(0);
 expect(issues).toEqual([]);await context.close();
});


test('Tidal end-turn confirmation resolves exactly once and closes the modal',async({page})=>{
 const r=fixture();r.combat!.tidal='rising';await load(page,r);const turn=r.combat!.turn;
 await page.locator('.end-turn').click();await expect(page.locator('dialog .tidal-options')).toBeVisible();
 await page.locator('dialog .tidal-options .choice-tile').first().dblclick();
 await expect.poll(async()=>(await saved(page)).run!.combat!.turn).toBe(turn+1);
 await expect(page.locator('dialog')).toHaveCount(0);expect((await saved(page)).run!.combat!.actions).toHaveLength(r.combat!.actions.length+1);
});


test('selection from another combat cannot activate the same permanent card UID',async({page,context})=>{
 await load(page,fixture());await face(page,'strike').click();await expect(page.locator('.battle')).toHaveClass(/targeting/);
 const next=await saved(page);next.revision++;next.run!.combat!.seed++;next.run!.current!.id+='-next';expect(validateSave(next)).toBe(true);
 const second=await context.newPage();await second.goto('/');await second.evaluate(({key,value,revision})=>{localStorage.setItem(key,value);localStorage.setItem(`${key}.mirror`,value);localStorage.setItem(`${key}.head`,String(revision));},{key:SAVE_KEY,value:encodeSave(next),revision:next.revision});
 await expect(page.locator('.battle')).not.toHaveClass(/targeting/);await page.locator('.enemy').first().click();expect((await saved(page)).run!.combat!.actions).toHaveLength(0);await second.close();
});

test('confirmed new life records the old terminal run and opens a new draft',async({page})=>{
 await load(page,fixture());const before=(await saved(page)).run!;await page.locator('.wordmark').click();await page.getByRole('button',{name:'Begin a new life',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Begin another life?');
 await page.locator('dialog .danger-button').click();await expect.poll(async()=>(await saved(page)).run!.phase).toBe('starting');
 const after=await saved(page);expect(after.run!.id).not.toBe(before.id);expect(after.meta.history.filter(h=>h.id===before.id)).toHaveLength(1);expect(after.meta.history.find(h=>h.id===before.id)!.outcome).toBe('dead');
 expect(await page.evaluate(({key,id})=>JSON.parse(localStorage.getItem(`${key}.terminal`)??'{}')[id],{key:SAVE_KEY,id:before.id})).toBe('dead');
});
