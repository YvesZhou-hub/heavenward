// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import type { NextConfig } from 'next';
const config: NextConfig = { output: 'export', images: { unoptimized: true }, poweredByHeader: false, devIndicators: false, turbopack: { root: process.cwd() } };
export default config;
