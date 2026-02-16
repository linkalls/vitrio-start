/**
 * Centralized server configuration.
 * All environment variables and defaults live here.
 */
export const config = {
  /** HTTP listen port */
  port: Number(process.env.PORT || 3000),

  /** Public origin (used for CSRF, absolute URLs, etc.) */
  origin: process.env.ORIGIN || `http://localhost:${Number(process.env.PORT || 3000)}`,

  /** Base path prefix (e.g. "/app"). Empty string = root. */
  basePath: process.env.BASE_PATH || '',

  /** true in production (NODE_ENV=production) */
  isProd: process.env.NODE_ENV === 'production',
} as const
