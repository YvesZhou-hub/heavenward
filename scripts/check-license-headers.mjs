// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

/** Fails when a first-party source file, tracked or not yet staged, does not start with the Apache-2.0 SPDX header. Run through `npm run lint`. */
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
const source=/\.(ts|tsx|mts|js|mjs|css)$/,excluded=/^(public\/legacy\/|artifacts\/|next-env\.d\.ts$)/;
// The year is the file's creation year, so any year is accepted; the header must be the first two lines.
const copyright=/^(\/\/|\/\*) Copyright \d{4} Ye Zhou( \*\/)?$/,spdx=/^(\/\/|\/\*) SPDX-License-Identifier: Apache-2\.0( \*\/)?$/;
const listed=execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{encoding:'utf8'}).split('\n');
const files=[...new Set(listed)].filter(file=>source.test(file)&&!excluded.test(file)&&existsSync(file));
const missing=[];
for(const file of files){const [first='',second='']=(await readFile(file,'utf8')).split('\n');if(!copyright.test(first)||!spdx.test(second))missing.push(file);}
if(missing.length){console.error(`Missing license header in ${missing.length} file(s):\n${missing.map(file=>`  ${file}`).join('\n')}\nStart each file with:\n  // Copyright ${new Date().getFullYear()} Ye Zhou\n  // SPDX-License-Identifier: Apache-2.0`);process.exitCode=1;}
else console.log(`License headers present in ${files.length} source files.`);
