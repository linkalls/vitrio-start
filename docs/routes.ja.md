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

## コピペ用スニペット：loader + action

```tsx
import { z } from 'zod'
import { parseFormData } from './server/form'

const mySchema = z.object({ name: z.string().min(1) })

// `routes` 配列に追加：
{
  path: '/my-page',
  loader: async (ctx) => {
    // ctx.params, ctx.search, ctx.location が使える
    return { items: [] }
  },
  action: async (ctx, formData) => {
    const input = parseFormData(formData as FormData, mySchema)
    // DB操作など
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

## ネスト（prefix + leaf）

```tsx
// 親 layout（末尾の `*` で子パスもマッチ）
{
  path: '/dashboard/*',
  loader: async (ctx) => ({ user: await getUser(ctx) }),
  component: ({ data }) => <div>User: {data.user.name}</div>,
},
// 子ページ
{
  path: '/dashboard/settings',
  loader: async (ctx) => ({ settings: await getSettings(ctx) }),
  component: ({ data }) => <div>Settings: …</div>,
},
```

親 loader → 子 loader の順で実行され、params はマージされる。

## Loader

loaderも `redirect()` / `notFound()` を返せる（`src/server/response.ts`）。
GET時はSSR前にサーバがそれを適用する。

`loader(ctx)` は SSR(GET) で走って、
だいたい次の情報で作ったキーでキャッシュされる：

- routeId
- `ctx.location.path`
- `ctx.location.query`
- `ctx.params`

SSR HTMLは `globalThis.__VITRIO_LOADER_CACHE__` に dehydrate した内容を埋め込む。

loader が予期しないエラーを throw したら **500** + エラーページ
（devではstack trace表示、prodでは非表示）。

## Action（POST）

`action(ctx, formData)` は `POST` で、
ルートマッチしたものが実行される。

デフォは PRG：

- action実行
- flash cookie セット
- `303` リダイレクト

**action の戻り値ガイド：**

| Return | 挙動 |
|--------|------|
| `redirect(url)` | 明示 redirect（flash なし） |
| `notFound()` | flash(ok=false) + 303 redirect |
| `{ …any }` | flash(ok=true) + 303 redirect（通常の "ok"） |

`ActionResult` 型は `src/server/response.ts` 参照。

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
