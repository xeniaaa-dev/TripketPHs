import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Serves the `api/` serverless functions during `npm run dev`.
 *
 * Vite alone does not serve `/api`, so without this the Schedule section
 * shows its error state locally no matter what is in `.env` — the only way to
 * exercise the proxy would be `vercel dev`.
 *
 * The handler is loaded through `ssrLoadModule` rather than a static import,
 * so editing anything under `api/` takes effect on the next request without
 * restarting the dev server.
 */
function devApi() {
  return {
    name: 'tripket-dev-api',
    // Dev only. `vite build` produces the static bundle; on Vercel the real
    // runtime serves these functions.
    apply: 'serve',

    configureServer(server) {
      /*
       * The handler reads TRIPKET_API_BASE and TRIPKET_API_TOKEN from
       * process.env. Vite does not put non-VITE_ names there on its own, so
       * they are loaded here with an empty prefix — which means *every* name
       * in `.env`, including the token.
       *
       * That is safe only because this runs inside the dev server process.
       * Do not move these values into `define`, `import.meta.env` or any
       * client-visible option: the whole reason the names carry no VITE_
       * prefix is that Vite must not be able to inline them into the bundle
       * the browser downloads.
       */
      const env = loadEnv(server.config.mode, process.cwd(), '')
      for (const key of ['TRIPKET_API_BASE', 'TRIPKET_API_TOKEN']) {
        if (env[key] && !process.env[key]) process.env[key] = env[key]
      }

      server.middlewares.use('/api/schedules', async (req, res) => {
        try {
          // Fresh each request, so edits under api/ are picked up live.
          const { default: handler } = await server.ssrLoadModule('/api/schedules.js')
          await handler(shapeRequest(req), shapeResponse(res))
        } catch (error) {
          server.config.logger.error(`dev /api/schedules failed: ${error?.stack ?? error}`)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
          }
          res.end(JSON.stringify({ error: 'Dev API handler threw.', schedules: [] }))
        }
      })
    },
  }
}

/**
 * A Vercel-shaped `req`. Only the three things the handler actually reads are
 * provided: `method`, `headers` and `query`.
 */
function shapeRequest(req) {
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

  return { method: req.method, headers: req.headers, query }
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
