// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

/** Fails when a tracked first-party source file lacks the Apache-2.0 SPDX header. Run through `npm run lint`. */
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
const source=/\.(ts|tsx|mts|js|mjs|css)$/,excluded=/^(public\/legacy\/|artifacts\/|next-env\.d\.ts$)/;
const files=execFileSync('git',['ls-files'],{encoding:'utf8'}).split('\n').filter(file=>source.test(file)&&!excluded.test(file));
const missing=[];
for(const file of files){const head=(await readFile(file,'utf8')).split('\n').slice(0,3).join('\n');if(!/Copyright \d{4} Ye Zhou/.test(head)||!head.includes('SPDX-License-Identifier: Apache-2.0'))missing.push(file);}
if(missing.length){console.error(`Missing license header in ${missing.length} file(s):\n${missing.map(file=>`  ${file}`).join('\n')}\nStart each file with:\n  // Copyright ${new Date().getFullYear()} Ye Zhou\n  // SPDX-License-Identifier: Apache-2.0`);process.exitCode=1;}
else console.log(`License headers present in ${files.length} source files.`);
