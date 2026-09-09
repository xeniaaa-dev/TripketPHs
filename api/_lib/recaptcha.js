/**
 * Server-side reCAPTCHA v3 verification — the contingency path, not the
 * default.
 *
 * The developer's own request definition for POST /api/inquiries accepts
 * `g-recaptcha-response` in the body, which means their server holds the
 * secret and calls Google. In that arrangement this file is never used: the
 * proxy forwards the token untouched and nothing here runs.
 *
 * ##  Do not set RECAPTCHA_SECRET_KEY while the upstream also verifies
 *
 * A reCAPTCHA token is single-use. Google's siteverify consumes it, and a
 * second call with the same token comes back `timeout-or-duplicate`. So if
 * this runs *and* the upstream verifies, every submission fails: our check
 * passes, we forward a spent token, and the upstream rejects it. The visitor
 * sees a validation error on a form with nothing wrong in it, which is a
 * miserable thing to debug.
 *
 * Presence of the environment variable is therefore the switch:
 *
 *   unset  -> forward only, upstream verifies      (the default)
 *   set    -> verify here, upstream ignores it     (only if they do not)
 *
 * Confirm which side verifies before setting it.
 */

const SITEVERIFY = 'https://www.google.com/recaptcha/api/siteverify'

/** Shorter than the upstream timeout: this is one extra hop on the path of a
 *  request someone is waiting on, and Google is either quick or broken. */
const VERIFY_TIMEOUT_MS = 5000

/** Google's own default. Below this, v3 thinks the caller is probably a bot. */
export const DEFAULT_MIN_SCORE = 0.5

/** The action the contact form mints its token under. Checking it stops a
 *  token minted somewhere cheaper being replayed against this endpoint. */
export const EXPECTED_ACTION = 'contact_submit'

export function isEnabled(env = process.env) {
  return Boolean(env.RECAPTCHA_SECRET_KEY)
}

function minScore(env) {
  const parsed = Number.parseFloat(env.RECAPTCHA_MIN_SCORE)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : DEFAULT_MIN_SCORE
}

/**
 * Exchanges a token with Google.
 *
 * Returns `{ ok: true }`, or `{ ok: false, reason }` where `reason` is for our
 * logs only. Google's `error-codes` never reach the browser: `invalid-input-
 * secret` would tell a caller our key is misconfigured, which is exactly the
 * kind of hint that turns a broken deploy into an open door.
 *
 * Fails closed. If Google cannot be reached the submission is refused rather
 * than waved through — otherwise an attacker takes the check out of the loop
 * by making Google time out, and the control is decorative. The cost of that
 * choice is a Google outage blocking the form, which is why the page keeps
 * its email fallback.
 */
export async function verifyRecaptcha(token, { remoteip, env = process.env, fetchImpl = fetch } = {}) {
  const secret = env.RECAPTCHA_SECRET_KEY
  if (!secret) return { ok: false, reason: 'no-secret-configured' }

  const body = new URLSearchParams({ secret, response: token })
  // Google treats this as a hint alongside the token's own signals. It is the
  // platform-supplied address, not anything the client set.
  if (remoteip) body.set('remoteip', remoteip)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS)

  let result
  try {
    const response = await fetchImpl(SITEVERIFY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal,
    })
    if (!response.ok) return { ok: false, reason: `siteverify-http-${response.status}` }
    result = await response.json()
  } catch (error) {
    return { ok: false, reason: error?.name === 'AbortError' ? 'siteverify-timeout' : 'siteverify-unreachable' }
  } finally {
    clearTimeout(timer)
  }

  if (result?.success !== true) {
    const codes = Array.isArray(result?.['error-codes']) ? result['error-codes'].join(',') : 'none'
    return { ok: false, reason: `rejected:${codes}` }
  }

  // v3 only. A v2 key answers without a score, and silently accepting that
  // would mean the threshold below never applies.
  if (typeof result.score !== 'number') {
    return { ok: false, reason: 'no-score-is-this-a-v3-key' }
  }

  if (result.action !== EXPECTED_ACTION) {
    return { ok: false, reason: `action-mismatch:${result.action}` }
  }

  const threshold = minScore(env)
  if (result.score < threshold) {
    return { ok: false, reason: `low-score:${result.score}`, score: result.score }
  }

  return { ok: true, score: result.score }
}

export { SITEVERIFY, VERIFY_TIMEOUT_MS }
