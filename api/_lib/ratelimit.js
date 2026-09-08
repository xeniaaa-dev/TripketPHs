/**
 * Fixed-window, per-IP request counter.
 *
 * Honest scope: this lives in the memory of one serverless instance. Vercel
 * runs several and recycles them, so a determined caller spreading requests
 * across instances gets more than MAX_REQUESTS per window. It is a real
 * mitigation against a hot loop or a single abusive client, not a hard
 * guarantee. A hard cap needs a shared store (Vercel KV, Upstash); the
 * interface here is deliberately the same shape one would use, so swapping
 * the backing store is a local change.
 */

export const WINDOW_MS = 60_000
export const MAX_REQUESTS = 30

const buckets = new Map()

/** Drops windows that have already expired, so the map cannot grow forever. */
function prune(now) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export function rateLimit(key, now = Date.now()) {
  if (buckets.size > 5000) prune(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true, remaining: MAX_REQUESTS - 1, retryAfter: 0 }
  }

  bucket.count += 1
  const remaining = Math.max(MAX_REQUESTS - bucket.count, 0)
  if (bucket.count > MAX_REQUESTS) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  return { ok: true, remaining, retryAfter: 0 }
}

/**
 * The caller's address. On Vercel `x-forwarded-for` is written by the platform
 * edge, and the client's address is its first entry — later entries are proxy
 * hops and are attacker-influenced, so only the first is used. Without a
 * trusted proxy in front, this header would be spoofable and this limiter
 * would be worthless; that is why it reads the platform header rather than
 * anything the client can set directly.
 */
export function clientKey(req) {
  const forwarded = req.headers?.['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim()
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return String(forwarded[0]).split(',')[0].trim()
  }
  return req.headers?.['x-real-ip'] ?? 'unknown'
}

/** Test seam: clears the window state between cases. */
export function __reset() {
  buckets.clear()
}
