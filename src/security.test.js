import fs from 'node:fs'
import crypto from 'node:crypto'
import { expect, test } from 'vitest'

const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'))
const csp = vercel.headers[0].headers.find((h) => h.key === 'Content-Security-Policy').value

/**
 * The CSP pins the pre-paint theme script by hash instead of allowing all
 * inline script. That only holds while the hash matches the script, so this
 * fails the moment index.html is edited without updating vercel.json —
 * otherwise the theme bootstrap would be silently blocked in production and
 * every visitor would get a flash of the wrong theme.
 */
test('the CSP hash matches the inline script in index.html', () => {
  const html = fs.readFileSync('index.html', 'utf8')
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  expect(inline, 'expected exactly one inline script to pin').toHaveLength(1)

  /* Normalised to LF before hashing. git stores this file with LF and Vercel
     builds from that, but core.autocrlf checks it out with CRLF on Windows —
     so hashing the bytes on disk computes a different digest there and fails a
     policy that is actually correct in production. LF is the form that ships,
     so LF is the form to pin. */
  const script = inline[0][1].replace(/\r\n/g, '\n')
  const hash = crypto.createHash('sha256').update(script, 'utf8').digest('base64')
  expect(csp).toContain(`'sha256-${hash}'`)
})

/**
 * Why the policy is shaped the way it is. This lived as a `_comment` key in
 * vercel.json until Vercel's schema validation rejected the deployment —
 * `additionalProperties` is false there, so the file cannot carry its own
 * rationale and it lives here, next to the assertions that enforce it.
 *
 * script-src carries no 'unsafe-inline'. The one inline script is the pre-paint
 * theme bootstrap in index.html, pinned by hash instead, and the test above
 * recomputes that hash. style-src does allow 'unsafe-inline', because that same
 * script assigns documentElement.style.colorScheme, which counts as a style
 * attribute. That is a narrow cost: there is no dangerouslySetInnerHTML
 * anywhere and React escapes all output, so there is no HTML-injection path to
 * exploit it.
 */
test('script-src allows no inline or eval escape hatch', () => {
  const scriptSrc = csp.split(';').find((part) => part.trim().startsWith('script-src'))
  expect(scriptSrc).not.toContain("'unsafe-inline'")
  expect(scriptSrc).not.toContain("'unsafe-eval'")
})

/**
 * connect-src is what makes the proxy the only way out of the page: the bundle
 * cannot reach the Tripket API directly and skip the rate limiter, because the
 * only host it may open a connection to besides our own is Google's.
 *
 * That one exception is not optional. reCAPTCHA v3 runs `recaptcha__en.js` in
 * the top document, not inside its iframe, and that script fetches
 * /recaptcha/api2/clr from www.google.com. Under `connect-src 'self'` the
 * browser refuses it and logs a policy violation on every submission.
 *
 * Asserted as an exact string rather than with `toContain`, because the
 * failure this guards against is someone widening it further — and a
 * `toContain("connect-src 'self'")` check keeps passing no matter what else
 * is appended, which is exactly how the guarantee would be lost quietly.
 */
test('the browser may only reach our own origin and reCAPTCHA', () => {
  const connectSrc = csp
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('connect-src '))

  expect(connectSrc).toBe("connect-src 'self' https://www.google.com")
})

test('the page cannot be framed and carries the usual hardening', () => {
  const keys = vercel.headers[0].headers.map((h) => h.key)
  expect(keys).toEqual(
    expect.arrayContaining([
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'X-Frame-Options',
      'Permissions-Policy',
    ]),
  )
  expect(csp).toContain("frame-ancestors 'none'")
  expect(csp).toContain("object-src 'none'")
  expect(csp).toContain("base-uri 'self'")
})

/**
 * Vercel checks the filesystem before applying rewrites, so /api would very
 * likely survive a plain catch-all anyway — the negative lookahead makes it
 * explicit rather than dependent on routing order.
 */
test('the SPA catch-all serves pages but never swallows real files', () => {
  const rewrite = vercel.rewrites[0]
  expect(rewrite.destination).toBe('/index.html')
  const pattern = new RegExp(`^${rewrite.source}$`)

  /* Anything that resolves to an actual file or function has to pass through
     untouched. /api matters in production; the rest matter under `vercel dev`,
     where Vite serves modules straight from source — the catch-all used to
     answer /src/main.jsx with index.html, so the browser got HTML where it
     expected JavaScript and rendered a blank page. */
  for (const path of [
    '/api/schedules',
    '/api/inquiry',
    '/src/main.jsx',
    '/@vite/client',
    '/@react-refresh',
    '/node_modules/.vite/deps/react.js',
    '/assets/index-abc123.js',
    '/assets/optimized/tripket-mark-64.png',
  ]) {
    expect(pattern.test(path), `${path} must not be rewritten`).toBe(false)
  }

  // Every page route, and any unknown path, still has to reach index.html or
  // client-side routing breaks and 8 of the 9 pages 404 on a hard load.
  for (const path of [
    '/',
    '/about',
    '/partners',
    '/support/contact',
    '/support/faq',
    '/support/privacy',
    '/support/terms',
    '/support/account-deletion-request',
    '/does-not-exist',
  ]) {
    expect(pattern.test(path), `${path} must be rewritten to index.html`).toBe(true)
  }
})

