// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
export default defineConfig([...nextVitals, ...nextTs, globalIgnores(['.next/**','out/**','evidence/**','output/**'])]);
