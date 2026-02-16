# Deploy: Cloudflare Workers

This starter can run on Cloudflare Workers.

## Summary

- The SSR handler is framework-agnostic: `src/server/framework.tsx`
- The Workers entry is `src/server/workers.ts`
- Workers does not provide Bun FS APIs.
  - Serve static assets via **Cloudflare Pages** (recommended), or
  - Configure **Workers Static Assets** in `wrangler.toml`.

## Build

```bash
bun install
bun run build
```

This produces `dist/client` via Vite.

## Deploy (wrangler)

Install wrangler (dev dependency) and deploy:

```bash
bunx wrangler deploy
```

## Notes

- The worker is configured to use `entrySrc: /assets/entry.js`.
- This repo makes that explicit and stable:
  - `bun run build` runs Vite, then `scripts/fix-entry.js` copies the chosen built JS to `dist/client/assets/entry.js`.
