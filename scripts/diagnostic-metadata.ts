// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { RULES } from '../src/game/rules';

/** Source provenance for rules diagnostics; independent of UI/export hashes. */
export function diagnosticMetadata(script: string) {
  const files = [...new Set([
    'src/game/run.ts', 'src/game/content.ts', 'src/game/combat.ts',
    'src/game/rules.ts', 'src/game/types.ts', 'src/game/save.ts',
    'scripts/simulate.ts', 'scripts/diagnostic-metadata.ts', script,
  ])];
  return {
    generatedAt: new Date().toISOString(),
    coreVersion: RULES.version,
    sourceSha256: Object.fromEntries(files.map(path => [path, createHash('sha256').update(readFileSync(path)).digest('hex')])),
  };
}
