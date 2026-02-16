# セキュリティメモ

このスターターは意図的に **server function / server action 的なRPC** を避ける設計なん。

## CSRF

デフォの action フロー：

- `GET` で `vitrio_csrf` cookie をセット（SameSite=Lax）
- SSRでフォームに hidden input `_csrf` として埋め込む
- `POST` で `cookie === formData._csrf` を検証

実装は `src/server/framework.tsx`。

## Cookie

- `vitrio_flash`：**httpOnly**、1回表示したら消す（SSRで `__VITRIO_FLASH__` に埋める）
- `vitrio_csrf`：SSRで埋め込む都合で **httpOnlyにしない**（同一サイト前提）

## 入力検証 / 認可

最小スターターなので未実装。実アプリでは：

- 各 route action で Zod でパース
- action 内でセッション/権限チェック

を足すのが前提。
