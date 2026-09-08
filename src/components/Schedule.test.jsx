import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import Schedule from './Schedule'

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
  expect(url).toContain('pageLimit=10')
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

test('says so when there is nothing sailing today', async () => {
  answer({ schedules: [] })
  render(<Schedule />)

  expect(await screen.findByText(/no sailings are listed for today/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /open the web app/i })).toBeInTheDocument()
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
