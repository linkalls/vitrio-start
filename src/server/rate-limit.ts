/**
 * Basic in-memory rate limiter foundation.
 *
 * In a real production scenario (e.g. Cloudflare Workers), you would swap this implementation
 * with KV or Durable Objects to support distributed rate limiting.
 * For now, this serves as a simple local/development implementation.
 */

interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  max: number
  /** Time window in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean
  /** How many requests remain in the current window */
  remaining: number
  /** When the rate limit window resets (UNIX timestamp) */
  resetAt: number
}

// In-memory store (IP -> { count, resetAt })
const store = new Map<string, { count: number; resetAt: number }>()

/**
 * Checks if a specific key (e.g. an IP address) has exceeded the rate limit.
 *
 * @param key Unique identifier for the rate limit (e.g., "192.168.1.1:login")
 * @param config Rate limit configuration (max requests and window length)
 * @returns RateLimitResult with status
 */
export async function checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    // New entry or expired window
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return {
      success: true,
      remaining: config.max - 1,
      resetAt: now + config.windowMs,
    }
  }

  // Active window
  if (entry.count >= config.max) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  // Increment
  entry.count++
  store.set(key, entry)

  return {
    success: true,
    remaining: config.max - entry.count,
    resetAt: entry.resetAt,
  }
}
