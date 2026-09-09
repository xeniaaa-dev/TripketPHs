import { beforeEach, describe, expect, test, vi } from 'vitest'
import { PAGE_LIMIT_DEFAULT, PAGE_LIMIT_MAX, sanitizeParams } from './params.js'
import { MAX_REQUESTS, clientKey, rateLimit, __reset } from './ratelimit.js'
import { normalizeSchedules } from './normalize.js'

describe('parameter allowlist', () => {
  test('passes the four documented values through', () => {
    expect(
      sanitizeParams({ date: 'tomorrow', sortColumn: 'price', sortDirection: 'desc', pageLimit: '5' }),
    ).toEqual({ date: 'tomorrow', sortColumn: 'price', sortDirection: 'desc', pageLimit: 5 })
  })

  test('replaces anything off the list with the default, never the input', () => {
    const out = sanitizeParams({
      date: '../../etc/passwd',
      sortColumn: 'password',
      sortDirection: 'DROP TABLE',
    })
    expect(out).toEqual({
      date: 'today',
      sortColumn: 'departure_ts',
      sortDirection: 'asc',
      pageLimit: PAGE_LIMIT_DEFAULT,
    })
    // Nothing the caller sent survives anywhere in the result.
    expect(JSON.stringify(out)).not.toMatch(/passwd|password|DROP/i)
  })

  test('bounds pageLimit so a caller cannot ask the upstream for everything', () => {
    expect(sanitizeParams({ pageLimit: '9999' }).pageLimit).toBe(PAGE_LIMIT_MAX)
    expect(sanitizeParams({ pageLimit: '-5' }).pageLimit).toBe(1)
    expect(sanitizeParams({ pageLimit: 'abc' }).pageLimit).toBe(PAGE_LIMIT_DEFAULT)
  })

  test('a repeated param cannot smuggle a second value', () => {
    expect(sanitizeParams({ date: ['today', 'evil'] }).date).toBe('today')
    expect(sanitizeParams({ date: ['evil', 'today'] }).date).toBe('today')
  })
})

describe('rate limiting', () => {
  beforeEach(() => __reset())

  test('allows up to the limit, then refuses with a retry hint', () => {
    for (let i = 0; i < MAX_REQUESTS; i += 1) {
      expect(rateLimit('1.2.3.4', 1000).ok, `request ${i + 1} should pass`).toBe(true)
    }
    const blocked = rateLimit('1.2.3.4', 1000)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfter).toBeGreaterThan(0)
  })

  test('counts each address separately', () => {
    for (let i = 0; i < MAX_REQUESTS; i += 1) rateLimit('1.2.3.4', 1000)
    expect(rateLimit('1.2.3.4', 1000).ok).toBe(false)
    expect(rateLimit('5.6.7.8', 1000).ok).toBe(true)
  })

  test('opens up again once the window has passed', () => {
    for (let i = 0; i < MAX_REQUESTS + 5; i += 1) rateLimit('1.2.3.4', 1000)
    expect(rateLimit('1.2.3.4', 1000).ok).toBe(false)
    expect(rateLimit('1.2.3.4', 1000 + 60_001).ok).toBe(true)
  })

  test('keys on the first x-forwarded-for entry, not a later proxy hop', () => {
    // Later entries are attacker-influenced; using them would let one client
    // rotate its key and evade the counter entirely.
    expect(clientKey({ headers: { 'x-forwarded-for': '9.9.9.9, 10.0.0.1, 10.0.0.2' } })).toBe('9.9.9.9')
    expect(clientKey({ headers: { 'x-real-ip': '8.8.8.8' } })).toBe('8.8.8.8')
    expect(clientKey({ headers: {} })).toBe('unknown')
  })
})

