// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const origin=process.argv[2];if(!origin||new URL(origin).protocol!=='https:')throw new Error('Usage: node scripts/verify-deployment.mjs https://canonical-domain');
const deployment=JSON.parse(await readFile('artifacts/deployment/vercel-status.json','utf8'));
const toolbarSuffix="\n;(function(){if(typeof document===\"undefined\"||!/(?:^|;\\s)__vercel_toolbar=1(?:;|$)/.test(document.cookie))return;var s=document.createElement('script');s.src='https://vercel.live/_next-live/feedback/feedback.js';s.setAttribute(\"data-explicit-opt-in\",\"true\");s.setAttribute(\"data-cookie-opt-in\",\"true\");s.setAttribute(\"data-deployment-id\",\"__DEPLOYMENT_ID__\");((document.head||document.documentElement).appendChild(s))})();".replace('__DEPLOYMENT_ID__',deployment.id);
const sha=b=>createHash('sha256').update(b).digest('hex');const results=[];
const htmlResponse=await fetch(origin);const htmlBytes=Buffer.from(await htmlResponse.arrayBuffer());const localHtml=await readFile('out/index.html');
results.push({path:'/',status:htmlResponse.status,sha256:sha(htmlBytes),expectedSha256:sha(localHtml),matches:htmlBytes.equals(localHtml),headers:{contentType:htmlResponse.headers.get('content-type'),nosniff:htmlResponse.headers.get('x-content-type-options')}});
const art=JSON.parse(await readFile('src/game/art-index.json','utf8'));const html=htmlBytes.toString('utf8');
const referenced=[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m=>m[1]).filter(p=>p.startsWith('/_next/static/'));
const paths=[...new Set([...Object.values(art),'/art/environment.webp','/icon.svg','/notices/THIRD_PARTY_NOTICES.txt',...referenced])];
let cursor=0;async function worker(){while(cursor<paths.length){const path=paths[cursor++];const url=new URL(path,origin);try{const response=await fetch(url,{signal:AbortSignal.timeout(30000)});const body=Buffer.from(await response.arrayBuffer());const relative=url.pathname.slice(1);const expected=await readFile('.vercel/output/static/'+relative);const exact=body.equals(expected);const platformToolbar=/^_next\/static\/chunks\/turbopack-[a-zA-Z0-9_-]+\.js$/.test(relative)&&body.equals(Buffer.concat([expected,Buffer.from(toolbarSuffix)]));results.push({path,status:response.status,bytes:body.length,sha256:sha(body),expectedSha256:sha(expected),exactBytes:exact,verifiedPlatformAppend:platformToolbar?'Original bundle is byte-identical; exact 439-byte Vercel cookie-opt-in toolbar append for verified deployment ID':null,matches:response.status===200&&(exact||platformToolbar),contentType:response.headers.get('content-type')});}catch(error){results.push({path,matches:false,error:String(error)});}}}
await Promise.all(Array.from({length:6},worker));
for(const path of ['/.env','/assets/source/cards-01.png','/docs/source/MASTER_BUILD_BRIEF.txt']){const response=await fetch(new URL(path,origin));results.push({path,status:response.status,matches:response.status===404,check:'development-only paths are not deployed'});}
const report={verifiedAt:new Date().toISOString(),origin,passed:results.every(r=>r.matches&&(!r.path||r.path!=='/'||r.status===200)),requests:results.length,results};await mkdir('artifacts/deployment',{recursive:true});await writeFile('artifacts/deployment/http-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({origin,passed:report.passed,requests:report.requests,failures:results.filter(r=>!r.matches)},null,2));if(!report.passed)process.exitCode=1;
