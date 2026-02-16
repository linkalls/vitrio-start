# vitrio-start

Bun-first SSR starter for **Vitrio**.

Goal: a *Next.js alternative* for individual projects, but **super simple**:

- **No server function / server action RPC magic**
- **Plain HTTP** + **PRG** (POST → Redirect → GET)
- Small files, obvious control flow (AI-friendly)

## Quick Start (30 seconds)

### Option 1: Clone Repository

```bash
# Clone and setup
git clone https://github.com/linkalls/vitrio-start.git my-app
cd my-app
bun install

# Start development server
bun run dev
```

### Option 2: Use Create Script (Recommended)

```bash
# Create a new project
bun scripts/create.ts my-app

# Or skip dependency installation
bun scripts/create.ts my-app --no-install
```

Open http://localhost:3000

That's it! You now have a working SSR app with:
- ✅ Server-side rendering
- ✅ Form actions with PRG pattern
- ✅ CSRF protection
- ✅ Flash messages
- ✅ Hot reload in development
- ✅ Vite for fast client builds

## Docs

### Getting Started
- `docs/overview.md` / `docs/overview.ja.md` - Framework overview
- `docs/adding-routes.md` - Quick reference for adding routes with examples
- `docs/examples.md` - Complete working examples (login, protected routes, forms)

### Advanced
- `docs/route-contracts.md` - Loader/action contracts and cache behavior
- `docs/ai-conventions.md` - AI-friendly conventions and project structure
- `docs/routes.md` / `docs/routes.ja.md` - Routing details
- `docs/security.md` / `docs/security.ja.md` - Security features
- `docs/testing.md` - Testing guide

### Performance
- `docs/perf.md` / `docs/perf-hono.md` - Performance benchmarks

## Dev

```bash
bun install
bun run dev
```

Open http://localhost:3000

### Development Architecture

Vitrio-start uses **Vite** as the default client dev/build tool:

- **Development**: Vite serves source files directly from `/src/*` with hot reload
- **Production**: `bun run build` creates optimized bundles in `dist/client/assets/`
- **Assets**: Built files include content hashes and are served with immutable cache headers

The development server (`bun run dev`) starts both:
1. The Hono server for SSR and API routes
2. Vite's development module server for client-side code

## Build

```bash
bun run build
bun run start
```

## How it works (very short)

- Routes are defined in `src/routes.tsx` as data (path/loader/action/component)
- The server uses `src/server/framework.tsx`:
  - `POST` runs the matched route action (via `matchPath`) and redirects with `303`
  - `GET` SSR-renders with `renderToStringAsync`
  - loader cache is dehydrated into `__VITRIO_LOADER_CACHE__`
  - flash cookie is embedded into `__VITRIO_FLASH__` (1-shot)
  - CSRF is cookie token + hidden input

## Input validation

This repo uses **Zod** for action input parsing.

- Helper: `src/server/form.ts` → `parseFormData(formData, schema)`
- Example: `src/routes.tsx` (`counterAction`)

## Test

```bash
bun test
```

Includes a minimal PRG/CSRF test: `tests/prg-csrf.spec.ts`.

## Perf

```bash
bun run bench:match
bun run bench:hono
```

See `docs/perf.md` and `docs/perf-hono.md`.
