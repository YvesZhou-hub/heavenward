import {cp,mkdir,readFile,readdir,writeFile,stat,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const root='.vercel/output',destination=join(root,'static');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const html=await readFile('out/index.html');const performance=JSON.parse(await readFile('artifacts/performance.json','utf8'));
await rm(root,{recursive:true,force:true});
await mkdir(destination,{recursive:true});await cp('out',destination,{recursive:true});
await mkdir(join(destination,'notices'),{recursive:true});await cp('docs/licenses',join(destination,'notices/licenses'),{recursive:true});
const records=JSON.parse(await readFile('docs/DEPENDENCY_LICENSES.json','utf8'));
const notice=['HEAVENWARD / 问天 — third-party notices','', 'This static package includes the following third-party libraries, fonts and icons. Their original license notices are provided in the licenses/ directory. Installed build dependencies may also appear in this inventory; it does not claim all of them execute in the browser.','',...records.map(r=>`${r.name} ${r.version} — ${r.license}${r.licenseFile?` — licenses/${r.licenseFile.split('/').at(-1)}`:''}`),'','Game music and effects are synthesized from project code without third-party sound recordings. Game illustrations were generated with the authorized built-in image generation tool; the tool did not expose a model identity. Gameplay text and code remain separate from the art. This file does not grant a blanket license to the original game or claim human-authored illustrations.'];
await writeFile(join(destination,'notices/THIRD_PARTY_NOTICES.txt'),notice.join('\n')+'\n');
await writeFile(join(root,'config.json'),JSON.stringify({version:3,routes:[{src:'/(.*)',headers:{'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()'},continue:true},{src:'/_next/static/(.*)',headers:{'Cache-Control':'public, max-age=31536000, immutable'},continue:true},{handle:'filesystem'},{src:'/(.*)',dest:'/404.html',status:404}]},null,2)+'\n');
const files=[];async function walk(dir,relative=''){for(const entry of await readdir(dir,{withFileTypes:true})){const rel=join(relative,entry.name),absolute=join(dir,entry.name);if(entry.isSymbolicLink())throw new Error(`Symlink not accepted in static payload: ${rel}`);if(entry.isDirectory())await walk(absolute,rel);else{if(/(^|\/)(\.env|\.git|\.vercel|node_modules|assets|docs|artifacts)(\/|$)/.test(rel))throw new Error(`Source/private path in static payload: ${rel}`);const bytes=await readFile(absolute);files.push({path:rel,bytes:(await stat(absolute)).size,sha256:hash(bytes)});}}}
await walk(destination);await mkdir('artifacts/deployment',{recursive:true});
const report={preparedAt:new Date().toISOString(),format:'Vercel Build Output API v3; pure static; no functions',source:'out/',entrySha256:hash(html),matchesProfiledBuild:performance.build.indexSha256===hash(html),files:files.length,bytes:files.reduce((sum,f)=>sum+f.bytes,0),contents:files};
await writeFile('artifacts/deployment/payload.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({files:report.files,bytes:report.bytes,matchesProfiledBuild:report.matchesProfiledBuild,entrySha256:report.entrySha256}));
