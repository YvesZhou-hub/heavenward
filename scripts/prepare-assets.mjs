import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const source=resolve(process.argv[2]??'assets/source');
const output=resolve('public/art');
await mkdir(output,{recursive:true});
const names=['environment','techniques-atlas','characters-atlas'];
const assets=[];
for(const name of names){
 const input=resolve(source,`heavenward-${name}.png`);const bytes=await readFile(input);const file=name==='environment'?'environment.webp':name==='techniques-atlas'?'techniques.webp':'characters.webp';const metadata=await sharp(bytes).webp({quality:name==='environment'?88:90}).toFile(resolve(output,file));
 const optimized=await readFile(resolve(output,file));assets.push({id:name,source:`assets/source/heavenward-${name}.png`,file:`public/art/${file}`,tool:'image_gen.imagegen',model:'not exposed by tool',version:1,sourceSha256:createHash('sha256').update(bytes).digest('hex'),sha256:createHash('sha256').update(optimized).digest('hex'),width:metadata.width,height:metadata.height,bytes:metadata.size,review:'benchmark accepted; shared illustration bank',usage:name==='environment'?'menu, battle, event landscape':name==='techniques-atlas'?'sixteen Path/category subjects shared by card designs':'six character portraits; shared enemies require further unique art'});
}
await writeFile('docs/ASSET_MANIFEST.json',JSON.stringify({version:1,promptRecord:'assets/source/generation-record.json',assets},null,2)+'\n');
console.log(JSON.stringify(assets.map(({id,width,height,bytes})=>({id,width,height,bytes})),null,2));
