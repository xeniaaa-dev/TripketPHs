/**
 * Field allowlist for the inquiry proxy.
 *
 * The same idea as `params.js` next door, applied to a body instead of a
 * query string, and with one extra reason to be strict: the schedules route
 * only ever *reads*, while this one causes a record to be written upstream.
 * A caller who can steer the shape of that write is a much bigger problem
 * than one who can steer a cached read.
 *
 * So nothing the browser sends is forwarded as-is. A fresh object is built
 * from exactly the keys below, which means an extra key in the request body —
 * `id`, `role`, `status`, anything the upstream might otherwise honour — is
 * dropped here rather than passed along to be interpreted.
 *
 * The field names, and `g-recaptcha-response` alongside them, come from the
 * developer's own request definition for POST /api/inquiries.
 */

/** The upstream's own name for the captcha token. Hyphenated, so it needs
 *  bracket notation everywhere it appears. */
export const TOKEN_FIELD = 'g-recaptcha-response'

/**
 * A hidden field real people never see and never fill. Bots that parse the
 * form and populate every input give themselves away by filling it. The name
 * is deliberately ordinary-looking — a bot skips `honeypot` and falls for
 * `company`.
 */
export const HONEYPOT_FIELD = 'company'

/**
 * Length ceilings. Chosen to be generous for a person and mean for a script:
 * `email` is the 254-character maximum a real address can be, `mobile` fits
 * E.164 with room to spare, and `message` is longer than any genuine support
 * enquiry while still bounded.
 *
 * Over-length input is refused, not truncated. Silently cutting a message in
 * half sends support a question with its ending missing, and they cannot tell
 * that is what happened.
 */
export const LIMITS = {
  name: 120,
  email: 254,
  mobile: 16,
  subject: 200,
  message: 5000,
}

/** reCAPTCHA v3 tokens run to roughly a couple of thousand characters. This
 *  is a sanity bound, not a format check — only Google can say if it is real. */
export const MAX_TOKEN_LENGTH = 4096

/** `mobile` is the only optional field, matching the form and the upstream. */
const REQUIRED = ['name', 'email', 'subject', 'message']
const OPTIONAL = ['mobile']
export const FIELDS = [...REQUIRED, ...OPTIONAL]

/** Philippine mobile numbers in E.164: +63, then 9, then nine digits. Same
 *  rule the form applies, restated here because the form can be bypassed. */
const MOBILE = /^\+639\d{9}$/

/**
 * Deliberately loose. A tight email regex rejects addresses that are actually
 * valid, and no regex can tell you whether an address receives mail — the
 * reply either arrives or it does not. This catches the typo class of error
 * (no @, a trailing dot, an embedded space) and leaves the rest alone.
 */
const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/

/**
 * Characters that have no business in a support enquiry.
 *
 * The C0 and C1 control ranges are stripped because they are how a value gets
 * smuggled past something that reads it later — a CR or LF injected into a
 * single-line field can forge a header or a log line. The zero-width and
 * bidirectional-override characters go too: they are invisible on screen, so
 * they let text read one way to a human and another way to a machine.
 *
 * `message` keeps its newlines and tabs, because paragraphs are the point of
 * a message field. Every other field is single-line and loses them.
 */
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/g
const CONTROL_CHARS_KEEPING_BREAKS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g
const INVISIBLE_CHARS = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g

function clean(value, { keepBreaks = false } = {}) {
  return value
    // NFC first: it can change the string's length, so normalising after a
    // length check would let a longer-than-allowed value through.
    .normalize('NFC')
    .replace(keepBreaks ? CONTROL_CHARS_KEEPING_BREAKS : CONTROL_CHARS, '')
    .replace(INVISIBLE_CHARS, '')
    .trim()
}

/**
 * Only a real string is a candidate. An array or a nested object here is not
 * a mistake a form makes — it is someone probing what the far end does with
 * an unexpected type — so it is rejected rather than coerced.
 */
function asString(value) {
  return typeof value === 'string' ? value : null
}

/** Matches the visible labels on the contact form, so an error names the
 *  field the way the page does. */
function label(name) {
  if (name === 'mobile') return 'Mobile number'
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/**
 * Turns a request body into either a payload safe to forward, or a set of
 * field errors to show the visitor.
 *
 * The messages are ours. That matters on the way back out too: the visitor
 * sees copy written here, never a validation string from the upstream, so the
 * upstream's field names and rules stay private.
 */
export function sanitizeInquiry(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, fields: {}, reason: 'not-an-object' }
  }

  const fields = {}
  const payload = {}

  for (const name of FIELDS) {
    const raw = asString(body[name])

    if (raw === null) {
      // A missing optional field is fine. A missing required one is not, and
      // a non-string is not, whichever field it lands in.
      if (body[name] === undefined) {
        if (!OPTIONAL.includes(name)) fields[name] = label(name) + ' is required.'
        continue
      }
      fields[name] = label(name) + ' is not valid text.'
      continue
    }

    const value = clean(raw, { keepBreaks: name === 'message' })

    if (!value) {
      if (!OPTIONAL.includes(name)) fields[name] = label(name) + ' is required.'
      continue
    }

    if (value.length > LIMITS[name]) {
      fields[name] = label(name) + ' must be ' + LIMITS[name] + ' characters or fewer.'
      continue
    }

    if (name === 'email' && !EMAIL.test(value)) {
      fields[name] = 'Enter an email address we can reply to.'
      continue
    }

    if (name === 'mobile' && !MOBILE.test(value)) {
      fields[name] = 'Use the format +639xxxxxxxxx — a plus sign, 639, then nine more digits.'
      continue
    }

    payload[name] = value
  }

  const rawToken = asString(body[TOKEN_FIELD])
  const token = rawToken === null ? '' : rawToken.trim()
  if (!token || token.length > MAX_TOKEN_LENGTH) {
    // Not reported against a field: there is no input for it. The handler
    // turns this into the "try again" path, because a missing or malformed
    // token usually means the check expired rather than that the visitor did
    // anything wrong.
    return { ok: false, fields, reason: 'missing-token' }
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields, reason: 'invalid-fields' }

  return { ok: true, payload, token }
}

/**
 * True when the honeypot has been filled. Kept apart from validation because
 * the handler's answer to it is different: it replies as though the
 * submission succeeded, so a bot gets no signal that it was caught and no
 * reason to come back with a different shape.
 */
export function looksAutomated(body) {
  const trap = body === null || typeof body !== 'object' ? undefined : body[HONEYPOT_FIELD]
  return typeof trap === 'string' && trap.trim().length > 0
}

export { MOBILE, EMAIL, REQUIRED, OPTIONAL }
