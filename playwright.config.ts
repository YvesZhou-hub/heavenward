// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  outputDir: './output/playwright/results',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'output/playwright/report', open: 'never' }], ['json', { outputFile: 'output/playwright/results.json' }]],
  use: { baseURL: process.env.E2E_BASE_URL??'http://127.0.0.1:3210', trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1366, height: 768 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1366, height: 768 } } },
  ],
  webServer: process.env.E2E_BASE_URL?undefined:{ command: 'npm run dev', url: 'http://127.0.0.1:3210', reuseExistingServer: true, timeout: 120_000 },
});
