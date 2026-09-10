import fs from 'node:fs'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import Schedule from './Schedule'
import { BOOKING_AVAILABLE, CARRIER_LOGOS, INACTIVE_PARTNER_LOGOS, PARTNER_LOGOS, ROUTES } from '../data/content'

const LEG = {
  id: 'leg-1',
  origin: 'Cebu',
  destination: 'Tagbilaran',
  // 22:30 UTC is 06:30 the next morning in Manila.
  departsAt: '2026-09-08T22:30:00.000Z',
  arrivesAt: '2026-09-09T00:30:00.000Z',
  vessel: 'MV Ocean Jet 1',
  operator: 'OceanJet',
  fare: 1250,
  currency: 'PHP',
  seatsAvailable: 42,
}

function answer(body, { ok = true, status = 200 } = {}) {
  globalThis.fetch.mockResolvedValue({ ok, status, json: async () => body })
}

test('asks our own route, never the schedules API directly', async () => {
  answer({ schedules: [] })
  render(<Schedule />)

  await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
  const url = String(globalThis.fetch.mock.calls[0][0])
  expect(url.startsWith('/api/schedules?')).toBe(true)
  expect(url).toContain('date=today')
  expect(url).toContain('pageLimit=100')
  // No upstream host may appear in anything the browser runs.
  expect(url).not.toMatch(/tripket\.test|https?:\/\//)
})

test('shows placeholders while loading, then the sailings', async () => {
  answer({ schedules: [LEG] })
  render(<Schedule />)

  const panel = document.querySelector('.schedule-panel')
  expect(panel).toHaveAttribute('aria-busy', 'true')
  expect(document.querySelectorAll('.sailing.is-skeleton').length).toBeGreaterThan(0)

  const row = await screen.findByRole('listitem')
  expect(panel).toHaveAttribute('aria-busy', 'false')
  expect(document.querySelectorAll('.sailing.is-skeleton')).toHaveLength(0)

  expect(within(row).getByText(/Cebu/)).toBeInTheDocument()
  expect(within(row).getByText(/Tagbilaran/)).toBeInTheDocument()
  expect(within(row).getByText(/MV Ocean Jet 1 · OceanJet/)).toBeInTheDocument()
  expect(within(row).getByText(/42 seats left/)).toBeInTheDocument()
})

test('renders departure times in Philippine time, not the viewer’s zone', async () => {
  answer({ schedules: [LEG] })
  render(<Schedule />)

  const row = await screen.findByRole('listitem')
  // 22:30Z is 06:30 in Manila; a UTC-rendered time would read 10:30 PM.
  expect(within(row).getByText(/6:30/)).toBeInTheDocument()
  expect(within(row).queryByText(/10:30/)).not.toBeInTheDocument()
  expect(row.querySelector('time')).toHaveAttribute('datetime', LEG.departsAt)
})

test('leaves out fields the API did not return', async () => {
  answer({ schedules: [{ id: 'x', origin: 'Cebu', destination: 'Ormoc' }] })
  render(<Schedule />)

  const row = await screen.findByRole('listitem')
  expect(within(row).getByText(/Cebu/)).toBeInTheDocument()
  expect(row.textContent).not.toMatch(/undefined|NaN|seats left/)
  expect(row.querySelector('.sailing-vessel')).toBeNull()
})

test('shows the carrier’s own logo, from our own assets', async () => {
  answer({ schedules: [{ ...LEG, operatorCode: 'OJ' }] })
  render(<Schedule />)

  const row = await screen.findByRole('listitem')
  const logo = row.querySelector('.sailing-logo img')
  expect(logo).toHaveAttribute('src', CARRIER_LOGOS.OJ.src)
  // Same origin: the row must not hotlink the API's media host, because the
  // CSP allows images from 'self' only.
  expect(logo.getAttribute('src')).toMatch(/^\/assets\//)
  // The operator name is the adjacent text, so the logo stays decorative
  // rather than having a screen reader announce the carrier twice.
  expect(logo).toHaveAttribute('alt', '')
  expect(within(row).getByText(/MV Ocean Jet 1 · OceanJet/)).toBeInTheDocument()
})

test('falls back to a plain crest for a carrier we have no artwork for', async () => {
  answer({ schedules: [{ ...LEG, operatorCode: 'ZZ' }] })
  render(<Schedule />)

  const row = await screen.findByRole('listitem')
  expect(row.querySelector('.sailing-logo')).toBeNull()
  // The media box is still there, so the card keeps its neighbours' height.
  expect(row.querySelector('.sailing-media.is-blank')).toBeInTheDocument()
  expect(row.querySelector('.sailing-media img')).toBeNull()
  // Still names the operator, artwork or not.
  expect(within(row).getByText(/MV Ocean Jet 1 · OceanJet/)).toBeInTheDocument()
})

test('shows the carrier’s vessel photography, unlabelled', async () => {
  answer({ schedules: [{ ...LEG, operatorCode: 'OJ' }] })
  render(<Schedule />)

  const row = await screen.findByRole('listitem')
  const photo = row.querySelector('.sailing-media > img')
  expect(photo).toHaveAttribute('src', CARRIER_LOGOS.OJ.ship)
  expect(photo).toHaveAttribute('loading', 'lazy')
  /* alt="" rather than the vessel name: the photo is one of the line's ships,
     not necessarily the one working this leg, so naming it would assert
     something the API never said. */
  expect(photo).toHaveAttribute('alt', '')
})

test('the route reads as a heading under the section', async () => {
  answer({ schedules: [{ ...LEG, operatorCode: 'OJ' }] })
  render(<Schedule />)

  await screen.findByRole('listitem')
  const [heading] = screen.getAllByRole('heading', { level: 3 })
  /* Matched on text, not on the accessible name: dom-accessibility-api trims
     each text node before concatenating, so under jsdom the name comes out
     "CebutoTagbilaran". Chrome's own accessibility tree was checked directly
     over CDP and reports "Cebu to Tagbilaran" — the markup is right and it is
     the jsdom name computation that is lossy, so asserting on it here would
     be testing the shim. */
  expect(heading).toHaveTextContent(/Cebu.*to Tagbilaran/)
  // The arrow is decoration and must stay out of the announced name.
  expect(heading.querySelector('[aria-hidden="true"]')).toHaveTextContent('→')
})

/** Filename without its extension, for comparing an asset across encodings. */
const stem = (src) => src.split('/').pop().replace(/\.[^.]+$/, '')

test('every carrier logo and photo maps to an asset this project ships', () => {
  const logos = fs.readdirSync('public/assets/optimized/partners')
  const ships = fs.readdirSync('public/assets/optimized/ships')

  for (const [code, carrier] of Object.entries(CARRIER_LOGOS)) {
    expect(logos, `logo for ${code} (${carrier.name})`).toContain(carrier.src.split('/').pop())
    expect(ships, `photo for ${code} (${carrier.name})`).toContain(carrier.ship.split('/').pop())
  }
})

/**
 * The four codes the schedules API actually sends, pinned to the carrier each
 * one belongs to. Showing one shipping line's logo against another's sailing
 * misattributes a real company, so this is checked rather than assumed — a
 * mistyped code in content.js fails here instead of shipping.
 */
test('each operator code belongs to the right shipping line', () => {
  expect(CARRIER_LOGOS.OJ.name).toBe('OceanJet')
  expect(CARRIER_LOGOS.MS.name).toBe('Maayo Shipping Incorporation')
  expect(CARRIER_LOGOS.HS.name).toBe('HS Star Marine Shipping')
  expect(CARRIER_LOGOS.CS.name).toBe('Cokaliong Shipping Lines')

  // Each maps to its own distinct file — no two carriers share a logo.
  const files = Object.values(CARRIER_LOGOS).map((c) => c.src)
  expect(new Set(files).size).toBe(files.length)
})

/**
 * CARRIER_LOGOS is written out by hand so that the home page does not import
 * the partner arrays at runtime (see the comment on it in content.js). That
 * hand-copying is what this guards: the logo a carrier shows in a sailing row
 * must stay the one it shows in the trust bar, and importing both arrays here
 * costs nothing because tests are not bundled.
 */
test('every carrier logo still matches its partner entry', () => {
  const partners = [...PARTNER_LOGOS, ...INACTIVE_PARTNER_LOGOS]

  for (const [code, carrier] of Object.entries(CARRIER_LOGOS)) {
    const partner = partners.find((p) => p.code === code)
    expect(partner, `no partner entry carries code ${code}`).toBeDefined()
    expect(carrier.name, `name drifted for ${code}`).toBe(partner.name)
    expect(carrier.src, `logo drifted for ${code}`).toBe(partner.src)
    /* Stem, not the whole path: the sailing cards use a WebP re-encode of the
       partner carousel's JPEG (optimized/ships/), so the paths differ by
       design while the carrier must not. */
    expect(stem(carrier.ship), `ship photo drifted for ${code}`).toBe(stem(partner.ship))
  }

  // And every coded partner is reachable, so adding a code above without a
  // line in CARRIER_LOGOS does not silently leave that carrier logo-less.
  for (const partner of partners.filter((p) => p.code)) {
    expect(CARRIER_LOGOS, `${partner.name} has a code but no logo entry`).toHaveProperty(partner.code)
  }
})

/** A leg on a given route at a given Manila hour, for building fixtures. */
function leg(id, origin, destination, hour, line) {
  const [operator, operatorCode, vessel] = line
  return {
    id,
    origin,
    destination,
    // Manila is UTC+8, so 08:00Z reads as 4:00 PM.
    departsAt: `2026-09-08T${String(hour).padStart(2, '0')}:00:00.000Z`,
    vessel,
    operator,
    operatorCode,
  }
}

const OJ = ['Oceanjet', 'OJ', 'Oceanjet']
const MS = ['Maayo Shipping', 'MS', 'Vessel 1']
const CS = ['Cokaliong Shipping', 'CS', 'MV Filipinas']

/**
 * Shaped like the real day: one busy route running repeatedly, a couple of
 * quieter ones, and two lines with a single route each. Nine departures across
 * five routes, so grouping, filtering and the counts are all exercised.
 */
const MIXED = [
  leg('oj-1', 'Cebu', 'Tagbilaran', 1, OJ),
  leg('oj-2', 'Cebu', 'Tagbilaran', 3, OJ),
  leg('oj-3', 'Cebu', 'Tagbilaran', 5, OJ),
  leg('oj-4', 'Tagbilaran', 'Cebu', 2, OJ),
  leg('oj-5', 'Tagbilaran', 'Cebu', 4, OJ),
  leg('oj-6', 'Cebu', 'Ormoc', 6, OJ),
  leg('ms-1', 'Sibulan', 'Liloan', 1, MS),
  leg('ms-2', 'Sibulan', 'Liloan', 7, MS),
  leg('cs-1', 'Cebu', 'Nasipit', 8, CS),
]

test('one card per route, not per departure', async () => {
  answer({ schedules: MIXED })
  render(<Schedule />)

  // Nine departures across five routes, and the grid shows four of them.
  expect(await screen.findAllByRole('listitem')).toHaveLength(4)

  const [busiest] = screen.getAllByRole('listitem')
  expect(within(busiest).getByRole('heading', { level: 3 })).toHaveTextContent(/Cebu.*to Tagbilaran/)
  // All three of that route's departures on the one card.
  const times = [...busiest.querySelectorAll('.sailing-chip')].map((c) => c.textContent)
  expect(times).toEqual(['9:00 AM', '11:00 AM', '1:00 PM'])
})

test('caps the times listed and says how many it held back', async () => {
  // Eight departures on one route, two past the six a card prints.
  answer({ schedules: Array.from({ length: 8 }, (_, i) => leg(`oj-${i}`, 'Cebu', 'Tagbilaran', i, OJ)) })
  render(<Schedule />)

  const row = await screen.findByRole('listitem')
  expect(row.querySelectorAll('time')).toHaveLength(6)
  expect(within(row).getByText('+2 more')).toBeInTheDocument()
})

test('keeps two vessels working the same route as separate cards', async () => {
  answer({
    schedules: [
      leg('a', 'Bacolod', 'Iloilo', 1, ['Oceanjet', 'OJ', 'Oceanjet']),
      leg('b', 'Bacolod', 'Iloilo', 1, ['Oceanjet', 'OJ', 'SS Fixed']),
    ],
  })
  render(<Schedule />)

  /* Same line, same crossing, same time, different ship — both are real and
     bookable, so merging them would hide a sailing. */
  const rows = await screen.findAllByRole('listitem')
  expect(rows).toHaveLength(2)
  expect(rows.map((r) => r.querySelector('.sailing-vessel').textContent)).toEqual([
    'Oceanjet · Oceanjet',
    'SS Fixed · Oceanjet',
  ])
})

test('prices a multi-departure route "from", and drops the seat count', async () => {
  answer({
    schedules: [
      { ...leg('a', 'Cebu', 'Tagbilaran', 1, OJ), fare: 900, currency: 'PHP', seatsAvailable: 12 },
      { ...leg('b', 'Cebu', 'Tagbilaran', 3, OJ), fare: 640, currency: 'PHP', seatsAvailable: 30 },
    ],
  })
  render(<Schedule />)

  const row = await screen.findByRole('listitem')
  // The cheapest of the two, marked as a floor rather than the price.
  expect(within(row).getByText(/from/i)).toBeInTheDocument()
  expect(row.querySelector('.sailing-fare').textContent).toMatch(/640/)
  /* Seats belong to a departure, not to a route, so there is no honest single
     number for the card — 42 seats "left" on a route running twice is a lie
     either way you total it. */
  expect(row.textContent).not.toMatch(/seats left/)
})

test('caps how many route cards render at once', async () => {
  // Twelve distinct routes; the grid shows four.
  answer({
    schedules: Array.from({ length: 12 }, (_, i) => leg(`oj-${i}`, 'Cebu', `Port ${i}`, i, OJ)),
  })
  render(<Schedule />)

  expect(await screen.findAllByRole('listitem')).toHaveLength(4)
  /* The "See all departures" link is hidden while the web app is down, so the
     grid is now the only thing that says there is more. It must still cap. */
  expect(screen.queryByRole('link', { name: /see all departures/i })).not.toBeInTheDocument()
})

test('no way through to the timetable while the web app is down', async () => {
  answer({ schedules: MIXED })
  render(<Schedule />)

  await screen.findAllByRole('listitem')

  /* BOOKING_AVAILABLE is false, so nothing here may link to app.tripketph.com
     — not the section CTA, not the per-route "+N more". A link that cannot
     answer is worse than no link. */
  expect(BOOKING_AVAILABLE).toBe(false)
  expect(screen.queryByRole('link', { name: /see all departures/i })).not.toBeInTheDocument()
  expect(document.querySelectorAll('a[href^="https://app.tripketph.com"]')).toHaveLength(0)

  // The destination still has to be right for when the flag flips back.
  expect(ROUTES.schedule).toBe('https://app.tripketph.com/schedule')
})

test('no way-out link when the section has nothing to show', async () => {
  answer({ schedules: [] })
  render(<Schedule />)

  // The empty state carries its own "Open the web app" link; a second one
  // under an empty grid would be two CTAs pointing at the same product.
  await screen.findByText(/no sailings are listed for today/i)
  expect(screen.queryByRole('link', { name: /see all departures/i })).not.toBeInTheDocument()
})

test('says so when there is nothing sailing today', async () => {
  answer({ schedules: [] })
  render(<Schedule />)

  expect(await screen.findByText(/no sailings are listed for today/i)).toBeInTheDocument()
  // The message stays; its link to the web app is hidden with the rest.
  expect(screen.queryByRole('link', { name: /open the web app/i })).not.toBeInTheDocument()
  expect(screen.queryAllByRole('listitem')).toHaveLength(0)
})

test('surfaces the reason the request failed and retries on request', async () => {
  answer({ error: 'Too many requests. Try again shortly.', schedules: [] }, { ok: false, status: 429 })
  const user = userEvent.setup()
  render(<Schedule />)

  expect(await screen.findByText(/too many requests/i)).toBeInTheDocument()

  // A retry is the visitor's choice: retrying on a loop would hammer an
  // upstream that is already struggling.
  expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  answer({ schedules: [LEG] })
  await user.click(screen.getByRole('button', { name: /try again/i }))

  expect(await screen.findByRole('listitem')).toBeInTheDocument()
  expect(globalThis.fetch).toHaveBeenCalledTimes(2)
})

test('reports a network failure without leaking the exception', async () => {
  globalThis.fetch.mockRejectedValue(new Error('ECONNREFUSED 127.0.0.1:3000'))
  render(<Schedule />)

  const notice = await screen.findByText(/could not reach the schedule service/i)
  expect(notice).toBeInTheDocument()
  expect(document.body.textContent).not.toMatch(/ECONNREFUSED|127\.0\.0\.1/)
})

test('does not update state after unmounting mid-request', async () => {
  let resolve
  globalThis.fetch.mockReturnValue(new Promise((r) => { resolve = r }))
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {})

  const view = render(<Schedule />)
  view.unmount()
  resolve({ ok: true, status: 200, json: async () => ({ schedules: [LEG] }) })
  await new Promise((r) => setTimeout(r, 0))

  // React warns loudly about setting state on an unmounted tree.
  expect(errors).not.toHaveBeenCalled()
})
