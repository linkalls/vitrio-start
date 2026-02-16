# Copilot Agent Brief — vitrio-start (Next.js-like, but no magic)

このファイルは **GitHub Copilot Agent / Copilot CLI** にそのまま渡す用の「完全仕様メモ」なん。

狙い：**Next.js代替として個人開発で“普通に使える”**。
ただし：**TanStack Startみたいな魔術／Nextのserver function(server actions) 的なRPC**はやらない。

- HTTPの基本でやる（GET document / POST action）
- デフォは PRG（POST → 303 → GET）
- ルーティングは data + matcher で明示
- 小さいファイル、見通し良く、AIが追える

---

## Non-goals（絶対やらない）

- クライアントから「関数ID」や「シリアライズ関数」を送ってサーバで実行する仕組み
- 自動生成される謎エンドポイント（`/__data` とか）
- ルート定義をコンパイルする大規模魔術

---

## 現状（リポジトリ前提）

### ファイル

- `src/routes.tsx`
  - `routes` / `compiledRoutes`
  - route: `{ path, loader?, action?, component }`
- `src/server/framework.tsx`
  - `handleDocumentRequest(c, compiledRoutes, { title, entrySrc })`
  - GET: URL正規化、security headers、SSR、404 status、loader prime（prefix+leaf+params merge）
  - POST: CSRF、params merge、action、PRG、flash
- `src/server/response.ts`
  - `redirect()` / `notFound()`
- `src/server/match.ts`
  - `compilePath()` / `matchCompiled()`
- `src/server/form.ts`
  - `parseFormData()`（Zod parse）

### 既にある機能（重要）

- PRG
- flash cookie（httpOnly / 1-shot）
- CSRF（cookie token + hidden input）
- SSR loader prime（SSRでloader二重実行を防ぐ）
- loader/action の redirect/notFound（戻り値）
- 404/500 status
- minimal tests + perf benches

---

## Roadmap（Copilotにやってほしいこと）

### A. CLI（Next.jsっぽく `bunx` で作れるように）

**目標**：

- `bunx create-vitrio-start my-app`
  - テンプレ生成
  - `package.json` / scripts / tsconfig / vite config
  - 初期 `src/routes.tsx`（例ルート）
  - 初期 `src/server/framework.tsx` 等
  - `bun install` を実行するかはオプション

**実装案**（推奨）：

- 新しい別repo（例：`linkalls/create-vitrio-start`）か、monorepo化
- `bin` 付きの Node/Bun スクリプトでテンプレをコピー
- テンプレは `templates/default/*` に置く
- 依存は最小：`fs`, `path`、必要なら `picocolors` 程度

**CLIの要件**：

- `--no-install` オプション
- `--name`（任意）
- bun前提（npm/yarnは考えない）
- 生成物は “魔術なし” を維持


### B. DX（使い始めの気持ち良さ）

- `README.md` に「30秒で動かす」セクション追加
  - `bunx create-vitrio-start`
  - `cd` → `bun install` → `bun dev`

- `docs/` に「route追加のコピペテンプレ」増やす
  - loader/action/validation/redirect/notFound


### C. アセット配信（本番で困らない最低限）

- `src/server/index.tsx` の static assets 配信に cache headers を追加
  - `assets/*` に `Cache-Control: public, max-age=31536000, immutable`
  - HTMLはキャッシュしない

- 本番/開発で挙動がズレないようにする


### D. エラーページ（見た目）

- 500/404 の HTML をもうちょい見やすく
  - ただし依存は増やさない
  - 500はprodだと詳細隠す（現状あり）

（※UIをVitrio側で作りたい場合は別途検討。まずはserver側HTMLでOK）


### E. ルート/loader/action の契約を固める

- `RouteDef` の型を整理
  - `loader` / `action` 戻り値の union（`redirect/notFound`）を型レベルで表現

- `routeId` と `cache key` の契約を docs 化
  - SSR prime と CSR cache が一致する前提


### F. テスト/CI

- GitHub Actions で
  - typecheck
  - bun test
  - （任意）benchの定期実行はしない

- 既存テストを壊さない

---

## “魔術なし”チェックリスト（レビュー用）

- [ ] クライアントからサーバ関数を直接呼んでない（RPC化してない）
- [ ] actionはURLマッチで決まる
- [ ] POST後はPRGがデフォ
- [ ] 入力はZod等でパースする
- [ ] CSRFがある
- [ ] SSRでloaderが二重実行されない（primeされてる）

---

## 追加メモ（Copilot向け）

- 既存コードの思想："super simple" を最優先
- 依存追加は慎重に
- 何かを増やすなら **docs + tests** を一緒に足す
