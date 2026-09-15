// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

/** Records the live production deployment that deploy:verify checks against. Usage: node scripts/record-deployment.mjs [domain] [scope] */
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const [domain='heavenward.vercel.app',scope='yves-projects-de611e27']=process.argv.slice(2);
const inspected=JSON.parse(execFileSync('vercel',['inspect',domain,'--scope',scope,'--json'],{encoding:'utf8',stdio:['ignore','pipe','inherit']}));
if(inspected.readyState!=='READY'||inspected.target!=='production')throw new Error(`${domain} resolves to ${inspected.id} (${inspected.readyState}, ${inspected.target}); expected a READY production deployment`);
const status={verifiedAt:new Date().toISOString(),id:inspected.id,readyState:inspected.readyState,target:inspected.target,url:inspected.url};
await mkdir('artifacts/deployment',{recursive:true});await writeFile('artifacts/deployment/vercel-status.json',JSON.stringify(status,null,2)+'\n');
console.log(JSON.stringify(status));
