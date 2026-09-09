/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(process.env.GITHUB_PAGES === 'true' ? {
    output: 'export',
    basePath: '/uii_design_thinking_hub',
    trailingSlash: true,
    images: { unoptimized: true },
    distDir: '.next-pages',
  } : {}),
};
export default nextConfig;
