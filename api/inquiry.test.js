import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import handler, { HONEYPOT_FIELD, INQUIRY_MAX, __resetLimiter } from './inquiry.js'
import { LIMITS, TOKEN_FIELD, looksAutomated, sanitizeInquiry } from './_lib/inquiry-fields.js'
import { MAX_BODY_BYTES, readJsonBody } from './_lib/body.js'

/* =========================================================================
   Test doubles

   `req` and `res` are the two shapes Vercel hands a handler, no more. Keeping
   them this thin is deliberate: if the handler ever starts depending on
   something else the platform provides, these fail rather than quietly
   passing on a convenience jsdom happens to offer.
   ========================================================================= */

const VALID = {
  name: 'Maria Santos',
  email: 'maria@example.com',
  mobile: '+639171234567',
  subject: 'Missing ticket',
  message: 'Where is my ticket?',
  [TOKEN_FIELD]: 'token-from-google',
}

/** A fresh address per test, so one case cannot spend another's rate limit. */
let addresses = 0
const nextAddress = () => `203.0.113.${(addresses += 1)}`

function mockReq({ method = 'POST', body = VALID, headers = {}, address } = {}) {
  const serialised = typeof body === 'string' ? body : JSON.stringify(body ?? {})
  return {
    method,
    headers: {
      'content-type': 'application/json',
      'content-length': String(Buffer.byteLength(serialised, 'utf8')),
      'x-forwarded-for': address ?? nextAddress(),
      ...headers,
    },
    query: {},
    body,
  }
}

function mockRes() {
  const res = { statusCode: 0, headers: {}, body: undefined }
  res.setHeader = (key, value) => {
    res.headers[key.toLowerCase()] = value
  }
  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.json = (payload) => {
    res.body = payload
    return res
  }
  return res
}