describe('response normalising', () => {
  test('reads snake_case fields out of a data wrapper', () => {
    const [leg] = normalizeSchedules({
      data: [
        {
          id: 7,
          origin_name: 'Cebu',
          destination_name: 'Tagbilaran',
          departure_ts: 1788000000,
          vessel_name: 'MV Ocean Jet 1',
          shipping_line_name: 'OceanJet',
          price: '1250.00',
          seats_available: 42,
        },
      ],
    })
    expect(leg).toMatchObject({
      id: '7',
      origin: 'Cebu',
      destination: 'Tagbilaran',
      vessel: 'MV Ocean Jet 1',
      operator: 'OceanJet',
      fare: 1250,
      currency: 'PHP',
      seatsAvailable: 42,
    })
    // epoch seconds, not milliseconds
    expect(leg.departsAt).toBe(new Date(1788000000 * 1000).toISOString())
  })

  test('carries the operator code through so the UI can find a local logo', () => {
    const [leg] = normalizeSchedules([
      {
        origin_port: { name: 'Dumaguete City Port' },
        destination_port: { name: 'Cebu City (Capital)' },
        departure_ts: '2026-09-07T19:00:00.000000Z',
        operator: { id: 2, name: 'Oceanjet', code: 'oj' },
      },
    ])
    // Upper-cased, so a lookup does not depend on the upstream's casing.
    expect(leg.operatorCode).toBe('OJ')
  })

  test('drops an operator code that is not a short token', () => {
    const junk = (code) => normalizeSchedules([{ origin: 'A', destination: 'B', operator: { code } }])[0]
    expect(junk('../../etc/passwd')).not.toHaveProperty('operatorCode')
    expect(junk('a'.repeat(40))).not.toHaveProperty('operatorCode')
    expect(junk('<script>')).not.toHaveProperty('operatorCode')
    expect(junk('')).not.toHaveProperty('operatorCode')
  })

  test('accepts nested {name} ports and an ISO departure', () => {
    const [leg] = normalizeSchedules([
      { from: { name: 'Iloilo' }, to: { name: 'Bacolod' }, departure_time: '2026-09-08T14:30:00Z' },
    ])
    expect(leg.origin).toBe('Iloilo')
    expect(leg.destination).toBe('Bacolod')
    expect(leg.departsAt).toBe('2026-09-08T14:30:00.000Z')
  })

  test('omits fields it cannot find instead of inventing them', () => {
    const [leg] = normalizeSchedules([{ origin: 'Cebu', destination: 'Ormoc' }])
    expect(leg).not.toHaveProperty('fare')
    expect(leg).not.toHaveProperty('seatsAvailable')
    expect(leg.vessel).toBeUndefined()
  })

  test('survives shapes it does not recognise', () => {
    expect(normalizeSchedules({ unexpected: 'shape' })).toEqual([])
    expect(normalizeSchedules(null)).toEqual([])
    expect(normalizeSchedules([null, 42, 'x'])).toEqual([])
    // a row with no endpoints and no time carries nothing worth showing
    expect(normalizeSchedules([{ vessel: 'MV Nothing' }])).toEqual([])
  })

  test('collapses rows that would render as the same sailing', () => {
    const leg = {
      origin_port: { name: 'Cebu City (Capital)' },
      destination_port: { name: 'Tagbilaran City (Capital)' },
      departure_ts: '2026-09-08T22:00:00.000000Z',
      vessel: { name: 'Oceanjet' },
      operator: { name: 'Oceanjet', code: 'OJ' },
    }
    // Distinct ids and distinct fares — which is how a duplicate actually
    // arrives, so neither may be enough to keep a second card.
    const rows = normalizeSchedules([
      { ...leg, id: 1, accommodations: [{ base_fare: 380 }] },
      { ...leg, id: 2, accommodations: [{ base_fare: 640 }] },
      { ...leg, id: 3 },
    ])
    expect(rows).toHaveLength(1)
    // The first occurrence wins, so the upstream's own ordering survives.
    expect(rows[0].id).toBe('1')
  })

  test('treats a departure seconds apart as the same one', () => {
    const at = (ts) => ({
      origin: 'Sibulan',
      destination: 'Liloan',
      departure_ts: ts,
      vessel: 'Vessel 1',
    })
    // The cards render to the minute, so 06:00:00 and 06:00:20 are one
    // departure as far as anyone reading the page can tell.
    expect(normalizeSchedules([at('2026-09-08T06:00:00Z'), at('2026-09-08T06:00:20Z')])).toHaveLength(1)
    expect(normalizeSchedules([at('2026-09-08T06:00:00Z'), at('2026-09-08T06:30:00Z')])).toHaveLength(2)
  })

  test('keeps two real sailings that only look alike', () => {
    const shared = {
      origin: 'Cebu',
      destination: 'Tagbilaran',
      departure_ts: '2026-09-08T22:00:00Z',
      shipping_line_name: 'OceanJet',
    }
    // Two ships leaving the same port for the same place at the same time is
    // ordinary, and both are bookable — collapsing them would hide a sailing.
    const rows = normalizeSchedules([
      { ...shared, vessel_name: 'Oceanjet 6' },
      { ...shared, vessel_name: 'Oceanjet 8' },
    ])
    expect(rows).toHaveLength(2)
    expect(rows.map((r) => r.vessel)).toEqual(['Oceanjet 6', 'Oceanjet 8'])
  })

  test('fills the requested count with distinct rows, not with duplicates', () => {
    const dupe = { origin: 'A', destination: 'B', departure_ts: '2026-09-08T01:00:00Z' }
    const payload = [
      dupe,
      dupe,
      dupe,
      { origin: 'A', destination: 'C', departure_ts: '2026-09-08T02:00:00Z' },
      { origin: 'A', destination: 'D', departure_ts: '2026-09-08T03:00:00Z' },
    ]
    /* De-duplicating before the limit is what makes this 3 rather than 2: a
       caller asking for three gets three distinct sailings, not three rows
       that collapse. */
    expect(normalizeSchedules(payload, 3)).toHaveLength(3)
    expect(normalizeSchedules(payload, 3).map((r) => r.destination)).toEqual(['B', 'C', 'D'])
  })

  test('never returns more rows than asked for', () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ origin: 'A', destination: `B${i}` }))
    expect(normalizeSchedules(many, 10)).toHaveLength(10)
  })
})

