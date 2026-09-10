import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import App from '../App'
import { isInternalRoute } from '../hooks/useRouter'
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

/**
 * Renders the app at a path and waits for the route to arrive. Pages are
 * code-split, so a route's component resolves a microtask after render and
 * every query would otherwise run against the empty Suspense placeholder.
 * Waiting on the <h1> is the cheapest proof the real page mounted.
 */
const go = async (path) => {
  window.history.pushState({}, '', path)
  const view = render(<App />)
  await screen.findByRole('heading', { level: 1 })
  return view
}

test('the home page renders at the root path', async () => {
  await go('/')
  expect(
    screen.getByRole('heading', { level: 1, name: /the new tripket ph is here/i }),
  ).toBeInTheDocument()
})

test('clicking About in the nav renders the about page without a reload', async () => {
  const user = userEvent.setup()
  await go('/')

  await user.click(screen.getAllByRole('link', { name: 'About' })[0])

  expect(window.location.pathname).toBe('/about')
  expect(await screen.findByRole('heading', { level: 1, name: /about tripket ph/i })).toBeInTheDocument()
  expect(
    screen.getByText(/philippine-based online ticketing and cargo shipping platform/i),
  ).toBeInTheDocument()
})

test('Home in the nav routes back to the home page from another route', async () => {
  const user = userEvent.setup()
  await go('/')

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

test('Home stays an in-page scroll anchor while already on the home page', async () => {
  await go('/')

  const home = screen.getAllByRole('link', { name: 'Home' })[0]
  expect(home).toHaveAttribute('href', ROUTES.top)
  expect(home).toHaveAttribute('aria-current', 'page')
})

test('clicking Partners in the nav renders the partners page', async () => {
  const user = userEvent.setup()
  await go('/')

  await user.click(screen.getAllByRole('link', { name: 'Partners' })[0])

  expect(window.location.pathname).toBe('/partners')
  expect(
    await screen.findByRole('heading', { level: 1, name: /trusted by shipping lines nationwide/i }),
  ).toBeInTheDocument()
})

test('the about page carries the mission, vision, values and every founder', async () => {
  await go('/about')

  ABOUT_PILLARS.forEach(({ title, body }) => {
    expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument()
    expect(screen.getByText(body)).toBeInTheDocument()
  })

  // One card per founder, and only one: the portrait gallery that used to
  // repeat every name beside these cards has been removed, so a second
  // occurrence of a name would mean it crept back in.
  const cards = document.querySelector('.founder-cards')

  FOUNDERS.forEach(({ name, role, quote }) => {
    expect(screen.getAllByText(name)).toHaveLength(1)
    expect(within(cards).getByText(name)).toBeInTheDocument()
    expect(within(cards).getByText(quote)).toBeInTheDocument()
    expect(within(cards).getAllByText(role).length).toBeGreaterThan(0)
  })

  expect(cards.querySelectorAll('.founder-card')).toHaveLength(FOUNDERS.length)
  expect(document.querySelector('.founder-faces')).toBeNull()

  expect(screen.getByText(/mats place, hibbard avenue/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'support@tripketph.com' })).toHaveAttribute(
    'href',
    'mailto:support@tripketph.com',
  )
})

test('the partners carousel carries every shipping line, its blurb and its vessel', async () => {
  await go('/partners')

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

test('every partner has a vessel photo bundled with the site', async () => {
  PARTNER_LOGOS.forEach(({ name, ship }) => {
    expect(ship, `${name} is missing a vessel photo`).toBeTruthy()
    // Served from our own /public, not hot-linked from tripketph.com storage.
    expect(ship.startsWith('/assets/')).toBe(true)
  })
})

test('a partner card states its description outright, with nothing to expand', async () => {
  await go('/partners')

  const track = document.querySelector('.p-track')

  // No Learn more / Show less toggle inside the track, and none of the cards
  // is in an expanded state — the whole disclosure is gone, not just hidden.
  expect(within(track).queryAllByRole('button', { name: /learn more|show less/i })).toHaveLength(0)
  expect(track.querySelectorAll('.p-card.is-expanded')).toHaveLength(0)

  // Each blurb is rendered whole, so the copy is readable without the toggle.
  PARTNER_LOGOS.forEach(({ name, blurb }) => {
    const card = within(track).getByRole('heading', { level: 3, name }).closest('.p-card')
    expect(within(card).getByText(blurb)).toBeInTheDocument()
  })
})

test('the carousel track is keyboard reachable and holds one slide per partner', async () => {
  await go('/partners')

  const track = document.querySelector('.p-track')
  expect(track).toHaveAttribute('tabindex', '0')
  expect(track.children).toHaveLength(PARTNER_LOGOS.length)
  expect(track).toHaveAccessibleName(new RegExp(`${PARTNER_LOGOS.length} shipping line`))
})

test('the carousel hides its controls when there is nothing to scroll', async () => {
  await go('/partners')

  // jsdom reports no layout, so the track measures as unscrollable — the same
  // state a real browser reaches when every card already fits. Dead arrows and
  // a permanent "01 / 01" should not be rendered.
  expect(screen.queryByRole('button', { name: /previous partners/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /next partners/i })).not.toBeInTheDocument()
  expect(document.querySelector('.p-controls')).not.toBeInTheDocument()
})

test('every partner has a description', async () => {
  PARTNER_LOGOS.forEach(({ name, blurb }) => {
    expect(blurb, `${name} is missing a blurb`).toBeTruthy()
  })
})

test('the nav marks the current page and the browser back button returns home', async () => {
  const user = userEvent.setup()
  await go('/')

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

test('links this project does not own are left as real navigations', async () => {
  await go('/partners')

  const contact = screen.getAllByRole('link', { name: /contact us to partner/i })[0]
  expect(contact).toHaveAttribute('href', ROUTES.contact)

  /* The router must only intercept paths this project serves. Asserted against
     the router's own list rather than a rendered link, because the external
     CTAs come and go — the admin button was removed, and Book Now is hidden
     while the web app is down — and this rule holds regardless of which
     happen to be on screen. */
  expect(isInternalRoute('/support/contact')).toBe(true)
  expect(isInternalRoute('/partners')).toBe(true)
  expect(isInternalRoute('/admin')).toBe(false)
  expect(isInternalRoute('/apps/tripket-ph')).toBe(false)

  // Neither removed link may reappear without a decision.
  expect(screen.queryByRole('link', { name: /admin dashboard/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /^book now$/i })).not.toBeInTheDocument()
})

test('an unknown path falls back to the home page', async () => {
  await go('/does-not-exist')

  expect(
    screen.getByRole('heading', { level: 1, name: /the new tripket ph is here/i }),
  ).toBeInTheDocument()
})
