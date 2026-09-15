// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import {chromium} from '@playwright/test';
import {mkdir,rename,writeFile} from 'node:fs/promises';
await mkdir('output/demo',{recursive:true});
const browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:'output/demo',size:{width:1440,height:900}}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:3211');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'output/demo/menu-en.png'});await page.waitForTimeout(1200);
await page.getByRole('button',{name:'Begin a new life',exact:true}).click();
for(let i=0;i<2;i++){await page.locator('.starting-offers .card-action').first().waitFor();await page.waitForTimeout(1100);await page.locator('.starting-offers .card-action').first().click();}
await page.locator('.road-node').first().waitFor();await page.waitForTimeout(1200);await page.locator('.road-node').first().click();await page.locator('.battle').waitFor();await page.waitForTimeout(1300);
const strike=page.locator('.hand-area [data-card="strike"] .card-face').first();if(await strike.count()){await strike.hover();await page.waitForTimeout(500);await strike.click();await page.locator('.enemy').first().hover();await page.waitForTimeout(900);await page.locator('.enemy').first().click();}
const defense=page.locator('.hand-area [data-card="defense"] .card-face').first();if(await defense.count()){await defense.hover();await page.waitForTimeout(500);await defense.click();}
await page.getByRole('button',{name:'简中',exact:true}).click();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1000);await page.mouse.move(20,30);await page.screenshot({path:'output/demo/ordinary-combat-zh.png'});
await page.locator('.end-turn').click();await page.waitForTimeout(1400);
const state=await page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('heavenward.save.v1')).payload));
await writeFile('output/demo/record.json',JSON.stringify({type:'ordinary unmodified opening through the UI; random fresh seed; no fixture grants',seed:state.run.seed,phase:state.run.phase,turn:state.run.combat?.turn,actions:state.run.combat?.actions,errors,audio:'silent browser video; no mixed soundtrack claimed'},null,2));
const video=page.video();await context.close();const source=await video.path();await rename(source,'output/demo/heavenward-opening.webm');await browser.close();if(errors.length)throw new Error(errors.join('; '));
