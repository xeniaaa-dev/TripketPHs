import { randomUUID } from 'node:crypto'
import { readJsonBody } from './_lib/body.js'
import { HONEYPOT_FIELD, TOKEN_FIELD, looksAutomated, sanitizeInquiry } from './_lib/inquiry-fields.js'
import { clientKey, createLimiter } from './_lib/ratelimit.js'
import { isEnabled as recaptchaEnabled, verifyRecaptcha } from './_lib/recaptcha.js'

/**
 * Write-only proxy for the contact form.
 *
 * The browser posts here and nowhere else. That is the whole point, for the
 * same reasons as the schedules route next door plus one more:
 *
 *   - the upstream host stays in TRIPKET_API_BASE, server-side, so the API
 *     the form writes to is not discoverable from the bundle
 *   - any credential stays in TRIPKET_API_TOKEN, server-side, because a
 *     bearer token in client JavaScript is a published credential
 *   - the rate limit is enforced by whatever serves the request, so it has to
 *     be here; the same logic in the client is bypassed by opening devtools
 *   - the upstream's own responses never reach the visitor, so its field
 *     names, validation rules and failure modes stay private
 *
 * What it will not do is verify the captcha. The developer's endpoint accepts
 * the token in the body, which means it holds the secret and checks the token
 * itself, so this route forwards it untouched. See `_lib/recaptcha.js` for the
 * contingency switch and the single-use-token trap that makes verifying in
 * both places a bug rather than belt-and-braces.
 *
 * One limit worth stating plainly: if the upstream endpoint is public, this
 * route's rate limit protects this route only. Anyone can post to the API
 * directly and skip it, and the upstream's own captcha check is the only
 * thing in the way. Nothing here can change that.
 */

const UPSTREAM_PATH = '/api/inquiries'
const UPSTREAM_TIMEOUT_MS = 8000

/**
 * Far stricter than the schedules route's 30-per-minute. A person sends one
 * enquiry and occasionally a second; nobody legitimately sends six in ten
 * minutes, and every one that gets through becomes a record someone has to
 * read.
 */
export const INQUIRY_MAX = 5
export const INQUIRY_WINDOW_MS = 10 * 60_000
const limiter = createLimiter({ max: INQUIRY_MAX, windowMs: INQUIRY_WINDOW_MS })

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

/**
 * Every failure answers in the same shape, so the form has one thing to read.
 *
 * `retry` is the interesting field. A captcha rejection and a bad email
 * address are both 4xx, but they need opposite instructions: one means press
 * send again and we will mint a fresh token, the other means change what you
 * typed. Telling someone to check a form that is already correct is the worst
 * outcome available, so the two are kept distinct.
 */
function fail(res, status, { error, fields, retry = false }) {
  const payload = { ok: false, error }
  if (fields && Object.keys(fields).length > 0) payload.fields = fields
  if (retry) payload.retry = true
  return res.status(status).json(payload)
}

/**
 * Maps an upstream rejection onto our own copy.
 *
 * The shape expected is Laravel's — a `message` plus an `errors` object keyed
 * by field. The evidence for that is the upstream's own validation text quoted
 * in `_lib/params.js` (about a page limit field not being greater than 100),
 * which is Laravel's phrasing almost word for word.
 *
 * Only the *keys* of `errors` are read. The upstream's messages are never
 * rendered: they would leak its internal field names and rules, and they are
 * written for a developer rather than for someone trying to send a message.
 * If the shape turns out to be something else the keys simply do not match
 * and it degrades to the generic message, so being wrong about Laravel costs
 * a little precision and nothing else.
 */
