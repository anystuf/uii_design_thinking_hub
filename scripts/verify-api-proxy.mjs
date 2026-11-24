import assert from 'node:assert/strict';

const original = process.env.GITHUB_PAGES;
process.env.GITHUB_PAGES = 'false';
process.env.NEXT_PUBLIC_API_URL = 'https://api.example.test/';

const vercelConfig = (await import('../next.config.mjs?proxy-verification=vercel')).default;
assert.equal(typeof vercelConfig.rewrites, 'function');
assert.deepEqual(await vercelConfig.rewrites(), [
  { source: '/backend/:path*', destination: 'https://api.example.test/:path*' },
]);

process.env.GITHUB_PAGES = 'true';
const staticConfig = (await import('../next.config.mjs?proxy-verification=pages')).default;
assert.equal(staticConfig.output, 'export');
assert.equal(staticConfig.rewrites, undefined);

if (original === undefined) delete process.env.GITHUB_PAGES;
else process.env.GITHUB_PAGES = original;
console.log('API proxy: dynamic Vercel rewrite and GitHub Pages static export verified.');
