# Security notes

This project intentionally avoids server-function style RPC.

## CSRF — Double-Submit Cookie

The default action flow is:

- `GET` sets a `vitrio_csrf` cookie (SameSite=Lax)
- SSR embeds the same token into forms as a hidden input `_csrf`
- `POST` verifies `cookie === formData._csrf`

This is implemented in `src/server/framework.tsx`.

### Caveats

| Item | Status |
|------|--------|
| Token rotation | Currently fixed after first generation. Can be rotated after each successful action if needed. |
| `SameSite=Lax` | Assumes POST originates from the same origin. Third-party iframe form submissions are not supported. |
| `Secure` attribute | Should be added in production (HTTPS). |
| Subdomain | Cookie scope is `/` (same-domain only). Set `Domain` explicitly for subdomain isolation. |

### Checklist for every form

1. Include `<input type="hidden" name="_csrf" value={csrfToken} />`
2. For JS `fetch` POST requests, read the cookie and send it as `_csrf` in the body
3. Never expose the token in URLs

## Security Headers

The framework sets the following headers on every document response:

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'` |

These are set in `setSecurityHeaders()` in `src/server/framework.tsx`.
Tighten CSP as needed for your project.

## Cookies

- `vitrio_flash` is **httpOnly** and 1-shot (cleared after embedding into HTML)
- `vitrio_csrf` is **not httpOnly** because it must be embedded in SSR HTML (still same-site)

## Validation / Auth

Not implemented by default. Add:

- input parsing with Zod in each route action
- auth/session checks inside actions
