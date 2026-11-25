import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

if (existsSync('.env.uat.local')) loadEnvFile('.env.uat.local');

// Fail closed: do not accidentally authenticate test accounts on the old
// USI hostname or an unrelated project. The selected frontend is explicit.
const frontendOrigin = process.env.E2E_STAGING_FRONTEND_ORIGIN;
if (!frontendOrigin) throw new Error('Set E2E_STAGING_FRONTEND_ORIGIN to the reviewed UII staging frontend before authenticated UAT.');
const frontend = new URL(frontendOrigin);
if (frontend.protocol !== 'https:' ||
    !/^(?:uii-design-thinking-hub-(?:preview|staging)|uii-dt-thanh-pilot|uii-design-thinking-web-staging-[a-z0-9-]+)\.vercel\.app$/.test(frontend.hostname) ||
    frontend.pathname !== '/' || frontend.search || frontend.hash || frontend.username || frontend.password) {
  throw new Error('Authenticated UAT is restricted to an approved UII Preview or Stable Staging origin.');
}

export default defineConfig({
  testDir: './e2e-staging',
  workers: 1,
  retries: 0,
  timeout: 180000,
  reporter: 'list',
  use: {
    baseURL: frontend.origin,
    channel: 'chrome',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
});
