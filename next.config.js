/** @type {import('next').NextConfig} */

let withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
});

// GitHub Pages *project* sites are served under /<repo>. So the built site must be prefixed
// with the repo name. We only apply it for production builds so that local `npm run dev`
// (served at http://localhost:3002/llm, no prefix) keeps working unchanged.
// Override at build time with NEXT_PUBLIC_BASE_PATH if your repo is named differently.
const basePath = process.env.NODE_ENV === "production"
    ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "/how_llm_works")
    : "";

const nextConfig = {
    reactStrictMode: false,
    productionBrowserSourceMaps: true,
    // Always static HTML export for Cloudflare Pages / GitHub Pages / any static host.
    // Dev-only file-write tooling lives outside the App Router (see scripts/dev-schematic-api.mjs).
    output: 'export',
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
    // Expose the base path to client bundles so runtime asset fetches can prefix it.
    env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

module.exports = withBundleAnalyzer(nextConfig);