/**
 * Vercel validates vercel.json against a schema with `additionalProperties`
 * set to false, and fails the whole deployment on an unknown key — the build
 * error reads "should NOT have additional property". JSON has no comments, so
 * the tempting workaround is a `_comment` field, which is exactly what gets
 * rejected. This catches it here rather than after a push.
 *
 * `$schema` is the one exception; Vercel documents it and their own examples
 * use it.
 */
test('vercel.json carries no keys Vercel’s schema will reject', () => {
  const offenders = []

  const walk = (node, path) => {
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`))
    } else if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        if (key.startsWith('_')) offenders.push(`${path}.${key}`)
        walk(value, `${path}.${key}`)
      }
    }
  }
  walk(vercel, 'vercel.json')

  expect(offenders, 'put the explanation in a test or a doc, not in vercel.json').toEqual([])
  expect(Object.keys(vercel)).toEqual(expect.arrayContaining(['rewrites', 'headers']))
})

/**
 * reCAPTCHA needs the policy widened, and this pins how far.
 *
 * `frame-src` is the one that catches people: v3 injects a hidden iframe, so
 * without its own directive it falls back to default-src 'self' and is
 * blocked — with nothing visible on the page to say why, because the failure
 * is a console violation rather than an error the form can catch.
 *
 * The assertions are about the shape of the allowance, not just its presence:
 * two named hosts, no wildcard, and no inline escape hatch smuggled in
 * alongside them.
 */
test('the CSP allows reCAPTCHA and nothing wider', () => {
  const directive = (name) =>
    csp
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(name + ' '))

  const scriptSrc = directive('script-src')
  expect(scriptSrc).toContain('https://www.google.com')
  expect(scriptSrc).toContain('https://www.gstatic.com')

  // The hidden iframe. Missing this is a silent failure.
  expect(directive('frame-src')).toBe('frame-src https://www.google.com')

  // The badge's own images, even though the badge itself is hidden by CSS.
  expect(directive('img-src')).toContain('https://www.gstatic.com')

  // Nothing broader crept in with them.
  expect(csp).not.toContain('*.google.com')
  for (const name of ['script-src', 'frame-src', 'img-src']) {
    expect(directive(name), name).not.toContain('*')
  }
})

/**
 * The site key is public by design and belongs in the bundle. The secret is
 * the opposite, and the two sit a few lines apart in `.env.example` — so the
 * plausible mistake is renaming the secret to match its neighbour, which
 * would ship a full captcha bypass to every visitor.
 *
 * There is no RECAPTCHA_SECRET_KEY in this project today. This is what keeps
 * it that way if someone wires up the contingency path later.
 */
test('no reCAPTCHA secret can reach the browser', () => {
  const src = fs
    .readdirSync('src', { recursive: true })
    .filter((f) => typeof f === 'string' && /\.jsx?$/.test(f) && !/\.test\.jsx?$/.test(f))
    .map((f) => fs.readFileSync(`src/${f}`, 'utf8'))
    .join('\n')

  expect(src).not.toMatch(/RECAPTCHA_SECRET/i)
  // siteverify is a server-side exchange. Its presence in client code would
  // mean the secret is there too.
  expect(src).not.toMatch(/siteverify/i)

  // And the prefix that would publish it cannot appear in the file people copy.
  expect(fs.readFileSync('.env.example', 'utf8')).not.toMatch(/VITE_RECAPTCHA_SECRET/i)
})

/**
 * The submission route must not be cacheable. A CDN holding a POST response —
 * or serving one visitor's back to another — is the failure that would
 * actually matter, and it is one line away from the schedules route, which
 * caches deliberately.
 */
test('the inquiry route sets no-store and offers no CORS', () => {
  const handler = fs.readFileSync('api/inquiry.js', 'utf8')
  expect(handler).toMatch(/'Cache-Control', 'no-store'/)
  // Matched as a call, not a string: the handler's own comment explains why
  // the header is absent, and naming it there is the point.
  expect(handler).not.toMatch(/setHeader\(\s*'Access-Control-Allow-Origin'/)
})

test('no API host or credential is baked into the client bundle', () => {
  const src = fs
    .readdirSync('src', { recursive: true })
    // Tests are excluded: this file names the variables in its own assertions,
    // and test code is not shipped to the browser anyway.
    .filter((f) => typeof f === 'string' && /\.jsx?$/.test(f) && !/\.test\.jsx?$/.test(f))
    .map((f) => fs.readFileSync(`src/${f}`, 'utf8'))
    .join('\n')

  expect(src).not.toMatch(/api\.tripket\.test/)
  expect(src).not.toMatch(/TRIPKET_API_BASE|TRIPKET_API_TOKEN/)
  // The inquiry route's upstream path is server-side too: the client knows
  // only the same-origin '/api/inquiry'.
  expect(src).not.toMatch(/api\/inquiries/)
})
