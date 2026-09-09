/**
 * Fixed-window, per-IP request counters.
 *
 * Honest scope: these live in the memory of one serverless instance. Vercel
 * runs several and recycles them, so a determined caller spreading requests
 * across instances gets more than the limit per window. It is a real
 * mitigation against a hot loop or a single abusive client, not a hard
 * guarantee. A hard cap needs a shared store (Vercel KV, Upstash); the
 * interface here is deliberately the same shape one would use, so swapping
 * the backing store is a local change.
 *
 * That caveat matters more for the inquiry route than the schedules one. A
 * read that slips through costs a cached upstream request; a write that slips
 * through puts another record in someone's inbox. The inquiry limit is set
 * far lower to compensate, but a shared store is still the right fix if spam
 * ever becomes real.
 */

export const WINDOW_MS = 60_000
export const MAX_REQUESTS = 30

/**
 * Each limiter owns its own bucket map, which is what keeps the routes from
 * interfering. Sharing one map would mean a visitor who had just loaded the
 * departures section arrived at the contact form with part of their budget
 * already spent — and in the dev server, where both handlers run inside one
 * process, that would happen every time.
 */
export function createLimiter({ max, windowMs }) {
  const buckets = new Map()

  /** Drops windows that have already expired, so the map cannot grow forever. */
  function prune(now) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key)
    }
  }

  function rateLimit(key, now = Date.now()) {
    if (buckets.size > 5000) prune(now)

    const bucket = buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      return { ok: true, remaining: max - 1, retryAfter: 0 }
    }

    bucket.count += 1
    const remaining = Math.max(max - bucket.count, 0)
    if (bucket.count > max) {
      return { ok: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
    }
    return { ok: true, remaining, retryAfter: 0 }
  }

  return { rateLimit, max, windowMs, reset: () => buckets.clear() }
}

/** The schedules limiter. Named exports below keep its original call shape. */
const schedules = createLimiter({ max: MAX_REQUESTS, windowMs: WINDOW_MS })

export const rateLimit = schedules.rateLimit

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

/** Test seam: clears the schedules window state between cases. */
export function __reset() {
  schedules.reset()
}
