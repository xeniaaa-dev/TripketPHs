import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import App from '../App'
import {
  ABOUT_PILLARS,
  FOUNDERS,
  PARTNER_LOGOS,
  ROUTES,
} from '../data/content'

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  window.history.pushState({}, '', '/')
})

test('the home page renders at the root path', () => {
  render(<App />)
  expect(
    screen.getByRole('heading', { level: 1, name: /the new tripket ph is here/i }),
  ).toBeInTheDocument()
})

test('clicking About in the nav renders the about page without a reload', async () => {
  const user = userEvent.setup()
  render(<App />)

  await user.click(screen.getAllByRole('link', { name: 'About' })[0])

  expect(window.location.pathname).toBe('/about')
  expect(screen.getByRole('heading', { level: 1, name: /about tripket ph/i })).toBeInTheDocument()
  expect(
    screen.getByText(/philippine-based online ticketing and cargo shipping platform/i),
  ).toBeInTheDocument()
})

test('Home in the nav routes back to the home page from another route', async () => {
  const user = userEvent.setup()
  render(<App />)

  await user.click(screen.getAllByRole('link', { name: 'About' })[0])
  expect(window.location.pathname).toBe('/about')

  // Regression: Home used to be a bare `#top` fragment, which resolved
  // against the current URL and left the user on /about#top.
  await user.click(screen.getAllByRole('link', { name: 'Home' })[0])

  expect(window.location.pathname).toBe('/')
  expect(window.location.hash).toBe('')
  expect(
    screen.getByRole('heading', { level: 1, name: /the new tripket ph is here/i }),
  ).toBeInTheDocument()
})

test('Home stays an in-page scroll anchor while already on the home page', () => {
  render(<App />)

  const home = screen.getAllByRole('link', { name: 'Home' })[0]
  expect(home).toHaveAttribute('href', ROUTES.top)
  expect(home).toHaveAttribute('aria-current', 'page')
})

test('clicking Partners in the nav renders the partners page', async () => {
  const user = userEvent.setup()
  render(<App />)

  await user.click(screen.getAllByRole('link', { name: 'Partners' })[0])

  expect(window.location.pathname).toBe('/partners')
  expect(
    screen.getByRole('heading', { level: 1, name: /trusted by shipping lines nationwide/i }),
  ).toBeInTheDocument()
})

test('the about page carries the mission, vision, values and every founder', () => {
  window.history.pushState({}, '', '/about')
  render(<App />)

  ABOUT_PILLARS.forEach(({ title, body }) => {
    expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument()
    expect(screen.getByText(body)).toBeInTheDocument()
  })

  // The split layout shows each founder twice: once in the faces gallery and
  // once in the detail card beside it. The quote appears only in the card.
  const faces = document.querySelector('.founder-faces')
  const cards = document.querySelector('.founder-cards')

  FOUNDERS.forEach(({ name, role, quote }) => {
    expect(screen.getAllByText(name)).toHaveLength(2)
    expect(within(faces).getByText(name)).toBeInTheDocument()
    expect(within(cards).getByText(name)).toBeInTheDocument()
    expect(within(cards).getByText(quote)).toBeInTheDocument()
    expect(within(faces).getAllByText(role).length).toBeGreaterThan(0)
  })

  // The gallery repeats what the cards already say, so it is not announced.
  expect(faces).toHaveAttribute('aria-hidden', 'true')

  expect(screen.getByText(/mats place, hibbard avenue/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'support@tripketph.com' })).toHaveAttribute(
    'href',
    'mailto:support@tripketph.com',
  )
})

test('the partners carousel carries every shipping line, its blurb and its vessel', () => {
  window.history.pushState({}, '', '/partners')
  render(<App />)

  const track = document.querySelector('.p-track')
  expect(track.children).toHaveLength(PARTNER_LOGOS.length)

  PARTNER_LOGOS.forEach(({ name, blurb, ship, src }) => {
    expect(within(track).getByRole('heading', { level: 3, name })).toBeInTheDocument()
    expect(within(track).getByText(blurb)).toBeInTheDocument()
    // The vessel photo carries the alt text; the logo beside it is decorative.
    const photo = within(track).getByRole('img', { name: `${name} vessel` })
    expect(photo).toHaveAttribute('src', ship)
    expect(track.querySelector(`img[src="${src}"]`)).toHaveAttribute('alt', '')
  })
})

test('every partner has a vessel photo bundled with the site', () => {
  PARTNER_LOGOS.forEach(({ name, ship }) => {
    expect(ship, `${name} is missing a vessel photo`).toBeTruthy()
    // Served from our own /public, not hot-linked from tripketph.com storage.
    expect(ship.startsWith('/assets/')).toBe(true)
  })
})

test('a partner card reveals the rest of its description on demand', async () => {
  const user = userEvent.setup()
  window.history.pushState({}, '', '/partners')
  render(<App />)

  const track = document.querySelector('.p-track')
  const first = within(track).getAllByRole('button', { name: /learn more/i })[0]
  const card = first.closest('.p-card')

  expect(first).toHaveAttribute('aria-expanded', 'false')
  expect(card).not.toHaveClass('is-expanded')
  expect(document.getElementById(first.getAttribute('aria-controls'))).toBeInTheDocument()

  await user.click(first)
  expect(card).toHaveClass('is-expanded')
  expect(within(card).getByRole('button', { name: /show less/i })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
})

test('the carousel exposes labelled prev/next controls, disabled at the start', () => {
  window.history.pushState({}, '', '/partners')
  render(<App />)

  const prev = screen.getByRole('button', { name: /previous partners/i })
  const next = screen.getByRole('button', { name: /next partners/i })

  // jsdom has no layout, so the track never scrolls; prev must still start off.
  expect(prev).toBeDisabled()
  expect(next).toBeInTheDocument()
  expect(document.querySelector('.p-track')).toHaveAttribute('tabindex', '0')
})

test('every partner has a description', () => {
  PARTNER_LOGOS.forEach(({ name, blurb }) => {
    expect(blurb, `${name} is missing a blurb`).toBeTruthy()
  })
})

test('the nav marks the current page and the browser back button returns home', async () => {
  const user = userEvent.setup()
  render(<App />)

  await user.click(screen.getAllByRole('link', { name: 'Partners' })[0])
  expect(screen.getAllByRole('link', { name: 'Partners' })[0]).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect(screen.getAllByRole('link', { name: 'Home' })[0]).not.toHaveAttribute('aria-current')

  // jsdom dispatches popstate asynchronously, so poll rather than assume.
  window.history.back()
  await waitFor(() => expect(window.location.pathname).toBe('/'))
  expect(
    screen.getByRole('heading', { level: 1, name: /the new tripket ph is here/i }),
  ).toBeInTheDocument()
})

test('links this project does not own are left as real navigations', () => {
  window.history.pushState({}, '', '/partners')
  render(<App />)

  // The support pages and admin dashboard live outside this project; the
  // router must not swallow those clicks and pretend they routed.
  const contact = screen.getAllByRole('link', { name: /contact us to partner/i })[0]
  expect(contact).toHaveAttribute('href', ROUTES.contact)

  const admin = screen.getAllByRole('link', { name: /admin dashboard/i })[0]
  expect(admin).toHaveAttribute('href', ROUTES.admin)
})

test('an unknown path falls back to the home page', () => {
  window.history.pushState({}, '', '/does-not-exist')
  render(<App />)

  expect(
    screen.getByRole('heading', { level: 1, name: /the new tripket ph is here/i }),
  ).toBeInTheDocument()
})
