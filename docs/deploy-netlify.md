# Deploy: Netlify

This starter can run on Netlify using a Netlify Function.

## Summary

- SSR handler core: `src/server/framework.tsx`
- Netlify function entry: `src/server/netlify.ts`
- Static assets: `dist/client` (Vite build)

## Setup

Netlify expects the function bundle at `netlify/functions/server`.
You can build it with your preferred bundler.

This repo keeps things explicit (no magic): you decide how to bundle the function.

## Suggested approach

- Use Netlify static hosting for `dist/client`
- Bundle `src/server/netlify.ts` into `netlify/functions/server.mjs`

## `netlify.toml`

A minimal `netlify.toml` is included.

## Notes

- This file references `entrySrc: /assets/entry.js`.
  - As with Workers, you should map your built entry to a stable path.
  - Easiest: copy/rename your Vite entry to `dist/client/assets/entry.js`.
