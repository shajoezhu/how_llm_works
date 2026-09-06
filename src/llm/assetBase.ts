// Base-path prefix for public assets (e.g. "/how_llm_works" on GitHub Pages project sites).
// Mirrors next.config `basePath`. NEXT_PUBLIC_BASE_PATH is inlined into client bundles at build
// time by Next.js, so runtime fetches (wasm, fonts, model json) can prefix the correct path.
export const ASSET_BASE: string = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
