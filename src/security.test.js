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

test('the browser may only reach our own origin for data', () => {
  // connect-src 'self' is what makes the proxy the single way out; widening it
  // would let the bundle call the schedules API directly and skip the limiter.
  expect(csp).toContain("connect-src 'self'")
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
test('the SPA catch-all does not swallow the API routes', () => {
  const rewrite = vercel.rewrites[0]
  expect(rewrite.destination).toBe('/index.html')
  expect(rewrite.source).toContain('?!api/')
  // Prove the pattern itself excludes /api and still matches a page route.
  const pattern = new RegExp(`^${rewrite.source}$`)
  expect(pattern.test('/api/schedules')).toBe(false)
  expect(pattern.test('/support/faq')).toBe(true)
  expect(pattern.test('/')).toBe(true)
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
})
