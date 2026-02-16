# Security notes

This project intentionally avoids server-function style RPC.

## CSRF

The default action flow is:

- `GET` sets a `vitrio_csrf` cookie (SameSite=Lax)
- SSR embeds the same token into forms as a hidden input `_csrf`
- `POST` verifies `cookie === formData._csrf`

This is implemented in `src/server/framework.tsx`.

## Cookies

- `vitrio_flash` is **httpOnly** and 1-shot (cleared after embedding into HTML)
- `vitrio_csrf` is **not httpOnly** because it must be embedded in SSR HTML (still same-site)

## Validation / Auth

Not implemented by default. Add:

- input parsing with Zod in each route action
- auth/session checks inside actions
