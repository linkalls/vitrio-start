# Routes（テンプレ）

ルートは `src/routes.tsx` に置く。

このスターターは「ルーティングをただのデータ」にして、
魔術なしで見通し良くする方針なん。

## 最小ルート

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

`loader(ctx)` は SSR(GET) で走って、
だいたい次の情報で作ったキーでキャッシュされる：

- routeId
- `ctx.location.path`
- `ctx.location.query`
- `ctx.params`

SSR HTMLは `globalThis.__VITRIO_LOADER_CACHE__` に dehydrate した内容を埋め込む。

## Action（POST）

`action(ctx, formData)` は `POST` で、
ルートマッチしたものが実行される。

デフォは PRG：

- action実行
- flash cookie セット
- `303` リダイレクト

## 入力検証（おすすめ）

actionごとに schema パース（Zod等）を入れるのが安全でAIフレンドリー。

このrepoには最小ヘルパが入ってる：`src/server/form.ts` → `parseFormData()`

```ts
import { z } from 'zod'
import { parseFormData } from './server/form'

const schema = z.object({ amount: z.coerce.number().int().min(1).max(100) })

export async function action(ctx, formData: FormData) {
  const input = parseFormData(formData, schema)
  // ...
}
```
