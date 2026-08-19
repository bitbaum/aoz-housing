/**
 * In-memory sliding-window rate limiter for public endpoints (auth, contact).
 * Per-process is fine at this scale; swap for Redis when there is a fleet.
 */
const buckets = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const cutoff = now - windowMs
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff)
  if (hits.length >= limit) {
    buckets.set(key, hits)
    return false
  }
  hits.push(now)
  buckets.set(key, hits)
  return true
}

interface HeaderLike {
  get(name: string): string | null
}

/** Accepts a Fetch API Request's headers or next/headers()'s ReadonlyHeaders — both satisfy this. */
export function getClientIp(headers: HeaderLike): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip') ?? 'unknown'
}

/** Test hook. */
export function resetRateLimits(): void {
  buckets.clear()
}
