import { sanitizeParams } from './_lib/params.js'
import { clientKey, rateLimit, MAX_REQUESTS, WINDOW_MS } from './_lib/ratelimit.js'
import { normalizeSchedules } from './_lib/normalize.js'

/**
 * Read-only proxy for the featured-schedules endpoint.
 *
 * The browser talks only to this route. That is the point: rate limiting can
 * only be enforced by whatever serves the request, so doing it here is the
 * one place it actually means anything — the same logic written in the client
 * is bypassed by opening devtools.
 *
 * What it does:
 *   - answers GET only
 *   - counts requests per client address and refuses over the limit
 *   - rebuilds the upstream URL from a fixed host and path plus four
 *     allowlisted values, so no part of it is caller-controlled (no SSRF)
 *   - abandons a slow upstream instead of holding the connection open
 *   - reshapes the response, so only known fields reach the browser
 *   - lets the CDN serve repeat callers, which is what actually keeps load off
 *     the upstream once the page has any traffic
 *   - returns its own error text, never the upstream's body or status detail
 *
 * The upstream host lives in TRIPKET_API_BASE and any credential in
 * TRIPKET_API_TOKEN. Neither is prefixed VITE_, so neither can be inlined
 * into the client bundle by Vite even by mistake.
 */

const UPSTREAM_PATH = '/api/legs/featured-schedules'
const UPSTREAM_TIMEOUT_MS = 8000

/** http is allowed only for a local/dev host; anything public must be https. */
function isAcceptableBase(url) {
  if (url.protocol === 'https:') return true
  if (url.protocol !== 'http:') return false
  return (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.hostname.endsWith('.test') ||
    url.hostname.endsWith('.local')
  )
}

function fail(res, status, message) {
  res.status(status).json({ error: message, schedules: [] })
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')
  // Deliberately no Access-Control-Allow-Origin: this route exists for our own
  // page, and staying same-origin keeps other sites from reading through it.

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return fail(res, 405, 'Method not allowed.')
  }

  const limit = rateLimit(clientKey(req))
  res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS))
  res.setHeader('X-RateLimit-Remaining', String(limit.remaining))
  if (!limit.ok) {
    res.setHeader('Retry-After', String(limit.retryAfter))
    return fail(res, 429, 'Too many requests. Try again shortly.')
  }

  const base = process.env.TRIPKET_API_BASE
  if (!base) {
    // Not the visitor's fault and not worth a stack trace: the UI shows its
    // unavailable state and the cause is in the server logs.
    console.error('TRIPKET_API_BASE is not set; cannot reach the schedules API.')
    return fail(res, 503, 'Schedules are unavailable right now.')
  }

  let upstream
  try {
    const url = new URL(UPSTREAM_PATH, base)
    if (!isAcceptableBase(url)) {
      console.error(`TRIPKET_API_BASE must be https (got ${url.protocol}//${url.hostname}).`)
      return fail(res, 503, 'Schedules are unavailable right now.')
    }
    upstream = url
  } catch {
    console.error('TRIPKET_API_BASE is not a valid URL.')
    return fail(res, 503, 'Schedules are unavailable right now.')
  }

  const params = sanitizeParams(req.query)
  for (const [key, value] of Object.entries(params)) {
    upstream.searchParams.set(key, String(value))
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    const headers = { Accept: 'application/json' }
    if (process.env.TRIPKET_API_TOKEN) {
      headers.Authorization = `Bearer ${process.env.TRIPKET_API_TOKEN}`
    }

    const response = await fetch(upstream, { headers, signal: controller.signal })
    if (!response.ok) {
      console.error(`Upstream schedules responded ${response.status}.`)
      return fail(res, 502, 'Schedules are unavailable right now.')
    }

    const payload = await response.json()
    const schedules = normalizeSchedules(payload, params.pageLimit)

    // Repeat callers are served by the CDN rather than the upstream. This, not
    // the counter above, is what keeps load down once traffic is real.
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return res.status(200).json({ date: params.date, count: schedules.length, schedules })
  } catch (error) {
    const timedOut = error?.name === 'AbortError'
    console.error(timedOut ? 'Upstream schedules timed out.' : `Upstream schedules failed: ${error}`)
    return fail(res, timedOut ? 504 : 502, 'Schedules are unavailable right now.')
  } finally {
    clearTimeout(timer)
  }
}

export { UPSTREAM_PATH, UPSTREAM_TIMEOUT_MS, WINDOW_MS }
