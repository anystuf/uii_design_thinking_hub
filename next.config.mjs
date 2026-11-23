/** @type {import('next').NextConfig} */
const githubPages = process.env.GITHUB_PAGES === 'true';
const configuredApi = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const upstream = configuredApi.replace(/\/+$/, '');
const apiUrl = new URL(upstream);
if (!['http:', 'https:'].includes(apiUrl.protocol) || apiUrl.username || apiUrl.password) {
  throw new Error('NEXT_PUBLIC_API_URL must be an HTTP(S) API origin without embedded credentials.');
}

const nextConfig = {
  reactStrictMode: true,
  ...(githubPages ? {
    output: 'export',
    basePath: '/uii_design_thinking_hub',
    trailingSlash: true,
    images: { unoptimized: true },
    distDir: '.next-pages',
  } : {
    // Browsers on Vercel use a same-origin /backend endpoint. An external
    // rewrite carries the request to the trusted configured API; CORS no
    // longer depends on changing preview deployment hostnames.
    async rewrites() {
      return [{ source: '/backend/:path*', destination: upstream + '/:path*' }];
    },
  }),
};
export default nextConfig;
