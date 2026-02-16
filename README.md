# vitrio-start

A Bun-first, performance-first SSR starter for **Vitrio**.

Goal: a *Next.js / TanStack Start alternative* for individual projects, but simpler.

## Dev

```bash
bun install
bun run dev
```

Open http://localhost:3000

## Build

```bash
bun run build
bun run start
```

## Notes

- This is the **first cut**: SSR `renderToString` + client re-render (no hydration yet).
- Routing uses `@potetotown/vitrio` router.
