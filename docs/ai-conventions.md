# AI-Friendly Conventions

This document outlines the conventions used in vitrio-start that make it easy for AI agents (like GitHub Copilot) to understand and modify the codebase.

## Core Principles

1. **No Magic** - Everything is explicit. No hidden code generation, no implicit endpoints.
2. **Predictable Structure** - Files are organized in a consistent, discoverable way.
3. **Small Files** - Each file has a single, clear responsibility.
4. **Plain HTTP** - Routes use standard HTTP methods (GET/POST), not RPC.

---

## Project Structure

```
vitrio-start/
├── src/
│   ├── routes.tsx              # Route definitions (single source of truth)
│   ├── client/
│   │   └── entry.tsx           # Client entry point
│   └── server/
│       ├── index.tsx           # Production server
│       ├── dev.tsx             # Development server
│       ├── framework.tsx       # SSR & request handling logic
│       ├── app.tsx             # Root app component
│       ├── match.ts            # Route matching utilities
│       ├── response.ts         # Response helpers (redirect, notFound)
│       ├── form.ts             # Form validation helper
│       └── config.ts           # Server configuration
├── docs/                       # Documentation
├── tests/                      # Tests
└── scripts/                    # Build/bench scripts
```

---

## Conventions by Concern

### 1. Route Definitions (`src/routes.tsx`)

**Principle**: All routes are defined in one place as data, not spread across the filesystem.

```tsx
export const routes: RouteDef[] = [
  {
    path: '/users/:id',
    loader: userLoader,
    action: updateUserAction,  // optional
    component: UserPage,
  },
  // ... more routes
]
```

**Why AI-friendly:**
- Single file to find all application routes
- Data structure is easy to parse
- No filesystem traversal needed
- Clear relationship between path, loader, action, and component

---

### 2. Server Framework (`src/server/framework.tsx`)

**Principle**: One file contains the entire request handling flow.

The `handleDocumentRequest` function:
1. Normalizes URLs (removes trailing slash)
2. Sets security headers
3. Handles POST actions (with CSRF check)
4. Runs loaders for GET requests
5. Performs SSR
6. Returns HTML

**Why AI-friendly:**
- Linear control flow (no hidden middleware)
- All security logic is in one place
- Easy to trace from request → response

---

### 3. Response Helpers (`src/server/response.ts`)

**Principle**: Special responses (redirect, notFound) are explicit objects, not thrown errors.

```tsx
// Loaders and actions can return these
export function redirect(to: string, status = 302) {
  return { _tag: 'redirect', to, status }
}

export function notFound(status = 404) {
  return { _tag: 'notFound', status }
}
```

**Why AI-friendly:**
- No magic thrown errors
- Clear return types
- Easy to understand control flow

---

### 4. Form Validation (`src/server/form.ts`)

**Principle**: Use Zod for type-safe form parsing.

```tsx
import { parseFormData } from './server/form'

const schema = z.object({
  email: z.string().email(),
  age: z.coerce.number().int().min(18),
})

async function myAction(ctx: any, formData: FormData) {
  const input = parseFormData(formData, schema)
  // input is typed!
  console.log(input.email, input.age)
}
```

**Why AI-friendly:**
- Single helper for all form validation
- Schema co-located with action
- Type-safe

---

### 5. Route Matching (`src/server/match.ts`)

**Principle**: Routes are compiled once at startup and matched at runtime.

```tsx
// Compile at app start
const compiledRoutes = routes.map(r => ({
  ...r,
  _compiled: compilePath(r.path)
}))

// Match at runtime
const params = matchCompiled(compiledRoute._compiled, url.pathname)
```

**Why AI-friendly:**
- Clear separation of compile-time and runtime
- No hidden regex generation
- Explicit `_compiled` field

---

### 6. Loaders Run Once in SSR

**Principle**: Loaders execute on the server during SSR, and their results are "primed" into the client cache to prevent double execution.

**Flow:**
1. Server runs loaders during SSR
2. Results are serialized into `__VITRIO_LOADER_CACHE__`
3. Client hydrates and uses cached results
4. On client navigation, loaders run again on the client

**Why AI-friendly:**
- No hidden data fetching
- Clear cache key contract: `makeRouteCacheKey(routePath, ctx)`
- Explicit serialization in HTML

---

### 7. PRG Pattern (POST-Redirect-GET)

**Principle**: All POST actions redirect to a GET page.

**Flow:**
1. User submits form → POST `/path`
2. Server runs action
3. Server redirects → 303 to `/path` (or custom redirect)
4. Browser loads → GET `/path`

**Why AI-friendly:**
- Standard HTTP pattern
- No client-side state management needed for forms
- Flash cookie carries one-time message

---

### 8. CSRF Protection

**Principle**: Cookie + hidden form field, validated on every POST.

```tsx
// Framework ensures CSRF cookie exists
const csrfToken = ensureCsrfCookie(c)

// Component receives token
component: ({ csrfToken }) => (
  <form method="post">
    <input type="hidden" name="_csrf" value={csrfToken} />
    {/* ... */}
  </form>
)

// Framework validates on POST
if (!verifyCsrf(c, formData)) {
  return { kind: 'csrf-fail' }
}
```

**Why AI-friendly:**
- Always the same pattern
- No configuration needed
- Clear security boundary

---

### 9. Error Pages

**Principle**: Error pages are rendered inline, not as separate routes.

- **404**: Rendered when no route matches (still returns full React app with catch-all route)
- **500**: Rendered when loader throws an error

**Why AI-friendly:**
- Error logic is in `framework.tsx`, not scattered
- Status codes are explicit

---

### 10. Development vs Production

**Principle**: Separate server files for clarity.

- `src/server/dev.tsx` - Development server (serves Vite modules)
- `src/server/index.tsx` - Production server (serves built assets)

Both use the same `handleDocumentRequest` function.

**Why AI-friendly:**
- Clear separation of concerns
- No environment-specific branching in core logic

---

## How to Modify

### Adding a New Route

1. Add to `src/routes.tsx`
2. Define loader/action if needed (inline or separate function)
3. That's it!

### Adding a New Helper

1. Create a new file in `src/server/` (e.g., `auth.ts`)
2. Export functions
3. Import where needed

### Changing Request Handling Logic

1. Edit `src/server/framework.tsx`
2. The entire flow is in `handleDocumentRequest`

---

## Anti-Patterns (What We Avoid)

❌ **Filesystem-based routing** - We use data-driven routes  
❌ **Server actions as RPC** - We use plain HTTP POST  
❌ **Hidden code generation** - Everything is explicit  
❌ **Scattered middleware** - Logic is centralized  
❌ **Magic imports** - No special `use server` or `use client` directives  

---

## Summary

Vitrio-start is designed to be **transparent** and **predictable**:

- Routes are data in `routes.tsx`
- Request handling is in `framework.tsx`
- Helpers are in `server/*.ts`
- No magic, no code generation
- AI agents can easily understand and modify the entire codebase by reading a few key files

This makes it ideal for AI-assisted development while remaining simple for humans too.
