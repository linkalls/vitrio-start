# セキュリティメモ

このスターターは意図的に **server function / server action 的なRPC** を避ける設計なん。

## CSRF — Double-Submit Cookie 方式

デフォの action フロー：

- `GET` で `vitrio_csrf` cookie をセット（SameSite=Lax）
- SSRでフォームに hidden input `_csrf` として埋め込む
- `POST` で `cookie === formData._csrf` を検証

実装は `src/server/framework.tsx`。

### 注意点

| 項目 | 状態 |
|------|------|
| Token rotation | 現在は初回生成後は固定。必要に応じてアクション成功後に再生成する拡張が可能 |
| `SameSite=Lax` | POST が同一オリジンから来ることが前提。サードパーティ iframe 内 form submit には対応しない |
| `Secure` 属性 | 本番では HTTPS を前提に `Secure` を追加すべき |
| サブドメイン | cookie scope が `/` のため同一ドメイン限定。サブドメイン分離が必要な場合は `Domain` を明示 |

### フォームのチェックリスト

1. `<input type="hidden" name="_csrf" value={csrfToken} />` を必ず含める
2. JS の fetch で POST する場合は cookie 値を `_csrf` body field に含める
3. token を URL に含めない

## セキュリティヘッダ

document レスポンスに以下のヘッダを自動付与：

| ヘッダ | 値 |
|--------|-----|
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'` |

`setSecurityHeaders()` として `src/server/framework.tsx` に実装。
プロジェクトに合わせて CSP を厳しくすること。

## Cookie

- `vitrio_flash`：**httpOnly**、1回表示したら消す（SSRで `__VITRIO_FLASH__` に埋める）
- `vitrio_csrf`：SSRで埋め込む都合で **httpOnlyにしない**（同一サイト前提）

## 入力検証 / 認可

最小スターターなので未実装。実アプリでは：

- 各 route action で Zod でパース
- action 内でセッション/権限チェック

を足すのが前提。