function mapUpstreamErrors(payload) {
  const errors = payload?.errors
  if (errors === null || typeof errors !== 'object' || Array.isArray(errors)) return null

  const keys = Object.keys(errors)
  if (keys.includes(TOKEN_FIELD)) return { kind: 'captcha' }

  const fields = {}
  for (const name of ['name', 'email', 'mobile', 'subject', 'message']) {
    if (keys.includes(name)) {
      const shown =
        name === 'mobile' ? 'Mobile number' : name.charAt(0).toUpperCase() + name.slice(1)
      fields[name] = shown + ' was not accepted. Check it and try again.'
    }
  }

  return Object.keys(fields).length > 0 ? { kind: 'fields', fields } : null
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')
  // The one header the schedules route must not be copied on. That route
  // caches deliberately; a CDN holding on to a submission response — or
  // worse, serving one visitor's result to another — is the failure that
  // would actually matter here.
  res.setHeader('Cache-Control', 'no-store')
  // Deliberately no Access-Control-Allow-Origin: this route exists for our
  // own page. Staying same-origin is half of what makes the JSON-only rule in
  // `_lib/body.js` a CSRF defence.

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return fail(res, 405, { error: 'Method not allowed.' })
  }

  /** Ties a visitor's failure to a log line without logging anything about
   *  them. If support hears "it said try again", this is the thread to pull. */
  const requestId = randomUUID().slice(0, 8)

  const address = clientKey(req)
  const limit = limiter.rateLimit(address)
  res.setHeader('X-RateLimit-Limit', String(INQUIRY_MAX))
  res.setHeader('X-RateLimit-Remaining', String(limit.remaining))
  if (!limit.ok) {
    res.setHeader('Retry-After', String(limit.retryAfter))
    return fail(res, 429, {
      error: 'You have sent several messages already. Please wait a few minutes and try again.',
    })
  }

  const read = readJsonBody(req)
  if (!read.ok) {
    console.error(`inquiry ${requestId}: body rejected (${read.status}).`)
    return fail(res, read.status, { error: read.message })
  }

  // Answered as a success on purpose. A bot that learns it was caught tries a
  // different shape; one that thinks it succeeded moves on. Nothing is
  // forwarded.
  if (looksAutomated(read.body)) {
    console.warn(`inquiry ${requestId}: honeypot filled, discarded.`)
    return res.status(200).json({ ok: true })
  }

  const clean = sanitizeInquiry(read.body)
  if (!clean.ok) {
    console.warn(`inquiry ${requestId}: rejected locally (${clean.reason}).`)
    if (clean.reason === 'missing-token') {
      return fail(res, 400, {
        error: 'We could not confirm you are human. Please try sending again.',
        fields: clean.fields,
        retry: true,
      })
    }
    return fail(res, 400, {
      error: 'Please check the highlighted fields and try again.',
      fields: clean.fields,
    })
  }

  const base = process.env.TRIPKET_API_BASE
  if (!base) {
    console.error(`inquiry ${requestId}: TRIPKET_API_BASE is not set.`)
    return fail(res, 503, { error: 'We cannot send your message right now.', retry: true })
  }

  let upstream
  try {
    const url = new URL(UPSTREAM_PATH, base)
    if (!isAcceptableBase(url)) {
      console.error(`inquiry ${requestId}: TRIPKET_API_BASE must be https (got ${url.protocol}).`)
      return fail(res, 503, { error: 'We cannot send your message right now.', retry: true })
    }
    upstream = url
  } catch {
    console.error(`inquiry ${requestId}: TRIPKET_API_BASE is not a valid URL.`)
    return fail(res, 503, { error: 'We cannot send your message right now.', retry: true })
  }

  // Off unless RECAPTCHA_SECRET_KEY is set. Read `_lib/recaptcha.js` before
  // setting it — verifying here while the upstream also verifies fails every
  // submission, because the token is single-use.
  if (recaptchaEnabled()) {
    const verified = await verifyRecaptcha(clean.token, { remoteip: address })
    if (!verified.ok) {
      console.warn(`inquiry ${requestId}: captcha refused (${verified.reason}).`)
      return fail(res, 400, {
        error: 'We could not confirm you are human. Please try sending again.',
        retry: true,
      })
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' }
    // Optional, exactly as on the schedules route. Both endpoints appear to be
    // public; if this one is not, the 401 branch below says so in the log
    // rather than leaving a generic failure to guess at.
    if (process.env.TRIPKET_API_TOKEN) {
      headers.Authorization = `Bearer ${process.env.TRIPKET_API_TOKEN}`
    }

    const response = await fetch(upstream, {
      method: 'POST',
      headers,
      // Rebuilt from the allowlist, never the caller's object. The token rides
      // along under the upstream's own name for it.
      body: JSON.stringify({ ...clean.payload, [TOKEN_FIELD]: clean.token }),
      signal: controller.signal,
    })

    if (response.ok) {
      console.log(`inquiry ${requestId}: accepted upstream (${response.status}).`)
      // No upstream identifier is passed on even if one came back. It means
      // nothing to a visitor with no way to look it up, and it is one more
      // internal detail on the page for no benefit.
      return res.status(200).json({ ok: true })
    }

    if (response.status === 401 || response.status === 403) {
      console.error(
        `inquiry ${requestId}: upstream returned ${response.status}. The inquiry endpoint ` +
          'needs a credential — set TRIPKET_API_TOKEN.',
      )
      return fail(res, 502, { error: 'We cannot send your message right now.', retry: true })
    }

    if (response.status === 422 || response.status === 400) {
      const body = await response.json().catch(() => null)
      const mapped = mapUpstreamErrors(body)

      if (mapped?.kind === 'captcha') {
        console.warn(`inquiry ${requestId}: upstream refused the captcha token.`)
        return fail(res, 400, {
          error: 'We could not confirm you are human. Please try sending again.',
          retry: true,
        })
      }

      if (mapped?.kind === 'fields') {
        const named = Object.keys(mapped.fields).join(',')
        console.warn(`inquiry ${requestId}: upstream rejected fields (${named}).`)
        return fail(res, 400, {
          error: 'Please check the highlighted fields and try again.',
          fields: mapped.fields,
        })
      }

      console.warn(`inquiry ${requestId}: upstream ${response.status} in an unrecognised shape.`)
      return fail(res, 400, { error: 'Please check your details and try again.' })
    }

    console.error(`inquiry ${requestId}: upstream responded ${response.status}.`)
    return fail(res, 502, { error: 'We cannot send your message right now.', retry: true })
  } catch (error) {
    const timedOut = error?.name === 'AbortError'
    // The error object is logged, never the payload. Vercel's logs are
    // readable by anyone with dashboard access and they persist, so a
    // visitor's name, address and message have no business in them.
    console.error(
      timedOut
        ? `inquiry ${requestId}: upstream timed out.`
        : `inquiry ${requestId}: upstream failed: ${error}`,
    )
    return fail(res, timedOut ? 504 : 502, {
      error: 'We cannot send your message right now.',
      retry: true,
    })
  } finally {
    clearTimeout(timer)
  }
}

/** Test seam: clears this route's window state between cases, matching the
 *  `__reset` convention in `_lib/ratelimit.js`. */
export function __resetLimiter() {
  limiter.reset()
}

export { HONEYPOT_FIELD, UPSTREAM_PATH, UPSTREAM_TIMEOUT_MS, mapUpstreamErrors }
