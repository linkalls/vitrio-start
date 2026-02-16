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

## Loader

`loader(ctx)` runs during SSR (GET) and is cached by a stable key derived from:

- routeId
- `ctx.location.path`
- `ctx.location.query`
- `ctx.params`

The SSR HTML embeds the dehydrated cache into `globalThis.__VITRIO_LOADER_CACHE__`.

## Action (POST)

`action(ctx, formData)` runs on `POST` matched by `matchPath(route.path, url.pathname)`.

By default the server uses PRG:

- run action
- set flash cookie
- redirect with `303`

## Validation example (recommended)

Use a schema parser in each action (e.g. Zod).

Pseudo-example:

```ts
const schema = z.object({ amount: z.coerce.number().int().min(1).max(100) })

export async function action(ctx, formData: FormData) {
  const input = schema.parse({ amount: formData.get('amount') })
  // ...
}
```
