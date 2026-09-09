import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Serves the `api/` serverless functions during `npm run dev`.
 *
 * Vite alone does not serve `/api`, so without this the Schedule section
 * shows its error state locally and the contact form cannot submit at all no
 * matter what is in `.env` — the only way to exercise either route would be
 * `vercel dev`.
 *
 * Each handler is loaded through `ssrLoadModule` rather than a static import,
 * so editing anything under `api/` takes effect on the next request without
 * restarting the dev server.
 */

/** The routes this shim serves, and the module behind each. */
const ROUTES = [
  ['/api/schedules', '/api/schedules.js'],
  ['/api/inquiry', '/api/inquiry.js'],
]

/**
 * Server-only names copied out of `.env` into `process.env`.
 *
 * `VITE_RECAPTCHA_SITE_KEY` is deliberately absent: Vite handles VITE_* names
 * itself and inlines them into the client bundle, which is exactly what that
 * one wants and exactly what none of these want.
 */
const SERVER_ENV_KEYS = ['TRIPKET_API_BASE', 'TRIPKET_API_TOKEN', 'RECAPTCHA_SECRET_KEY']

/**
 * A dev-only ceiling on how much will be read off the wire before giving up.
 * Much larger than the 16KB the inquiry route actually accepts — that rule
 * lives in `api/_lib/body.js` and is enforced there, in the one place that
 * also runs in production. This is only here so a runaway local request
 * cannot exhaust the dev server's memory.
 */
const DEV_READ_CAP_BYTES = 1024 * 1024

function devApi() {
  return {
    name: 'tripket-dev-api',
    // Dev only. `vite build` produces the static bundle; on Vercel the real
    // runtime serves these functions.
    apply: 'serve',

    configureServer(server) {
      /*
       * The handlers read TRIPKET_API_BASE, TRIPKET_API_TOKEN and
       * RECAPTCHA_SECRET_KEY from process.env. Vite does not put non-VITE_
       * names there on its own, so they are loaded here with an empty prefix —
       * which means *every* name in `.env`, including any secret.
       *
       * That is safe only because this runs inside the dev server process.
       * Do not move these values into `define`, `import.meta.env` or any
       * client-visible option: the whole reason these names carry no VITE_
       * prefix is that Vite must not be able to inline them into the bundle
       * the browser downloads.
       */
      const env = loadEnv(server.config.mode, process.cwd(), '')
      for (const key of SERVER_ENV_KEYS) {
        if (env[key] && !process.env[key]) process.env[key] = env[key]
      }

      for (const [route, modulePath] of ROUTES) {
        server.middlewares.use(route, async (req, res) => {
          try {
            // Fresh each request, so edits under api/ are picked up live.
            const { default: handler } = await server.ssrLoadModule(modulePath)
            await handler(await shapeRequest(req), shapeResponse(res))
          } catch (error) {
            server.config.logger.error(`dev ${route} failed: ${error?.stack ?? error}`)
            if (!res.headersSent) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
            }
            // Both hooks read `error` off the body and ignore the rest, so one
            // shape covers either route.
            res.end(JSON.stringify({ ok: false, error: 'Dev API handler threw.' }))
          }
        })
      }
    },
  }
}

/**
 * Reads a request body into a string, or null when there is nothing to read.
 *
 * Vercel's Node runtime does this before the handler is entered; the shim has
 * to do it by hand, or every POST would arrive with an undefined body and the
 * contact form would fail locally for a reason that has nothing to do with
 * the code under test.
 */
function readBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return Promise.resolve(null)

  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0

    req.on('data', (chunk) => {
      size += chunk.length
      if (size > DEV_READ_CAP_BYTES) {
        // Stop reading rather than buffering an unbounded amount. The route's
        // own 16KB rule will have rejected this long before now in any real
        // request; this is the backstop.
        req.destroy()
        resolve(null)
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(chunks.length > 0 ? Buffer.concat(chunks).toString('utf8') : null))
    req.on('error', reject)
  })
}

/**
 * A Vercel-shaped `req`: `method`, `headers`, `query` and `body`.
 *
 * `body` is parsed here rather than left as a string, because that is what
 * Vercel hands a handler for a JSON content type. Leaving it as text would
 * send dev down a different branch of `api/_lib/body.js` than production
 * takes, which is the sort of difference that hides a bug until deploy.
 */
async function shapeRequest(req) {
  // Connect strips the mount path, so req.url is '/?date=today' here;
  // originalUrl keeps the full path when it is available.
  const url = new URL(req.originalUrl ?? req.url ?? '/', 'http://localhost')

  // Vercel hands a repeated parameter over as an array, and sanitizeParams
  // relies on that to ignore all but the first value. Object.fromEntries
  // would silently keep the last one instead, so dev would not behave like
  // production for `?date=today&date=whatever`.
  const query = {}
  for (const [key, value] of url.searchParams) {
    if (key in query) {
      query[key] = Array.isArray(query[key]) ? [...query[key], value] : [query[key], value]
    } else {
      query[key] = value
    }
  }

  const raw = await readBody(req)
  const type = req.headers['content-type'] ?? ''

  let body
  if (raw !== null && type.toLowerCase().includes('application/json')) {
    try {
      body = JSON.parse(raw)
    } catch {
      // Vercel answers a malformed JSON body itself. Passing the text through
      // lets the route return its own 400 instead, which is close enough and
      // keeps the failure inside code we can read.
      body = raw
    }
  } else {
    body = raw ?? undefined
  }

  return { method: req.method, headers: req.headers, query, body }
}

/** A Vercel-shaped `res`: adds the Express-style `status().json()` pair. */
function shapeResponse(res) {
  return {
    setHeader: (key, value) => res.setHeader(key, value),
    status(code) {
      res.statusCode = code
      return this
    },
    json(payload) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(payload))
      return this
    },
  }
}

export default defineConfig({
  plugins: [react(), devApi()],
})
