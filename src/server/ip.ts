import { config } from './config'

/**
 * Extracts the client IP from a Request object.
 *
 * If `config.trustProxy` is true, it will check the `X-Forwarded-For` header first.
 * If false, or if the header is missing, it falls back to extracting the IP from
 * the underlying socket, though in Worker environments this often relies solely on headers
 * or platform-specific extensions like `req.headers.get('CF-Connecting-IP')`.
 *
 * @param req The Fetch Request object
 * @returns The extracted IP string, or 'unknown'
 */
export function getClientIp(req: Request): string {
  if (config.trustProxy) {
    // Check standard proxy header
    const xForwardedFor = req.headers.get('x-forwarded-for')
    if (xForwardedFor) {
      // It can be a comma-separated list of IPs. The first is typically the client.
      const firstIp = xForwardedFor.split(',')[0].trim()
      if (firstIp) return firstIp
    }

    // Cloudflare-specific header
    const cfIp = req.headers.get('cf-connecting-ip')
    if (cfIp) return cfIp

    // Fastly / Vercel
    const trueClientIp = req.headers.get('true-client-ip')
    if (trueClientIp) return trueClientIp

    // Fly.io
    const flyClientIp = req.headers.get('fly-client-ip')
    if (flyClientIp) return flyClientIp
  }

  // Fallback for Bun local dev server (Bun specific `server.requestIP`)
  // Not standardized in Fetch API, but available if you inject it or check process env.
  // In a pure Worker setup, if proxy headers aren't trusted or present, we just return 'unknown'
  return 'unknown'
}
