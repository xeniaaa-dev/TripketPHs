/**
 * JSON body reading for the inquiry route.
 *
 * Two things happen here that are worth naming.
 *
 * First, the content type is required to be JSON. That is not pedantry: a
 * cross-origin HTML form can only send form-urlencoded or multipart, so
 * refusing anything else means another site cannot make a visitor's browser
 * submit this form on their behalf. Together with the absence of any
 * Access-Control-Allow-Origin header, that closes CSRF without needing a
 * token — the browser will not let a scripted cross-origin JSON POST read the
 * response, and it will not send one at all without a preflight we never
 * allow.
 *
 * Second, the size cap. Being honest about where it sits: Vercel's Node
 * runtime parses the body before the handler is entered, so this check runs
 * after the parse rather than before it. The platform has its own 4.5MB
 * ceiling underneath. What the cap here buys is refusing to *forward* an
 * absurd payload upstream, and a clear 413 instead of a validation error
 * listing every field as too long.
 */

/** Comfortably more than five fields and a token, far less than an upload. */
export const MAX_BODY_BYTES = 16 * 1024

export function readJsonBody(req) {
  const type = req.headers?.['content-type'] ?? ''
  if (!type.toLowerCase().includes('application/json')) {
    return { ok: false, status: 415, message: 'Send this as JSON.' }
  }

  const declared = Number.parseInt(req.headers?.['content-length'], 10)
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return { ok: false, status: 413, message: 'That message is too large.' }
  }

  const raw = req.body

  // Already parsed — Vercel does this for a JSON content type, and the dev
  // server plugin does the same so both environments behave alike.
  if (raw !== null && typeof raw === 'object') {
    return { ok: true, body: raw }
  }

  if (typeof raw === 'string') {
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      return { ok: false, status: 413, message: 'That message is too large.' }
    }
    try {
      const parsed = JSON.parse(raw)
      if (parsed === null || typeof parsed !== 'object') {
        return { ok: false, status: 400, message: 'Check your details and try again.' }
      }
      return { ok: true, body: parsed }
    } catch {
      return { ok: false, status: 400, message: 'Check your details and try again.' }
    }
  }

  return { ok: false, status: 400, message: 'Check your details and try again.' }
}