/** An upstream response, shaped the way `fetch` returns one. */
const upstreamReply = (status, body = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

async function post(options) {
  const res = mockRes()
  await handler(mockReq(options), res)
  return res
}

/** What was actually sent upstream, parsed back out of the fetch call. */
const forwardedBody = () => JSON.parse(globalThis.fetch.mock.calls[0][1].body)

beforeEach(() => {
  __resetLimiter()
  process.env.TRIPKET_API_BASE = 'https://api.tripketph.com'
  delete process.env.TRIPKET_API_TOKEN
  delete process.env.RECAPTCHA_SECRET_KEY
  globalThis.fetch = vi.fn().mockResolvedValue(upstreamReply(201, { id: 4711 }))
  // The handler logs on most paths by design. Silenced so a passing run is
  // quiet, but spied rather than stubbed away, because two tests below assert
  // on what was logged.
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

/* =========================================================================
   The allowlist
   ========================================================================= */

describe('field allowlist', () => {
  test('passes the five documented fields and the token through', () => {
    const out = sanitizeInquiry(VALID)
    expect(out.ok).toBe(true)
    expect(out.payload).toEqual({
      name: 'Maria Santos',
      email: 'maria@example.com',
      mobile: '+639171234567',
      subject: 'Missing ticket',
      message: 'Where is my ticket?',
    })
    expect(out.token).toBe('token-from-google')
  })

  test('mobile is the only field that may be left out', () => {
    const { mobile, ...withoutMobile } = VALID
    expect(sanitizeInquiry(withoutMobile).ok).toBe(true)

    for (const name of ['name', 'email', 'subject', 'message']) {
      const partial = { ...VALID }
      delete partial[name]
      const out = sanitizeInquiry(partial)
      expect(out.ok, `${name} should be required`).toBe(false)
      expect(out.fields[name]).toMatch(/required/i)
    }
  })

  test('a key the form never sends cannot reach the payload', () => {
    // The point of building a fresh object rather than forwarding the body:
    // whatever the upstream might do with `id` or `role`, it never sees them.
    const out = sanitizeInquiry({ ...VALID, id: 99, role: 'admin', is_admin: true })
    expect(out.ok).toBe(true)
    expect(Object.keys(out.payload).sort()).toEqual([
      'email',
      'message',
      'mobile',
      'name',
      'subject',
    ])
    expect(JSON.stringify(out.payload)).not.toMatch(/admin|99/)
  })

  test('a non-string is rejected rather than coerced', () => {
    expect(sanitizeInquiry({ ...VALID, name: ['a', 'b'] }).fields.name).toMatch(/not valid text/i)
    expect(sanitizeInquiry({ ...VALID, name: { toString: 1 } }).fields.name).toMatch(/not valid/i)
    expect(sanitizeInquiry({ ...VALID, name: 42 }).fields.name).toMatch(/not valid/i)
    expect(sanitizeInquiry(null).ok).toBe(false)
    expect(sanitizeInquiry([VALID]).ok).toBe(false)
  })

  test('over-length input is refused, not silently shortened', () => {
    const out = sanitizeInquiry({ ...VALID, message: 'x'.repeat(LIMITS.message + 1) })
    expect(out.ok).toBe(false)
    expect(out.fields.message).toMatch(/5000 characters or fewer/)
    // A truncated message would reach support with its ending missing and
    // nothing to say that had happened.
    expect(out.payload).toBeUndefined()
  })

  test('a line break cannot be smuggled through a single-line field', () => {
    const out = sanitizeInquiry({ ...VALID, name: 'Maria\r\nBcc: someone@else.test' })
    expect(out.ok).toBe(true)
    expect(out.payload.name).not.toMatch(/[\r\n]/)
  })

  test('paragraphs survive in the message field', () => {
    const out = sanitizeInquiry({ ...VALID, message: 'First line.\n\nSecond line.' })
    expect(out.payload.message).toBe('First line.\n\nSecond line.')
  })

  test('invisible characters are stripped', () => {
    // Zero-width and bidi-override characters read one way to a person and
    // another way to whatever parses the string later.
    const out = sanitizeInquiry({ ...VALID, subject: 'Refund​‮refund' })
    expect(out.payload.subject).toBe('Refundrefund')
  })

  test('the mobile format matches the form, and blank is allowed', () => {
    expect(sanitizeInquiry({ ...VALID, mobile: '09171234567' }).fields.mobile).toMatch(/\+639/)
    expect(sanitizeInquiry({ ...VALID, mobile: '' }).ok).toBe(true)
    expect(sanitizeInquiry({ ...VALID, mobile: '   ' }).ok).toBe(true)
  })

  test('an obvious email typo is caught', () => {
    for (const bad of ['maria', 'maria@', '@example.com', 'a b@example.com', 'maria@example']) {
      expect(sanitizeInquiry({ ...VALID, email: bad }).fields.email, bad).toMatch(/reply to/i)
    }
  })

  test('a missing token is its own outcome, not a field error', () => {
    const { [TOKEN_FIELD]: _token, ...withoutToken } = VALID
    expect(sanitizeInquiry(withoutToken).reason).toBe('missing-token')
    expect(sanitizeInquiry({ ...VALID, [TOKEN_FIELD]: 'x'.repeat(5000) }).reason).toBe(
      'missing-token',
    )
  })

  test('the honeypot only trips on actual content', () => {
    expect(looksAutomated({ [HONEYPOT_FIELD]: 'Acme Corp' })).toBe(true)
    expect(looksAutomated({ [HONEYPOT_FIELD]: '' })).toBe(false)
    expect(looksAutomated({ [HONEYPOT_FIELD]: '  ' })).toBe(false)
    expect(looksAutomated({})).toBe(false)
    expect(looksAutomated(null)).toBe(false)
  })
})

/* =========================================================================
   Body reading
   ========================================================================= */

describe('body reading', () => {
  test('only JSON is accepted', () => {
    // A cross-origin HTML form can only send these two, so refusing them is
    // what makes another site unable to submit this form on a visitor's
    // behalf.
    for (const type of ['application/x-www-form-urlencoded', 'multipart/form-data', '']) {
      const out = readJsonBody({ headers: { 'content-type': type }, body: VALID })
      expect(out.ok, type).toBe(false)
      expect(out.status).toBe(415)
    }
  })

  test('an oversized body is refused before it is forwarded', () => {
    const out = readJsonBody({
      headers: { 'content-type': 'application/json', 'content-length': String(MAX_BODY_BYTES + 1) },
      body: VALID,
    })
    expect(out.ok).toBe(false)
    expect(out.status).toBe(413)
  })

  test('a parsed object and a JSON string both work', () => {
    const headers = { 'content-type': 'application/json' }
    expect(readJsonBody({ headers, body: VALID }).body).toEqual(VALID)
    expect(readJsonBody({ headers, body: JSON.stringify(VALID) }).body).toEqual(VALID)
    expect(readJsonBody({ headers, body: 'not json' }).status).toBe(400)
    expect(readJsonBody({ headers, body: '"a string"' }).status).toBe(400)
  })
})

/* =========================================================================
   The route
   ========================================================================= */

describe('inquiry route', () => {
  test('answers POST only', async () => {
    for (const method of ['GET', 'PUT', 'DELETE', 'PATCH']) {
      const res = await post({ method })
      expect(res.statusCode, method).toBe(405)
      expect(res.headers.allow).toBe('POST')
    }
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  test('a valid submission reaches the upstream and reports success', async () => {
    const res = await post()

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })

    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(String(url)).toBe('https://api.tripketph.com/api/inquiries')
    expect(init.method).toBe('POST')
    expect(forwardedBody()).toEqual({
      name: 'Maria Santos',
      email: 'maria@example.com',
      mobile: '+639171234567',
      subject: 'Missing ticket',
      message: 'Where is my ticket?',
      [TOKEN_FIELD]: 'token-from-google',
    })
  })

  test('the upstream identifier is not passed on to the browser', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(upstreamReply(201, { id: 4711, ref: 'INQ-9' }))
    const res = await post()
    expect(JSON.stringify(res.body)).not.toMatch(/4711|INQ-9/)
  })

  test('a submission is never cached', async () => {
    const res = await post()
    // The schedules route caches on purpose. Doing that here would let a CDN
    // hold a submission response, or serve one visitor's to another.
    expect(res.headers['cache-control']).toBe('no-store')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['referrer-policy']).toBe('no-referrer')
  })

  test('no CORS header is offered to another origin', async () => {
    const res = await post()
    expect(res.headers['access-control-allow-origin']).toBeUndefined()
  })

  test('the honeypot is answered as a success and forwarded nowhere', async () => {
    const res = await post({ body: { ...VALID, [HONEYPOT_FIELD]: 'Acme Corp' } })

    // A bot that learns it was caught comes back in a different shape.
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  test('the honeypot value cannot reach the upstream even when it is empty', async () => {
    await post({ body: { ...VALID, [HONEYPOT_FIELD]: '' } })
    expect(forwardedBody()).not.toHaveProperty(HONEYPOT_FIELD)
  })

  test('a bad field is reported per field, and nothing is sent', async () => {
    const res = await post({ body: { ...VALID, email: 'not-an-email' } })

    expect(res.statusCode).toBe(400)
    expect(res.body.fields.email).toMatch(/reply to/i)
    expect(res.body.retry).toBeUndefined()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  test('a missing token asks for a retry rather than blaming the visitor', async () => {
    const { [TOKEN_FIELD]: _token, ...withoutToken } = VALID
    const res = await post({ body: withoutToken })

    expect(res.statusCode).toBe(400)
    // The distinction that matters: press send again, versus change what you
    // typed. There is nothing wrong with the form here.
    expect(res.body.retry).toBe(true)
    expect(res.body.error).toMatch(/try sending again/i)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  test('the limit refuses the sixth submission with a retry hint', async () => {
    const address = '198.51.100.7'
    for (let i = 0; i < INQUIRY_MAX; i += 1) {
      const allowed = await post({ address })
      expect(allowed.statusCode, `submission ${i + 1}`).toBe(200)
    }

    const blocked = await post({ address })
    expect(blocked.statusCode).toBe(429)
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0)
    expect(globalThis.fetch).toHaveBeenCalledTimes(INQUIRY_MAX)
  })

  test('the captcha is not verified here by default', async () => {
    await post()
    // The upstream holds the secret and checks the token. Verifying here as
    // well would spend the single-use token and make the upstream reject it.
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(String(globalThis.fetch.mock.calls[0][0])).not.toMatch(/siteverify/)
  })

  test('setting the secret turns local verification on', async () => {
    process.env.RECAPTCHA_SECRET_KEY = 'test-secret'
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(upstreamReply(200, { success: true, score: 0.9, action: 'contact_submit' }))
      .mockResolvedValueOnce(upstreamReply(201, {}))

    const res = await post()

    expect(res.statusCode).toBe(200)
    expect(String(globalThis.fetch.mock.calls[0][0])).toMatch(/siteverify/)
    expect(String(globalThis.fetch.mock.calls[1][0])).toMatch(/api\/inquiries/)
  })

  test('a low score is refused, and Google’s reason is not shown', async () => {
    process.env.RECAPTCHA_SECRET_KEY = 'test-secret'
    globalThis.fetch = vi.fn().mockResolvedValue(
      upstreamReply(200, {
        success: true,
        score: 0.1,
        action: 'contact_submit',
        'error-codes': ['invalid-input-secret'],
      }),
    )

    const res = await post()

    expect(res.statusCode).toBe(400)
    expect(res.body.retry).toBe(true)
    // `invalid-input-secret` tells a caller our key is misconfigured.
    expect(JSON.stringify(res.body)).not.toMatch(/invalid-input-secret|0\.1|score/i)
  })

  test('an upstream field rejection is translated, never quoted', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      upstreamReply(422, {
        message: 'The given data was invalid.',
        errors: { email: ['The email must be a valid email address.'] },
      }),
    )

    const res = await post()

    expect(res.statusCode).toBe(400)
    expect(res.body.fields.email).toMatch(/was not accepted/i)
    // The upstream's own wording exposes its field names and rules, and is
    // written for a developer rather than for a visitor.
    const shown = JSON.stringify(res.body)
    expect(shown).not.toMatch(/given data was invalid/i)
    expect(shown).not.toMatch(/must be a valid email address/i)
  })

  test('an upstream captcha rejection becomes a retry, not a field error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      upstreamReply(422, {
        message: 'The given data was invalid.',
        errors: { [TOKEN_FIELD]: ['The g-recaptcha-response field is required.'] },
      }),
    )

    const res = await post()

    expect(res.statusCode).toBe(400)
    expect(res.body.retry).toBe(true)
    expect(res.body.fields).toBeUndefined()
    expect(JSON.stringify(res.body)).not.toMatch(/recaptcha/i)
  })

  test('an unrecognised 422 shape degrades to the generic message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(upstreamReply(422, { detail: 'nope' }))
    const res = await post()

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/check your details/i)
    expect(JSON.stringify(res.body)).not.toMatch(/nope/)
  })

  test('a 401 names the missing credential in the log, not in the response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(upstreamReply(401, { message: 'Unauthenticated.' }))
    const res = await post()

    expect(res.statusCode).toBe(502)
    expect(JSON.stringify(res.body)).not.toMatch(/unauthenticated|token/i)
    // The one thing that makes this diagnosable instead of a mystery.
    const logged = console.error.mock.calls.flat().join(' ')
    expect(logged).toMatch(/TRIPKET_API_TOKEN/)
  })

  test('a 404 names the missing route and promises no retry', async () => {
    // The real upstream answered exactly this for POST /api/inquiries while
    // serving /api/legs/featured-schedules on the same host, so this is the
    // shape of a route that is simply not deployed.
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(upstreamReply(404, { message: 'Not found.', code: 404, success: false }))

    const res = await post()

    expect(res.statusCode).toBe(502)
    // Pressing send again cannot deploy a route. Claiming otherwise would also
    // suppress the form's email fallback, which is the only way out here.
    expect(res.body.retry).toBeUndefined()
    expect(JSON.stringify(res.body)).not.toMatch(/Not found|404/)

    const logged = console.error.mock.calls.flat().join(' ')
    expect(logged).toMatch(/TRIPKET_API_BASE/)
    expect(logged).toMatch(/inquiries/)
  })

  test('a credential failure promises no retry either', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(upstreamReply(401, { message: 'Unauthenticated.' }))
    const res = await post()

    expect(res.statusCode).toBe(502)
    expect(res.body.retry).toBeUndefined()
  })

  test('a credential is sent only when one is configured', async () => {
    await post()
    expect(globalThis.fetch.mock.calls[0][1].headers.Authorization).toBeUndefined()

    globalThis.fetch = vi.fn().mockResolvedValue(upstreamReply(201, {}))
    process.env.TRIPKET_API_TOKEN = 'service-token'
    await post()
    expect(globalThis.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer service-token')
  })

  test('a slow upstream is abandoned rather than held open', async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }))

    const res = await post()
    expect(res.statusCode).toBe(504)
    expect(res.body.retry).toBe(true)
  })

  test('an unreachable upstream is a 502 with our own wording', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED api.tripketph.com'))
    const res = await post()

    expect(res.statusCode).toBe(502)
    expect(JSON.stringify(res.body)).not.toMatch(/ECONNREFUSED|tripketph/)
  })

  test('a missing or plaintext upstream base fails without a stack trace', async () => {
    delete process.env.TRIPKET_API_BASE
    expect((await post()).statusCode).toBe(503)

    process.env.TRIPKET_API_BASE = 'http://api.example.com'
    expect((await post()).statusCode).toBe(503)

    // A dev box on plain http still works, as on the schedules route.
    process.env.TRIPKET_API_BASE = 'http://localhost:8000'
    expect((await post()).statusCode).toBe(200)
  })

  test('nothing the visitor typed is written to the logs', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(upstreamReply(500, {}))
    await post()

    const logged = [
      ...console.log.mock.calls,
      ...console.warn.mock.calls,
      ...console.error.mock.calls,
    ]
      .flat()
      .join(' ')

    // Vercel's logs persist and are readable by anyone with dashboard access.
    expect(logged).not.toMatch(/Maria Santos/)
    expect(logged).not.toMatch(/maria@example\.com/)
    expect(logged).not.toMatch(/\+639171234567/)
    expect(logged).not.toMatch(/Where is my ticket/)
    expect(logged).not.toMatch(/token-from-google/)
  })
})
