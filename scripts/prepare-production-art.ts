// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import sharp from 'sharp';
import { mkdir,readFile,writeFile,copyFile,access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { CARDS, ENEMIES, SUMMONS } from '../src/game/content';
async function main(){
const input=resolve(process.argv[2]??'../outputs/heavenward-art');const stored=resolve('assets/source');
await mkdir(stored,{recursive:true});await mkdir('public/art/cards',{recursive:true});await mkdir('public/art/entities',{recursive:true});
const draft=process.argv.includes('--draft');
const exists=async(file:string)=>{try{await access(resolve(input,file));return true;}catch{return false;}};
const map:Record<string,string>={};const assets:Record<string,unknown>[]=[];
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const grids:Record<string,{x:number[];y:number[]}>= {
 'cards-01.png':{x:[0,314,627,941,1254],y:[0,313,627,929,1254]},
 'cards-02.png':{x:[0,313,627,940,1254],y:[0,313,627,926,1254]},
 'cards-03.png':{x:[0,313,627,941,1254],y:[0,313,627,935,1254]},
 'cards-04.png':{x:[0,314,627,940,1254],y:[0,313,627,915,1254]},
 'cards-05.png':{x:[0,314,627,940,1254],y:[0,313,627,928,1254]},
 'cards-06.png':{x:[0,313,627,940,1254],y:[0,313,627,927,1254]},
 'cards-07.png':{x:[0,314,627,940,1254],y:[0,313,627,940,1254]},
 'enemies-01.png':{x:[0,313,627,940,1254],y:[0,313,627,940,1254]},
 'entities-02.png':{x:[0,417,835,1254],y:[0,418,837,1254]},
};
async function slice(file:string,ids:string[],cols:number,rows:number,kind:'cards'|'entities'){
 const source=await readFile(resolve(input,file));if(resolve(input,file)!==resolve(stored,file))await copyFile(resolve(input,file),resolve(stored,file));const meta=await sharp(source).metadata();if(!meta.width||!meta.height)throw new Error(`Missing dimensions: ${file}`);
 for(let i=0;i<ids.length;i++){const id=ids[i];if(!id)continue;const col=i%cols,row=Math.floor(i/cols),grid=grids[file],left=(grid?.x[col]??Math.round(col*meta.width/cols))+2,top=(grid?.y[row]??Math.round(row*meta.height/rows))+2,width=(grid?.x[col+1]??Math.round((col+1)*meta.width/cols))-left-2,height=(grid?.y[row+1]??Math.round((row+1)*meta.height/rows))-top-2;
  const output=`public/art/${kind}/${id}.webp`;await sharp(source).extract({left,top,width,height}).webp({quality:91}).toFile(output);const bytes=await readFile(output);map[id]=`/art/${kind}/${id}.webp`;
  assets.push({id,usage:kind,source:`assets/source/${file}`,sourceSha256:hash(source),sourceDimensions:[meta.width,meta.height],crop:{left,top,width,height},file:output,width,height,sha256:hash(bytes),bytes:bytes.length,tool:'image_gen.imagegen',model:'not exposed by tool',review:'generated and visually reviewed; actual-size integration review recorded in QA_EVIDENCE',version:1});
 }
}
const ids=Object.keys(CARDS);
for(let i=0;i<7;i++)await slice(`cards-${String(i+1).padStart(2,'0')}.png`,ids.slice(i*16,i*16+16),4,4,'cards');
if(!draft||await exists('cards-repairs-01.png'))await slice('cards-repairs-01.png',['storm-script','empty-sleeve','feast-of-scars'],3,1,'cards');
await slice('enemies-01.png',Object.keys(ENEMIES).slice(0,16),4,4,'entities');
await slice('entities-02.png',[...Object.keys(ENEMIES).slice(16),...Object.keys(SUMMONS)],3,3,'entities');
// The approved player portrait remains its own source asset, not an enemy fallback.
const characterSource=await readFile('assets/source/heavenward-characters-atlas.png');await sharp(characterSource).extract({left:0,top:0,width:512,height:512}).webp({quality:91}).toFile('public/art/entities/wanderer.webp');map.wanderer='/art/entities/wanderer.webp';const playerBytes=await readFile('public/art/entities/wanderer.webp');assets.push({id:'wanderer',usage:'entities',source:'assets/source/heavenward-characters-atlas.png',sourceSha256:hash(characterSource),sourceDimensions:[1536,1024],crop:{left:0,top:0,width:512,height:512},file:'public/art/entities/wanderer.webp',width:512,height:512,sha256:hash(playerBytes),bytes:playerBytes.length,tool:'image_gen.imagegen',model:'not exposed by tool',review:'accepted original Wanderer portrait; in-game visual review',version:1});
for(const record of ['cards-01-04-record.json','cards-05-07-record.json','repairs-record.json','entity-record.json'])if((!draft||await exists(record))&&resolve(input,record)!==resolve(stored,record))await copyFile(resolve(input,record),resolve(stored,record));
const latest=[...new Map(assets.map(asset=>[asset.id,asset])).values()];
await writeFile('src/game/art-index.json',JSON.stringify(map,null,2)+'\n');await writeFile('docs/PRODUCTION_ASSET_MANIFEST.json',JSON.stringify({version:1,draft,requestedModel:'gpt-image-2.5-sunburst',actualModel:'not exposed; no model identity claim',provenanceRecords:['assets/source/generation-record.json','assets/source/cards-01-04-record.json','assets/source/cards-05-07-record.json','assets/source/repairs-record.json','assets/source/entity-record.json'],assets:latest},null,2)+'\n');
console.log(JSON.stringify({cardIllustrations:ids.length,enemyIllustrations:Object.keys(ENEMIES).length,summonIllustrations:Object.keys(SUMMONS).length,registeredFiles:Object.keys(map).length,bytes:latest.reduce((sum,a)=>sum+Number(a.bytes),0)},null,2));

}
main().catch(error=>{console.error(error);process.exitCode=1;});
