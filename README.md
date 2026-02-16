# vitrio-start

Bun-first SSR starter for **Vitrio**.

Goal: a *Next.js alternative* for individual projects, but **super simple**:

- **No server function / server action RPC magic**
- **Plain HTTP** + **PRG** (POST → Redirect → GET)
- Small files, obvious control flow (AI-friendly)

## Docs

- `docs/overview.md` / `docs/overview.ja.md`
- `docs/security.md` / `docs/security.ja.md`

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

## How it works (very short)

- Routes are defined in `src/routes.tsx` as data (path/loader/action/component)
- The server uses `src/server/framework.tsx`:
  - `POST` runs the matched route action and redirects with `303`
  - `GET` SSR-renders with `renderToStringAsync`
  - loader cache is dehydrated into `__VITRIO_LOADER_CACHE__`
  - flash cookie is embedded into `__VITRIO_FLASH__` (1-shot)
  - CSRF is cookie token + hidden input
