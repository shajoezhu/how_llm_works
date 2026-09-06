# LLM 可视化（LLM Visualization）— 中文版

A Simplified-Chinese localized fork of the [LLM Visualization](https://github.com/bbycroft/llm-viz) — a 3D, interactive model of a GPT-style LLM network running inference. This fork translates the UI into Simplified Chinese and adds a DeepSeek-V3 scale illustration.

## 在线演示 / Live demo
Deployed to GitHub Pages: **https://shajoezhu.github.io/how_llm_works/**

- The root URL shows the visualization directly.
- The header **Home** button links to https://shajoezhu.github.io/ (the author's personal site).

## What's included
- **nano-gpt** (default): the toy network that sorts the letters A, B, C — the demo example from Andrej Karpathy's [minGPT](https://github.com/karpathy/minGPT).
- **DeepSeek-V3（规模示意）**: a scale-only shell illustrating DeepSeek-V3's real hyperparameters (671B total / 37B activated, 61 layers, 128 heads, MLA + MoE). The 3D render is a skeleton (the renderer has no MLA/MoE concept); a "DeepSeek 对比" walkthrough chapter explains the differences in detail.
- The GPT-2 / GPT-3 model entries are hidden from the selector, but their code is retained.

## Run locally
Requires **Node.js 20** (the system Node may be older).

```bash
npm install --legacy-peer-deps
npm run dev          # http://localhost:3002/llm
```

Both the root `/` and `/llm` show the visualization. `basePath` is applied only for production builds, so local URLs are unprefixed.

For a production static export:

```bash
npm run build        # outputs to out/  (output: 'export')
```

## Deploy (GitHub Pages)
A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the static export and deploys it. To use:

1. Enable **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `main`; the workflow builds and deploys automatically.

Notes:
- The repo is expected to be named **`how_llm_works`** (matching `basePath` in `next.config.js`). If you rename it, set `NEXT_PUBLIC_BASE_PATH` to your repo name at build time.
- The `/cpu` (RISC-V simulator) section is excluded from the deployed build (it has a dynamic API route that cannot be statically exported), but it remains in the source tree for local development.

## License
MIT (see [`LICENSE`](LICENSE)).
