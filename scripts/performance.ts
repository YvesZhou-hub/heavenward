/** Reproducible production-only diagnostics. Run after build + serve-static.mjs 3212. */
import { chromium, type Page } from '@playwright/test';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { cpus, totalmem, platform, release, arch } from 'node:os';
import { execFileSync } from 'node:child_process';
import { performance as nodePerformance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import { createCombat, playCard } from '../src/game/combat';
import { SUMMONS } from '../src/game/content';
import { chooseStarting, CONTENT_VERSION, enterNode, instance, newRun, RULES_VERSION, updateMeta, type Run } from '../src/game/run';
import { encodeSave, freshSave, SAVE_KEY, validateSave, type SaveData } from '../src/game/save';
import { RULES } from '../src/game/rules';
import { gradeLabel } from '../src/game/grades';
import type { CardInstance } from '../src/game/types';

const origin = process.env.PERFORMANCE_ORIGIN ?? 'http://127.0.0.1:3212';
const reportPath = 'artifacts/performance.json';
const frameWindowMs = 4000;
export const MEASURED_ACTIONS = Array.from({length:10},(_,index)=>({
 cardId:index===2||index===5?'defense':'strike',
 mode:index===2?'self-double-click':index===5?'self-target-click':'enemy-target-click',
} as const));
function summary(values: number[]) {
 const sorted = [...values].sort((a,b) => a-b);
 const percentile = (p: number) => sorted[Math.max(0, Math.ceil(sorted.length*p)-1)] ?? 0;
 return { samples: values.length, meanMs: values.reduce((a,b)=>a+b,0)/Math.max(1,values.length), medianMs: percentile(.5), p95Ms: percentile(.95), p99Ms: percentile(.99), maxMs: sorted.at(-1) ?? 0 };
}
export function battleFixture(): Run {
 let run = newRun(821321, 1000);
 run = chooseStarting(run, run.offers[0].uid); run = chooseStarting(run, run.offers[0].uid);
 run.deck = Array.from({length:12},(_,i)=>instance(run,i<8?'strike':'defense',0));
 run.nodes = [{id:'performance-combat',kind:'combat',encounter:['stone-guardian','restriction-soul','thunder-judge']}];
 run = enterNode(run,'performance-combat');
 const combat = run.combat!;
 combat.hand = structuredClone(run.deck.slice(0,10)); combat.draw = structuredClone(run.deck.slice(10));
 combat.discard = []; combat.exhaust = []; combat.energy = 20;
 for(const enemy of combat.enemies){enemy.hp=enemy.maxHp=10000;enemy.statuses={vulnerable:2,poison:3,flame:3,seed:2,bleeding:2,protectiveQi:2};}
 combat.player.statuses={strength:3,fortify:2,protectiveQi:3,swordIntent:4,tidalMomentum:RULES.statusCaps.tidalMomentum,windMomentum:2,regen:2};combat.tidal='raging';
 combat.powers={refiningArmor:2,swordFoundry:2,regen:2};
 combat.summons=['reed-wolf','thorn-vine','iron-crane'].map((id,i)=>{const def=SUMMONS[id];return{id:`performance-summon-${i}`,defId:id,name:def.name,hp:def.hp,maxHp:def.hp,armor:2,statuses:{strength:2},attack:def.attack,automatic:def.automatic};});
 return run;
}
export function fixtureSave(run: Run): SaveData {
 const data = freshSave(); data.run=run;data.revision=1;data.meta=updateMeta(data.meta,run,2000);
 data.settings={...data.settings,locale:'en',tutorial:false,reducedMotion:false,music:0,sfx:0,speed:1,gradeDisplay:'numeric'};
 if(!validateSave(data))throw new Error('Performance fixture rejected by production validator');
 return data;
}
async function saved(page: Page): Promise<SaveData> {
 return page.evaluate(key=>JSON.parse(JSON.parse(localStorage.getItem(key)!).payload),SAVE_KEY);
}
async function seedFixture(page: Page, run: Run) {
 const data=fixtureSave(run);
 await page.evaluate(({key,encoded})=>{
  for(const item of Object.keys(localStorage))if(item.startsWith('heavenward'))localStorage.removeItem(item);
  localStorage.setItem(key,encoded);localStorage.setItem(`${key}.mirror`,encoded);localStorage.setItem(`${key}.head`,'1');
 },{key:SAVE_KEY,encoded:encodeSave(data)});
 await page.reload();await page.getByRole('button',{name:'Continue journey',exact:true}).click();
 await page.locator('.battle').waitFor();
}
async function ordinaryControls(page: Page) {
 // Actual random draft and authored branch selection; no fixture or extra combat loop.
 await page.getByRole('button',{name:'Begin a new life',exact:true}).click();
 const offerCounts:number[]=[];
 for(let round=0;round<2;round++){
  await page.locator('.starting-offers .card-action').last().waitFor();
  const count=await page.locator('.starting-offers .card-action').count();offerCounts.push(count);
  if(count!==5)throw new Error(`Starting round ${round+1} did not expose five choices`);
  await page.locator('.starting-offers .card-action').first().click();
  await page.waitForFunction(({key,round})=>JSON.parse(JSON.parse(localStorage.getItem(key)!).payload).run.startingRound===round+1,{key:SAVE_KEY,round});
 }
 await page.locator('.branch-node').last().waitFor();
 const road=(await saved(page)).run!;
 if(road.phase!=='road'||road.nodes.length!==3||await page.locator('.branch-node').count()!==3)throw new Error('Expected three immediate authored branches');
 const selectedId=road.nodes.at(-1)!.id;
 await page.locator('.branch-node').last().click();await page.locator('.battle').waitFor();
 const entered=await saved(page);
 if(!validateSave(entered)||entered.version!==freshSave().version||entered.run!.phase!=='combat'||entered.run!.current?.id!==selectedId)throw new Error('Branch navigation did not persist the selected battle in v2 storage');
 return {fixture:false,seed:road.seed,startingOfferCounts:offerCounts,startingCards:road.deck.slice(10).map(c=>c.defId),branchCount:road.nodes.length,selectedId,saveVersion:entered.version,saveKey:SAVE_KEY,gradeDisplay:entered.settings.gradeDisplay};
}
async function staticInventory() {
 const files:{path:string;bytes:number;gzipBytes?:number}[]=[];
 async function walk(dir:string,relative=''){
  for(const entry of await readdir(dir,{withFileTypes:true})){
   const absolute=join(dir,entry.name),path=join(relative,entry.name);
   if(entry.isDirectory())await walk(absolute,path);
   else if(entry.isFile()){
    const bytes=(await stat(absolute)).size;
    files.push({path,bytes,...(['.js','.css'].includes(extname(path))?{gzipBytes:gzipSync(await readFile(absolute)).length}:{})});
   }
  }
 }
 await walk('out');
 const current=files.filter(file=>!file.path.startsWith('legacy/'));
 const legacy=files.filter(file=>file.path.startsWith('legacy/'));
 const aggregate=(items:typeof files)=>({files:items.length,rawBytes:items.reduce((sum,file)=>sum+file.bytes,0),javascriptRawBytes:items.filter(f=>extname(f.path)==='.js').reduce((sum,f)=>sum+f.bytes,0),javascriptGzipBytes:items.filter(f=>extname(f.path)==='.js').reduce((sum,f)=>sum+(f.gzipBytes??0),0),cssRawBytes:items.filter(f=>extname(f.path)==='.css').reduce((sum,f)=>sum+f.bytes,0),cssGzipBytes:items.filter(f=>extname(f.path)==='.css').reduce((sum,f)=>sum+(f.gzipBytes??0),0)});
 return {method:'All static export files; gzip sizes are computed locally, not transfer sizes. Current excludes the preserved legacy/ subtree. The static test server serves uncompressed bytes.',entireExport:aggregate(files),currentRevision:aggregate(current),preservedLegacy:aggregate(legacy),largestCurrentFiles:[...current].sort((a,b)=>b.bytes-a.bytes).slice(0,15)};
}
async function startFrames(page: Page) {
 // Raw browser JS keeps tsx/esbuild's Node-only function-name helpers out of
 // serialized page functions. This code changes instrumentation globals only.
 await page.evaluate(`(()=>{
  window.__performanceFrames=new Promise(resolve=>{
   const values=[];let last;let began;
   function tick(now){if(began===undefined)began=now;if(last!==undefined)values.push(now-last);last=now;if(now-began>=${frameWindowMs})resolve(values);else requestAnimationFrame(tick);}
   requestAnimationFrame(tick);
  });
 })()`);
}
async function finishFrames(page: Page) {
 const intervals=await page.evaluate(()=> (window as typeof window&{__performanceFrames:Promise<number[]>}).__performanceFrames);
 return {...summary(intervals),over20ms:intervals.filter(n=>n>20).length,over33_34ms:intervals.filter(n=>n>33.34).length,intervalsMs:intervals};
}
function swordStress() {
 // Accelerated Retain fixture: real Seven-Star Array formula creates 1000 tokens.
 // This is a capacity diagnostic, not an ordinary legal run or balance sample.
 const deck:CardInstance[]=Array.from({length:12},(_,i)=>({uid:`stress-card-${i}`,defId:i===0?'seven-star-array':'defense',grade:0,retained:0}));
 let combat=createCombat({seed:9181,realm:0,hp:72,maxHp:72,deck,enemies:['stone-guardian']});
 combat.hand=[{...deck[0],retained:998}];combat.draw=structuredClone(deck.slice(1));combat.discard=[];combat.exhaust=[];
 combat.enemies[0].hp=combat.enemies[0].maxHp=100000;combat.energy=3;
 const before=nodePerformance.now();combat=playCard(combat,deck[0].uid);const generationMs=nodePerformance.now()-before;
 const zones=()=>[...combat.hand,...combat.draw,...combat.discard,...combat.exhaust];
 const generated=zones().filter(c=>c.defId==='flying-sword');
 if(generated.length!==1000||new Set(generated.map(c=>c.uid)).size!==1000||combat.hand.length!==10)throw new Error('Flying Sword generation capacity invariant failed');
 const generatedDistribution={hand:combat.hand.filter(c=>c.defId==='flying-sword').length,discard:combat.discard.filter(c=>c.defId==='flying-sword').length};
 const durations:number[]=[];const startingEnemyHp=combat.enemies[0].hp;
 for(let i=0;i<1000;i++){
  let token=combat.hand.find(c=>c.defId==='flying-sword');
  if(!token){const index=combat.discard.findIndex(c=>c.defId==='flying-sword');token=combat.discard.splice(index,1)[0];if(!token)throw new Error('Missing stress token');combat.hand.push(token);}
  const started=nodePerformance.now();combat=playCard(combat,token.uid,combat.enemies[0].id);durations.push(nodePerformance.now()-started);
 }
 const serializedAt=nodePerformance.now();const serialized=JSON.stringify(combat);const serializationMs=nodePerformance.now()-serializedAt;
 const exhaustedTokens=combat.exhaust.filter(c=>c.defId==='flying-sword').length;
 if(exhaustedTokens!==1000||combat.phase!=='player'||startingEnemyHp-combat.enemies[0].hp!==2000)throw new Error('Flying Sword play/exhaust capacity invariant failed');
 return {fixture:'Accelerated Seven-Star Array retained=998; enemy HP=100000; displaced overflow tokens manually reintroduced one by one. Not an ordinary run or a balance claim.',generatedTokens:generated.length,uniqueTokenIds:new Set(generated.map(c=>c.uid)).size,generatedDistribution,generationMs,play:summary(durations),totalPlayMs:durations.reduce((a,b)=>a+b,0),exhaustedTokens,enemyHpLost:startingEnemyHp-combat.enemies[0].hp,serializationMs,serializedBytes:Buffer.byteLength(serialized)};
}

async function main(){
 const index=await readFile('out/index.html');
 const report:Record<string,unknown>={schema:2,measuredAt:new Date().toISOString(),origin,build:{indexSha256:createHash('sha256').update(index).digest('hex'),mode:'Next static production export',rulesVersion:RULES_VERSION,contentVersion:CONTENT_VERSION,coreVersion:RULES.version},environment:{platform:platform(),osRelease:release(),architecture:arch(),cpu:cpus()[0]?.model,logicalCpus:cpus().length,physicalMemoryBytes:totalmem(),node:process.version,concurrentWorkload:process.env.PERFORMANCE_CONCURRENT_WORKLOAD??'No additional workload was declared; background OS activity was not controlled.',macOS:platform()==='darwin'?execFileSync('sw_vers',['-productVersion'],{encoding:'utf8'}).trim():null},methodology:{viewport:{width:1366,height:768},deviceScaleFactor:1,headless:true,frameWindowMs,network:'Localhost; fresh browser context; no network/CPU throttling; transfer timings are not internet load estimates.',latency:'Playwright action invocation through exactly one committed play and two animation frames; includes automation/IPC overhead, not a Web Vitals INP measurement. Eight enemy-target clicks, one self-target click, and one self double-click.',frames:'Chromium requestAnimationFrame intervals in headless mode; diagnostic scheduling stability, not hardware display FPS or GPU certification.',memory:'CDP JSHeapUsedSize and DOM counters after forced GC, at the same menu state. Fifty collection/menu cycles; this detects retained growth in this workload and cannot prove absence of every leak.',fixtures:'Validated controlled battle has 8 Strikes and 2 Defenses in hand, 3 summons, 3 enemies, Tidal, many statuses, 20 energy, and 10000 HP enemies to sample 10 actions without killing them. Stress fixture is accelerated and never used as a balance outcome.',comparison:'Archived v1 used ten Strikes. The current profile includes both self-card input modes and additional content, so aggregate action timings are descriptive rather than a controlled before/after performance experiment.',gradeDisplay:'numeric',saveKey:SAVE_KEY}};
 report.staticSize=await staticInventory();
 const browser=await chromium.launch({headless:true});report.browser={version:browser.version(),engine:'Chromium'};
 const context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1,reducedMotion:'no-preference'});
 const page=await context.newPage();const errors:string[]=[];page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(20000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('Network.enable');
 let wireBytes=0;let requestCount=0;cdp.on('Network.loadingFinished',event=>{wireBytes+=event.encodedDataLength;requestCount++;});
 try{
  const navigationStarted=nodePerformance.now();const response=await page.goto(origin,{waitUntil:'networkidle'});
  if(!response||response.status()!==200)throw new Error('Production origin did not return 200');
  const servedIndex=await response.body();
  if(!index.equals(servedIndex))throw new Error('Origin must serve the exact current out/index.html production export');
  report.buildGuard={servedIndexSha256:createHash('sha256').update(servedIndex).digest('hex'),servedHtmlMatches:true};
  await page.getByRole('button',{name:'Begin a new life',exact:true}).waitFor();
  const initial=await page.evaluate(()=>({navigation:performance.getEntriesByType('navigation').map(e=>e.toJSON()),resources:performance.getEntriesByType('resource').map(e=>e.toJSON()),fontReady:document.fonts.status}));
  if(initial.resources.some(r=>String(r.name).includes('webpack-hmr')||String(r.name).includes('/static/development/')))throw new Error('Refusing dev-server performance measurements');
  report.initialLoad={automationToReadyMs:nodePerformance.now()-navigationStarted,cdpEncodedTransferBytes:wireBytes,requests:requestCount,...initial};
  report.ordinaryControls=await ordinaryControls(page);
  await seedFixture(page,battleFixture());
  await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready.then(()=>undefined));
  if(!(await page.locator('.hand-area [data-card="strike"] .card-type').first().innerText()).includes(gradeLabel(0,'en','numeric')))throw new Error('Numeric grade presentation is not active');
  report.gameResources=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.toJSON()));
  await startFrames(page);report.idleFrames=await finishFrames(page);
  await startFrames(page);const latencies:number[]=[];const browserLatencies:number[]=[];
  const actionSamples:{cardId:string;mode:string;automationMs:number;browserMs:number;committedPlays:number;revisionDelta:number}[]=[];
  for(const action of MEASURED_ACTIONS){
   const before=await saved(page),revision=before.revision,plays=before.run!.combat!.playHistory.length;
   const card=before.run!.combat!.hand.find(c=>c.defId===action.cardId)!;
   if(!card)throw new Error(`Missing scheduled ${action.cardId}`);
   const eventType=action.mode==='self-double-click'?'dblclick':'click';
   const selector=action.mode==='self-double-click'?'.hand-area [data-card="defense"] .card-face':action.mode==='self-target-click'?'.cultivator':'.enemy';
   await page.evaluate(`(()=>{
    const key=${JSON.stringify(SAVE_KEY)},revision=${revision},plays=${plays},eventType=${JSON.stringify(eventType)},selector=${JSON.stringify(selector)};
    window.__performanceAction=new Promise(resolve=>{
     function activated(event){
      if(!(event.target instanceof Element)||!event.target.closest(selector))return;
      document.removeEventListener(eventType,activated,true);const began=performance.now();
      function confirmed(){
       const data=JSON.parse(JSON.parse(localStorage.getItem(key)).payload);
       if(data.revision>revision&&data.run.combat.playHistory.length===plays+1)requestAnimationFrame(now=>resolve(now-began));
       else if(performance.now()-began>8000)resolve(-1);
       else requestAnimationFrame(confirmed);
      }
      requestAnimationFrame(confirmed);
     }
     document.addEventListener(eventType,activated,true);
    });
   })()`);
   const began=nodePerformance.now();
   const face=page.locator(`.hand-area [data-card="${action.cardId}"] .card-face`).first();
   if(action.mode==='self-double-click')await face.dblclick();
   else{await face.click();await page.locator(action.mode==='self-target-click'?'.cultivator':'.enemy').first().click();}
   await page.waitForFunction(({key,revision})=>JSON.parse(JSON.parse(localStorage.getItem(key)!).payload).revision>revision,{key:SAVE_KEY,revision});
   await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
   const automationMs=nodePerformance.now()-began;
   const browserMs=await page.evaluate(()=>(window as typeof window&{__performanceAction:Promise<number>}).__performanceAction);
   const after=await saved(page),history=after.run!.combat!.playHistory;
   if(browserMs<0||!validateSave(after)||history.length!==plays+1||history.at(-1)?.uid!==card.uid)throw new Error(`Expected exactly one valid committed play for ${action.mode}`);
   latencies.push(automationMs);browserLatencies.push(browserMs);
   actionSamples.push({...action,automationMs,browserMs,committedPlays:history.length-plays,revisionDelta:after.revision-revision});
  }
  report.vfxFrames=await finishFrames(page);report.actionLatency={automationActionRoundTrip:{...summary(latencies),individualMs:latencies},browserCommitEventToPaint:{...summary(browserLatencies),individualMs:browserLatencies,method:'Capturing target click or self double-click timestamp to confirmed save revision and one new committed play at an animation frame, then the next frame; includes confirmation polling, excludes Playwright IPC. Diagnostic, not INP.'},byMode:Object.fromEntries([...new Set(actionSamples.map(a=>a.mode))].map(mode=>{const rows=actionSamples.filter(a=>a.mode===mode);return[mode,{automation:summary(rows.map(a=>a.automationMs)),browser:summary(rows.map(a=>a.browserMs))}];})),samples:actionSamples};
  await page.locator('.wordmark').click();
  // Warm collection images and React paths before measuring retained memory.
  await page.getByRole('button',{name:'Book of techniques',exact:true}).click();await page.locator('.collection-scene .game-card').last().waitFor();
  const collectionCardCount=await page.locator('.collection-scene .game-card').count();
  await page.waitForLoadState('networkidle');await page.locator('.collection-scene .back-link').click();
  async function memory(cycles:number){
   await page.locator('.main-menu').waitFor({state:'visible'});await page.locator('.collection-scene').waitFor({state:'detached'});
   await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
   await cdp.send('HeapProfiler.collectGarbage');const metrics=await cdp.send('Performance.getMetrics');const dom=await cdp.send('Memory.getDOMCounters');
   const attachedElements=await page.evaluate(()=>document.getElementsByTagName('*').length);
   const metric=(name:string)=>metrics.metrics.find(m=>m.name===name)?.value??null;
   return{cycles,jsHeapUsedBytes:metric('JSHeapUsedSize'),jsHeapTotalBytes:metric('JSHeapTotalSize'),documents:dom.documents,nodes:dom.nodes,attachedElements,listeners:dom.jsEventListeners};
  }
  const memorySamples=[await memory(0)];
  for(let i=1;i<=50;i++){
   await page.getByRole('button',{name:'Book of techniques',exact:true}).click();await page.locator('.collection-scene .game-card').last().waitFor();await page.locator('.collection-scene .back-link').click();
   if([10,25,50].includes(i))memorySamples.push(await memory(i));
  }
  report.menuCollectionMemory={collectionCardCount,samples:memorySamples,heapGrowthBytes:memorySamples.at(-1)!.jsHeapUsedBytes!-memorySamples[0].jsHeapUsedBytes!};
  report.flyingSwordStress=swordStress();report.browserErrors=errors;
  if(errors.length)throw new Error(`Browser errors: ${errors.join('; ')}`);
  const finalIndex=await readFile('out/index.html');
  if(!index.equals(finalIndex))throw new Error('Production build changed during measurement; results cannot identify the final build');
  report.buildGuard={...(report.buildGuard as object),finalIndexSha256:createHash('sha256').update(finalIndex).digest('hex'),exportUnchanged:true};
  report.completed=true;
 }catch(error){report.completed=false;report.error=error instanceof Error?error.stack:String(error);report.browserErrors=errors;throw error;}
 finally{await mkdir('artifacts',{recursive:true});await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');await browser.close();console.log(`Performance evidence written to ${reportPath}`);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv.includes('--engine-only'))console.log(JSON.stringify(swordStress(),null,2));
 else main().catch(error=>{console.error(error);process.exitCode=1;});
}