describe('the proxy handler', () => {
  function makeRes() {
    const res = {
      statusCode: null,
      body: null,
      headers: {},
      setHeader(k, v) {
        this.headers[k.toLowerCase()] = v
      },
      status(code) {
        this.statusCode = code
        return this
      },
      json(payload) {
        this.body = payload
        return this
      },
    }
    return res
  }

  let handler
  beforeEach(async () => {
    __reset()
    vi.resetModules()
    vi.restoreAllMocks()
    process.env.TRIPKET_API_BASE = 'https://api.example.test'
    delete process.env.TRIPKET_API_TOKEN
    handler = (await import('../schedules.js')).default
  })

  test('refuses anything but GET', async () => {
    const res = makeRes()
    await handler({ method: 'POST', headers: {}, query: {} }, res)
    expect(res.statusCode).toBe(405)
    expect(res.headers.allow).toBe('GET')
  })

  test('rebuilds the upstream URL from a fixed host and only allowlisted values', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ origin: 'Cebu', destination: 'Ormoc', departure_ts: 1788000000 }] }),
    })

    const res = makeRes()
    await handler(
      {
        method: 'GET',
        headers: { 'x-forwarded-for': '1.1.1.1' },
        query: { date: 'tomorrow', pageLimit: '999', evil: 'https://attacker.example' },
      },
      res,
    )

    const called = new URL(fetchMock.mock.calls[0][0])
    expect(called.origin).toBe('https://api.example.test')
    expect(called.pathname).toBe('/api/legs/featured-schedules')
    expect(called.searchParams.get('date')).toBe('tomorrow')
    expect(called.searchParams.get('pageLimit')).toBe(String(PAGE_LIMIT_MAX))
    // the caller's own key never reaches the upstream
    expect(called.searchParams.has('evil')).toBe(false)

    expect(res.statusCode).toBe(200)
    expect(res.body.schedules).toHaveLength(1)
    expect(res.headers['cache-control']).toMatch(/s-maxage=60/)
  })

  test('answers 429 once one address is over the limit', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [] }) })
    const req = { method: 'GET', headers: { 'x-forwarded-for': '2.2.2.2' }, query: {} }
    for (let i = 0; i < MAX_REQUESTS; i += 1) await handler(req, makeRes())

    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(429)
    expect(res.headers['retry-after']).toBeDefined()
    expect(res.body.schedules).toEqual([])
  })

  test('reports unavailable, and logs, when the upstream base is unset', async () => {
    delete process.env.TRIPKET_API_BASE
    vi.resetModules()
    const fresh = (await import('../schedules.js')).default
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = makeRes()
    await fresh({ method: 'GET', headers: {}, query: {} }, res)
    expect(res.statusCode).toBe(503)
    expect(logged).toHaveBeenCalled()
  })

  test('rejects a plaintext http upstream on a public host', async () => {
    process.env.TRIPKET_API_BASE = 'http://api.public-example.com'
    vi.resetModules()
    const fresh = (await import('../schedules.js')).default
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchMock = vi.spyOn(globalThis, 'fetch')

    const res = makeRes()
    await fresh({ method: 'GET', headers: {}, query: {} }, res)
    expect(res.statusCode).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('does not pass the upstream status or body back to the caller', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 418,
      json: async () => ({ secret: 'internal stack trace', sql: 'select * from users' }),
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = makeRes()
    await handler({ method: 'GET', headers: {}, query: {} }, res)
    expect(res.statusCode).toBe(502)
    expect(JSON.stringify(res.body)).not.toMatch(/secret|stack trace|select|418/i)
  })

  test('turns an upstream timeout into 504 rather than hanging', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      Object.assign(new Error('aborted'), { name: 'AbortError' }),
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = makeRes()
    await handler({ method: 'GET', headers: {}, query: {} }, res)
    expect(res.statusCode).toBe(504)
  })

  test('sends the upstream credential but never returns it', async () => {
    process.env.TRIPKET_API_TOKEN = 'super-secret-token'
    vi.resetModules()
    const fresh = (await import('../schedules.js')).default
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    })

    const res = makeRes()
    await fresh({ method: 'GET', headers: {}, query: {} }, res)
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer super-secret-token')
    expect(JSON.stringify(res.body)).not.toContain('super-secret-token')
  })
})
