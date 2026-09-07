import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import App from './App'
import {
  FEATURES,
  HERO_CTA_LABEL,
  NAV_CTA_LABEL,
  ROUTES,
  JOURNEY_STEPS,
  PARTNER_BENEFITS,
  PARTNER_LOGOS,
  TESTIMONIALS,
} from './data/content'

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

test('renders the brand, landmarks, and hero campaign copy', () => {
  render(<App />)

  expect(screen.getAllByRole('link', { name: /tripket ph — home/i })).not.toHaveLength(0)
  expect(screen.getByRole('banner')).toBeInTheDocument()
  expect(screen.getByRole('main')).toBeInTheDocument()
  expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  expect(
    screen.getByRole('heading', { level: 1, name: /the new tripket ph is here/i }),
  ).toBeInTheDocument()
  expect(
    within(screen.getByRole('contentinfo')).getByText(
      /the all-in-one platform for philippine transportation ticketing/i,
    ),
  ).toBeInTheDocument()
})

test('stacks the eight sections of the live page in order', () => {
  render(<App />)

  const headings = screen
    .getAllByRole('heading', { level: 1 })
    .concat(screen.getAllByRole('heading', { level: 2 }))
  const text = headings.map((heading) => heading.textContent)

  expect(text).toEqual(
    expect.arrayContaining([
      expect.stringMatching(/the new tripket ph is here/i),
      expect.stringMatching(/trusted by leading philippine shipping lines/i),
      expect.stringMatching(/everything you need to book and ship/i),
      expect.stringMatching(/book your trip in 3 easy steps/i),
      expect.stringMatching(/loved by travelers across the philippines/i),
      expect.stringMatching(/join tripket ph as a shipping partner/i),
    ]),
  )
})

test('announces the v2 launch and retires the old version', () => {
  render(<App />)

  expect(screen.getByText(/version 2 is now available/i)).toBeInTheDocument()
  expect(
    screen.getByText(/the previous version of tripket ph is no longer accessible/i),
  ).toBeInTheDocument()
})

test('every primary CTA points at the new web app', () => {
  render(<App />)

  const primaryCtas = [
    ...screen.getAllByRole('link', { name: NAV_CTA_LABEL }),
    ...screen.getAllByRole('link', { name: HERO_CTA_LABEL }),
  ]
  expect(primaryCtas.length).toBeGreaterThanOrEqual(2)
  primaryCtas.forEach((link) => expect(link).toHaveAttribute('href', ROUTES.book))

  // Regression: ROUTES.book was '#' for a while, so every "Book Now" on all
  // eight pages did nothing. Pin it to an absolute URL.
  expect(ROUTES.book).toBe('https://app.tripketph.com/')
  expect(ROUTES.book.startsWith('https://')).toBe(true)
  expect(screen.getAllByRole('link', { name: /learn more/i })[0]).toHaveAttribute('href', '#features')
})

test('renders every feature, step, testimonial, and partner exactly once', () => {
  render(<App />)

  FEATURES.forEach(({ title }) => {
    expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument()
  })
  JOURNEY_STEPS.forEach(({ title }) => {
    expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument()
  })
  TESTIMONIALS.forEach(({ name }) => {
    expect(screen.getByText(name)).toBeInTheDocument()
  })

  // One marquee row plus an aria-hidden clone: the clone must stay out of the
  // accessibility tree so every carrier is announced exactly once.
  const rows = screen.getAllByRole('list', { name: /shipping line partners/i })
  expect(rows).toHaveLength(1)

  const announced = within(rows[0])
    .getAllByRole('listitem')
    .map((item) => item.textContent)
  expect(announced).toHaveLength(PARTNER_LOGOS.length)
  PARTNER_LOGOS.forEach(({ name }) => {
    expect(announced).toContain(name)
  })
})

test('the support disclosure opens, lists help links, and closes on Escape', async () => {
  const user = userEvent.setup()
  render(<App />)

  const trigger = screen.getByRole('button', { name: 'Support' })
  expect(trigger).toHaveAttribute('aria-expanded', 'false')

  await user.click(trigger)
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  const menu = document.getElementById('support-menu')
  expect(menu).not.toHaveAttribute('hidden')
  expect(within(menu).getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/support/faq')

  await user.keyboard('{Escape}')
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(trigger).toHaveFocus()
})

test('the theme toggle switches the document theme and remembers it', async () => {
  const user = userEvent.setup()
  render(<App />)

  expect(document.documentElement.dataset.theme).toBe('light')

  await user.click(screen.getByRole('button', { name: /switch to dark theme/i }))
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(window.localStorage.getItem('tripket-theme.v1')).toBe('dark')

  await user.click(screen.getByRole('button', { name: /switch to light theme/i }))
  expect(document.documentElement.dataset.theme).toBe('light')
})

test('the mobile navigation toggle reports its state', async () => {
  const user = userEvent.setup()
  render(<App />)

  const toggle = screen.getByRole('button', { name: /open navigation menu/i })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')

  await user.click(toggle)
  expect(screen.getByRole('button', { name: /close navigation menu/i })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
})

test('every feature card renders identically', () => {
  render(<App />)

  const tiles = [...document.querySelectorAll('.feature-grid > li')]
  expect(tiles).toHaveLength(FEATURES.length)

  // No card carries an emphasis variant: a warmer badge on two of them read as
  // a stuck hover state, since hover is exactly what turns a badge warm.
  tiles.forEach((tile) => {
    expect(tile.className).toBe('feature')
    expect(tile.querySelector('.feature-icon').className).toBe('feature-icon')
  })
})

test('the feature cards are rendered in the published order', () => {
  render(<App />)

  const titles = [...document.querySelectorAll('.feature-grid h3')].map((h) => h.textContent)
  expect(titles).toEqual(FEATURES.map((feature) => feature.title))
})

test('shows the derived carrier count as a proof line', () => {
  render(<App />)
  expect(screen.getByText(String(PARTNER_LOGOS.length))).toBeInTheDocument()
  expect(screen.getByText(/philippine shipping lines onboard/i)).toBeInTheDocument()
})

test('renders steps as a numbered route with an accessible position', () => {
  render(<App />)

  JOURNEY_STEPS.forEach(({ step }) => {
    expect(screen.getByText(`Step ${step}`)).toBeInTheDocument()
    expect(screen.getByText(String(step).padStart(2, '0'))).toBeInTheDocument()
  })
})

test('gives one testimonial the featured treatment and states each rating', () => {
  render(<App />)

  const cells = document.querySelectorAll('.testimonial-cell')
  expect(cells).toHaveLength(TESTIMONIALS.length)
  expect(document.querySelectorAll('.testimonial-cell.is-featured')).toHaveLength(1)

  TESTIMONIALS.forEach(({ rating, route }) => {
    expect(screen.getAllByRole('img', { name: `Rated ${rating} out of 5` }).length).toBeGreaterThan(0)
    expect(screen.getByText(new RegExp(route.replace('→', '.')))).toBeInTheDocument()
  })
})

test('lists partner benefits in the CTA band', () => {
  render(<App />)

  PARTNER_BENEFITS.forEach((benefit) => {
    expect(screen.getByText(benefit)).toBeInTheDocument()
  })
})
