# Overview

`vitrio-start` is a **Bun-first SSR starter** built on **Vitrio**.

The goal is a *Next.js / TanStack Start alternative* for individual projects, but with:

- **No “server function / server action” RPC magic**
- **Plain HTTP** (GET for documents, POST for actions)
- **PRG** (Post → Redirect → Get) by default
- Small, obvious files that are **AI-friendly**

## Key idea

Routes are defined as a simple data structure in `src/routes.tsx`:

- `path`
- `loader` (GET)
- `action` (POST)
- `component` (UI)

Server routing is just:

1. Match route by pathname
2. If `POST` and route has `action`, execute it
3. Redirect with `303` (PRG)
4. Render the HTML document with `renderToStringAsync`

## File map

- `src/routes.tsx`
  - Route definitions (path/loader/action/component)
  - HTML `<form method="post">` is the default

- `src/server/framework.tsx`
  - The minimal “framework core”
  - One handler: `handleDocumentRequest(c, routes, { title, entrySrc })`
  - Implements:
    - SSR (`renderToStringAsync`)
    - loader cache dehydrate (embed `__VITRIO_LOADER_CACHE__`)
    - action dispatch (POST)
    - PRG redirect (`303`)
    - flash cookie (1-shot)
    - CSRF token check

- `src/server/index.tsx`
  - Production entry (static assets + `handleDocumentRequest`)

- `src/server/dev.tsx`
  - Dev entry (serves `/src/*` etc. + `handleDocumentRequest`)

- `src/client/entry.tsx`
  - Client entry
  - `hydrateLoaderCache(__VITRIO_LOADER_CACHE__)`
  - Reads `__VITRIO_FLASH__` and displays a banner

## Non-goals (for now)

- No component-level server actions
- No RPC endpoints
- No automatic cache invalidation graph beyond PRG + loader cache keys
