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

  const hash = crypto.createHash('sha256').update(inline[0][1], 'utf8').digest('base64')
  expect(csp).toContain(`'sha256-${hash}'`)
})

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
