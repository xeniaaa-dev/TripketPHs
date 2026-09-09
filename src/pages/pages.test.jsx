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

test('a partner card reveals the rest of its description on demand', async () => {
  const user = userEvent.setup()
  await go('/partners')

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

  /* The web app is a different origin, so the router has to let this through
     to a real navigation rather than swallowing the click. This took over from
     the Admin Dashboard check when that button left the navbar. */
  const app = screen.getAllByRole('link', { name: /book now/i })[0]
  expect(app).toHaveAttribute('href', ROUTES.book)
  expect(ROUTES.book.startsWith('https://')).toBe(true)

  // And the navbar no longer offers the admin dashboard at all.
  expect(screen.queryByRole('link', { name: /admin dashboard/i })).not.toBeInTheDocument()
})

test('an unknown path falls back to the home page', async () => {
  await go('/does-not-exist')

  expect(
    screen.getByRole('heading', { level: 1, name: /the new tripket ph is here/i }),
  ).toBeInTheDocument()
})
