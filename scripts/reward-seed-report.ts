// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { mkdir,writeFile } from 'node:fs/promises';
import { diagnosticMetadata } from './diagnostic-metadata';
import { CARDS,DAO_CARD_IDS } from '../src/game/content';
import { CONTENT_VERSION,RULES_VERSION,deckProfile,drawOffers,instance,newRun } from '../src/game/run';

async function main(){
const builds:Record<string,string[]>={neutral:[],sword:['flying-arsenal','flying-arsenal','still-sword-heart','re-refinement'],mixed:['ember-brand','stone-rampart','spring-return','exchange-thought']};
const reports=[];
for(const [name,ids] of Object.entries(builds)){
 const observed=new Set<string>(),counts:Record<string,number>={},sample:string[][]=[];let offers=0,offPath=0;
 for(let seed=1;seed<=300;seed++){
  const run=newRun(seed);run.deck=run.deck.slice(0,10);for(const id of ids)run.deck.push(instance(run,id));
  const profile=deckProfile(run),copy=structuredClone(run);
  const first=drawOffers(run);if(JSON.stringify(drawOffers(copy))!==JSON.stringify(first))throw new Error('Determinism failed');
  const batches=[first,...Array.from({length:11},()=>drawOffers(run))];
  for(const batch of batches){
   if(batch.length!==5||new Set(batch.map(c=>c.defId)).size!==5)throw new Error('Offer identity/count failure');
   for(const card of batch){const def=CARDS[card.defId];if(!['dao','immortal'].includes(def.category))throw new Error('Forbidden reward category');observed.add(card.defId);counts[def.path]=(counts[def.path]??0)+1;offers++;if(!profile.paths[def.path])offPath++;}
  }
  if(seed===1)sample.push(...batches.slice(0,3).map(b=>b.map(c=>c.defId)));
 }
 reports.push({build:name,nonbasicDeck:ids,seeds:300,drawsPerSeed:12,offers,distinctObserved:observed.size,missingDao:DAO_CARD_IDS.filter(id=>!observed.has(id)),offPathOffers:offPath,offPathShare:offPath/offers,pathCounts:counts,seedOneSamples:sample});
}
if(reports.some(r=>r.missingDao.length||r.offPathShare<=0))throw new Error('Off-Path reachability failed');
if(reports.find(r=>r.build==='sword')!.pathCounts.sword<=reports.find(r=>r.build==='neutral')!.pathCounts.sword)throw new Error('Deck profile has no measured Sword influence');
const report={...diagnosticMetadata('scripts/reward-seed-report.ts'),rulesVersion:RULES_VERSION,contentVersion:CONTENT_VERSION,method:'Deterministic generator sampling only. No combat victories, human duration or balance acceptance is inferred.',reports};
await mkdir('artifacts/revision',{recursive:true});await writeFile('artifacts/revision/reward-seed-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(reports.map(({build,offers,distinctObserved,missingDao,offPathShare})=>({build,offers,distinctObserved,missingDao,offPathShare})),null,2));

}
main().catch(error=>{console.error(error);process.exitCode=1;});
