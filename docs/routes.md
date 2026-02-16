# Routes (template)

Routes live in `src/routes.tsx`.

This project intentionally keeps routing as plain data.

## Minimal route

```tsx
export const routes = [
  {
    path: '/',
    loader: () => ({ now: Date.now() }),
    component: ({ data }) => <div>{data.now}</div>,
  },
]
```

## Copy-paste snippet: loader + action

```tsx
import { z } from 'zod'
import { parseFormData } from './server/form'

const mySchema = z.object({ name: z.string().min(1) })

// Add to `routes` array:
{
  path: '/my-page',
  loader: async (ctx) => {
    // ctx.params, ctx.search, ctx.location
    return { items: [] }
  },
  action: async (ctx, formData) => {
    const input = parseFormData(formData as FormData, mySchema)
    // DB operation etc.
    return { saved: true }
  },
  component: ({ data, csrfToken }) => (
    <div>
      <h1>My Page</h1>
      <form method="post">
        <input type="hidden" name="_csrf" value={csrfToken} />
        <input name="name" />
        <button type="submit">Save</button>
      </form>
    </div>
  ),
},
```

## Nested routes (prefix + leaf)

```tsx
// Parent layout (the trailing `*` matches child paths too)
{
  path: '/dashboard/*',
  loader: async (ctx) => ({ user: await getUser(ctx) }),
  component: ({ data }) => <div>User: {data.user.name}</div>,
},
// Child page
{
  path: '/dashboard/settings',
  loader: async (ctx) => ({ settings: await getSettings(ctx) }),
  component: ({ data }) => <div>Settings: …</div>,
},
```

Parent loader runs first, then child loader. Params are merged.

## Loader

Loader may also return `redirect()` / `notFound()` (see `src/server/response.ts`).
On GET, the server will apply it before SSR.

`loader(ctx)` runs during SSR (GET) and is cached by a stable key derived from:

- routeId
- `ctx.location.path`
- `ctx.location.query`
- `ctx.params`

The SSR HTML embeds the dehydrated cache into `globalThis.__VITRIO_LOADER_CACHE__`.

If a loader throws an unexpected error, the server responds with **500** and an
error page (stack trace shown in dev, hidden in prod).

## Action (POST)

`action(ctx, formData)` runs on `POST` matched by the route matcher.

By default the server uses PRG:

- run action
- set flash cookie
- redirect with `303`

**Action return values:**

| Return | Behaviour |
|--------|-----------|
| `redirect(url)` | Explicit redirect (no flash) |
| `notFound()` | flash(ok=false) + 303 redirect |
| `{ …any }` | flash(ok=true) + 303 redirect (normal "ok") |

See `ActionResult` type in `src/server/response.ts`.

## Validation example (recommended)

Use a schema parser in each action (e.g. Zod).

This repo includes a tiny helper: `src/server/form.ts` → `parseFormData()`.

```ts
import { z } from 'zod'
import { parseFormData } from './server/form'

const schema = z.object({ amount: z.coerce.number().int().min(1).max(100) })

export async function action(ctx, formData: FormData) {
  const input = parseFormData(formData, schema)
  // ...
}
```
