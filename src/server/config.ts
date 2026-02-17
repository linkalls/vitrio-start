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
}
