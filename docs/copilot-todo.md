# vitrio-start / Vitrio Start-alternative — Copilot TODO Dump

目的：**Next.js代替として個人開発で“すぐ使える”**状態にする。
方針：**魔術なし / RPCなし / server functionなし**、HTTP + PRG を中心に、シンプルでAIが理解しやすい構造を維持。

---

## コア方針（絶対）

- server function / server action（クライアントから関数直叩き）を作らない
- ルーティングは「データ構造 + マッチャ」で完結（framework依存を薄く）
- action は **POST** で route に紐づいて実行（PRGが基本）
- SSR は `renderToStringAsync`（Promise throw を許す）
- SSR→CSR は loader cache を dehydrate/hydrate して二重実行を避ける
- 小さいファイル / 直線的な制御フロー / 例外少なめ（AIフレンドリー）

---

## 今ある実装（前提）

- `src/routes.tsx`
  - `routes` + `compiledRoutes`
  - route: `path/loader/action/component`
- `src/server/framework.tsx`
  - `handleDocumentRequest()`
  - GET: SSR + 404 status + loader prime（prefix+leaf対応、paramsマージ）
  - POST: CSRF検証 + prefix+leaf paramsマージ + action 実行 + PRG 303
  - flash cookie (httpOnly, 1-shot)
- `src/server/response.ts`
  - `redirect()` / `notFound()`
  - action/loader がこれを返すと server が反映
- `src/server/form.ts`
  - `parseFormData()` + Zod で入力検証
- テスト
  - PRG/CSRF
  - HTTP status
  - loader redirect/notFound
  - SSR prime (single + prefix/leaf)
  - POST action params merge

---

## TODO: 使えるNext代替にするためにやりたいこと

### ルーティング / データローディング

- [ ] **nested routes の “layout loader” を正式化**
  - prefix (`/p/:id/*`) loader → leaf loader の順で実行
  - leaf側で parent loader の結果を参照したい（例：親が user を取って子が post を取る）
  - ただし魔術的な依存注入は避ける（明示的に渡す）

- [ ] **複数loaderの結果をまとめて dehydrate**
  - すでに cacheMap に複数keyが入るのでOKだが、key/routeIdの設計を整理

- [ ] **loader エラーの扱いを決める**
  - 例：loaderがthrowしたら 500 + エラーページ
  - 例：`notFound()` をthrow/returnしたら 404

- [ ] **URL正規化（trailing slash 等）**
  - `/a` と `/a/` を揃えるかどうか
  - どの層でやるか（server/framework で301/308?）


### Actions / Forms

- [ ] **action の戻り値の型ガイド**
  - `redirect()`
  - `notFound()`
  - `ok`（通常）
  - 「ok時にflashを出す」ルールの明文化

- [ ] **Form helper（クライアントの <Form> を使うかどうか）**
  - 今は HTML form が基本
  - 追加で `<Form>` (Vitrio) の progressive enhancement を “オプション” として整理
  - ただし httpOnly flash を使うなら hard navigation が必要


### セキュリティ（最小で堅い）

- [ ] **CSRF をちゃんと運用可能に**
  - token rotation するか（今はcookie固定）
  - double-submit cookie方式の注意点を docs に追記
  - SameSite=Lax の前提、例外（サードパーティ埋め込み等）

- [ ] **セキュリティヘッダ（最低限）**
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy`
  - `Content-Security-Policy`（最小でも良い）


### DX / 開発体験

- [ ] **ルート追加テンプレを generator でなく docs で徹底**
  - 例：`routes.tsx` にコピペするスニペット

- [ ] **ログの粒度**
  - dev: action/loader 実行ログ
  - prod: 最小

- [ ] **環境変数/設定の置き場所**
  - `src/server/config.ts` に集約
  - `PORT`/`ORIGIN`/`BASE_PATH` など


### テスト / CI

- [ ] **CI workflow (GitHub Actions) を追加**
  - `bun install`
  - `bun run typecheck`
  - `bun test`

- [ ] **E2E を最小で1本**（本当に必要なら）
  - ブラウザで form submit → 303 → flash 表示
  - ただしE2Eは重いので、基本は unit/integration のままでも良い


### 本番向け（必要になったら）

- [ ] **静的アセット配信の整理**
  - `dist/client` の配信
  - cache headers

- [ ] **streaming SSR**（必要になってから）
  - いまは `renderToStringAsync` で十分


### Vitrio 本体側（必要なら）

- [ ] **SSR priming の公式サポート**
  - いまは `makeRouteCacheKey` を export して手動 prime
  - 将来的に `primeLoaderCache(key, value)` 的なAPIがあると分かりやすい

- [ ] **Route id と cache key のルール整理**
  - `routeId` = `id ?? path` を前提にしている
  - server/framework と一致する契約の docs 化


---

## “魔術なし”であることのチェックリスト

- [ ] クライアントからサーバ関数IDを投げて任意実行してない
- [ ] 実行される action は URL で決まる（matchで決まる）
- [ ] POST後は PRG（303）で状態を確定させる
- [ ] SSRは副作用を最小に（loader/action以外で勝手にDB触らない）

---

## アイデア（将来、でも慎重に）

- [ ] “flash” を cookie じゃなく response body に持たせたい場合の設計
  - ただし server function化しない

- [ ] “JSON endpoints” を増やす場合の設計
  - `GET /__data?...` みたいな魔術はやらない
  - 明示的な API route だけ（必要になってから）
