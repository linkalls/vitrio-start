/**
 * Centralized server configuration.
 * All environment variables and defaults live here.
 *
 * NOTE: This project targets Cloudflare Workers, where `process` is not defined.
 * Use `env` bindings (from `wrangler.toml` vars / `wrangler deploy --var`) or
 * `import.meta.env` for Vite client code.
 */

type EnvLike = Record<string, string | undefined>

function getEnv(): EnvLike {
  // Cloudflare Workers: bindings are provided on the Fetch handler as `env`.
  // We stash them on globalThis in the Worker entry for reuse.
  const fromGlobal = (globalThis as any).__VITRIO_ENV as EnvLike | undefined
  if (fromGlobal) return fromGlobal

  // Local dev / Node-based tooling fallback.
  const fromProcess = (globalThis as any).process?.env as EnvLike | undefined
  return fromProcess ?? {}
}

const env = getEnv()

/** HTTP listen port (used in Node dev; Workers ignore listen ports) */
const port = Number(env.PORT || 3000)

export const config = {
  port,

  /** Public origin (used for CSRF, absolute URLs, etc.) */
  origin: env.ORIGIN || `http://localhost:${port}`,

  /** Base path prefix (e.g. "/app"). Empty string = root. */
  basePath: env.BASE_PATH || '',

  /** true in production */
  isProd: env.NODE_ENV === 'production',

  /** Log level for debugging (debug, info, warn, error) */
  logLevel: env.LOG_LEVEL || (env.NODE_ENV === 'production' ? 'warn' : 'info'),

  /** Trust proxy headers (X-Forwarded-For, etc.) */
  trustProxy: env.TRUST_PROXY === 'true' || false,

  /**
   * Security Headers Configuration
   * Provides sensible defaults for a secure-by-default posture.
   */
  security: {
    /** HTTP Strict Transport Security (HSTS) */
    hsts: env.HSTS !== 'false',
    /** X-Frame-Options (DENY, SAMEORIGIN, or 'false' to disable) */
    frameOptions: env.FRAME_OPTIONS === 'false' ? false : (env.FRAME_OPTIONS || 'DENY'),
    /** Content Security Policy (CSP). Default allows inline scripts/styles for dehydration. */
    csp: env.CSP || "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  }
}
