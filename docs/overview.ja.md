# 概要

`vitrio-start` は **Bun-first** の **Vitrio SSRスターター**なん。

狙いは *Next.js / TanStack Start の代替*だけど、
**個人開発向けに “魔術なしでシンプル”** を最優先にしてる。

- **server function / server action 的なRPC魔術はしない**
- **HTTPの基本だけ**（GET=ドキュメント、POST=アクション）
- デフォは **PRG**（POST → Redirect → GET）
- ファイルが小さくて見通しが良い（= **AIフレンドリー**）

## コアの考え方

ルートは `src/routes.tsx` に **ただのデータ構造**として置く：

- `path`
- `loader`（主にGET）
- `action`（主にPOST）
- `component`（UI）

サーバ側はひたすらこれだけ：

1. pathnameでルート一致判定
2. `POST` で route に `action` があれば実行
3. **303** でリダイレクト（PRG）
4. `renderToStringAsync` でHTMLをSSR

## ファイル構成

- `src/routes.tsx`
  - ルート定義（path/loader/action/component）
  - フォームは基本 **HTML `<form method="post">`**

- `src/server/framework.tsx`
  - 最小の “フレームワーク本体”
  - `handleDocumentRequest(c, routes, { title, entrySrc })` が中核
  - ここに全部まとまってる：
    - SSR（`renderToStringAsync`）
    - loader cache の dehydrate（`__VITRIO_LOADER_CACHE__` をHTMLへ埋め込み）
    - action dispatch（POST）
    - PRG（`303`）
    - flash cookie（1回だけ表示）
    - CSRFチェック

- `src/server/index.tsx`
  - 本番エントリ（static assets + `handleDocumentRequest`）

- `src/server/dev.tsx`
  - 開発エントリ（`/src/*`配信 + `handleDocumentRequest`）

- `src/client/entry.tsx`
  - クライアントエントリ
  - `hydrateLoaderCache(__VITRIO_LOADER_CACHE__)`
  - `__VITRIO_FLASH__` を読んでバナー表示

## いまはやらない（Non-goals）

- コンポーネント単位の server action
- RPCエンドポイント
- PRG以外の複雑なキャッシュ無効化魔術
