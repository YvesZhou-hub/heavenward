// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { canonicalCombatJSON, replayCombat } from '../src/game/replay';

async function main(){
 const [inputPath,outputPath]=process.argv.slice(2);
 if(!inputPath)throw new Error('Usage: npx tsx scripts/replay.ts <combat-replay.json> [final-combat.json]');
 const input:unknown=JSON.parse(await readFile(inputPath,'utf8'));
 const final=replayCombat(input);
 if(outputPath)await writeFile(outputPath,JSON.stringify(final,null,2)+'\n');
 console.log(JSON.stringify({actionsReplayed:true,expectedStateMatched:!!input&&typeof input==='object'&&'expectedState'in input,actions:final.actions.length,turn:final.turn,phase:final.phase,rng:final.rng,stateSha256:createHash('sha256').update(canonicalCombatJSON(final)).digest('hex'),outputPath:outputPath??null},null,2));
}
main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
