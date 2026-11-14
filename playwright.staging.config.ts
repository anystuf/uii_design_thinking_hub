import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

if (existsSync('.env.uat.local')) loadEnvFile('.env.uat.local');

export default defineConfig({
  testDir: './e2e-staging',
  workers: 1,
  retries: 0,
  timeout: 180000,
  reporter: 'list',
  use: {
    baseURL: 'https://usi-design-thinking-web-staging.vercel.app',
    channel: 'chrome',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
});
