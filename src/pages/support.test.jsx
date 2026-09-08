import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import App from '../App'
import { SUPPORT_NAV } from '../data/content'
import { FAQ_AUDIENCES } from '../data/faq'
import { PRIVACY_DOC, TERMS_DOC } from '../data/legal'
import { CONTACT_CHANNELS, DELETION_REMOVED, DELETION_RETAINED } from '../data/support'

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
  render(<App />)
  await screen.findByRole('heading', { level: 1 })
}

test('every link in the Support dropdown resolves to its own page', async () => {
  const user = userEvent.setup()

  for (const { label, href } of SUPPORT_NAV) {
    window.history.pushState({}, '', '/')
    const view = render(<App />)

    await user.click(screen.getByRole('button', { name: 'Support' }))
    const menu = document.getElementById('support-menu')
    await user.click(within(menu).getByRole('link', { name: label }))

    expect(window.location.pathname, `${label} should route to ${href}`).toBe(href)
    // Wait for the route's chunk first, then prove it is a real page and not
    // the home-page fallback. Checking the absence before the chunk lands
    // would pass trivially against the empty Suspense placeholder.
    await screen.findByRole('heading', { level: 1 })
    expect(
      screen.queryByRole('heading', { level: 1, name: /the new tripket ph is here/i }),
    ).not.toBeInTheDocument()

    view.unmount()
  }
})

test('the contact page lists every real contact channel', async () => {
  await go('/support/contact')

  expect(screen.getByRole('heading', { level: 1, name: /contact us/i })).toBeInTheDocument()
  CONTACT_CHANNELS.forEach(({ value }) => {
    expect(screen.getByText(value)).toBeInTheDocument()
  })
  expect(screen.getByRole('link', { name: '+63 976 341 2190' })).toHaveAttribute(
    'href',
    'tel:+639763412190',
  )
})

test('the contact form carries exactly the five API fields, in order', async () => {
  await go('/support/contact')

  const controls = [...document.querySelectorAll('.support-form input, .support-form textarea')]
  expect(controls.map((c) => c.name)).toEqual(['name', 'email', 'mobile', 'subject', 'message'])

  // Mobile is the only optional one, and the only one that advertises a format.
  const mobile = screen.getByLabelText(/mobile number/i)
  expect(mobile).not.toBeRequired()
  expect(mobile.type).toBe('tel')
  expect(screen.getByText('Format: +639xxxxxxxxx')).toBeInTheDocument()
  controls
    .filter((c) => c.name !== 'mobile')
    .forEach((c) => expect(c, `${c.name} should be required`).toBeRequired())
})

test('a mobile number in the wrong format blocks the submission and says why', async () => {
  const user = userEvent.setup()
  await go('/support/contact')

  const composed = []
  const original = Object.getOwnPropertyDescriptor(window, 'location')
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { set href(v) { composed.push(v) }, get href() { return 'http://localhost/' } },
  })

  try {
    const mobile = screen.getByLabelText(/mobile number/i)
    await user.type(screen.getByLabelText('Name'), 'Maria Santos')
    await user.type(mobile, '09171234567')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    // Nothing composed, the field is flagged, and the reason is announced.
    expect(composed).toHaveLength(0)
    expect(mobile).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(/use the format \+639xxxxxxxxx/i)).toBeInTheDocument()
    expect(mobile).toHaveFocus()

    // Correcting it clears the error and lets the mailto through with the number.
    await user.clear(mobile)
    await user.type(mobile, '+639171234567')
    expect(mobile).not.toHaveAttribute('aria-invalid')
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(decodeURIComponent(composed.at(-1))).toContain('Mobile number: +639171234567')
  } finally {
    if (original) Object.defineProperty(window, 'location', original)
  }
})

test('an empty optional mobile is left out of the message entirely', async () => {
  const user = userEvent.setup()
  await go('/support/contact')

  const composed = []
  const original = Object.getOwnPropertyDescriptor(window, 'location')
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { set href(v) { composed.push(v) }, get href() { return 'http://localhost/' } },
  })

  try {
    await user.type(screen.getByLabelText('Name'), 'Maria Santos')
    await user.type(screen.getByLabelText('Message'), 'Where is my ticket?')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    const body = decodeURIComponent(composed.at(-1))
    expect(body).toContain('Name: Maria Santos')
    expect(body).not.toContain('Mobile number:')
  } finally {
    if (original) Object.defineProperty(window, 'location', original)
  }
})

test('the subject is a free-text field, and an empty one leaves no dangling colon', async () => {
  const user = userEvent.setup()
  await go('/support/contact')

  const subject = screen.getByLabelText('Subject')
  expect(subject.tagName).toBe('INPUT')
  expect(document.querySelectorAll('.support-form select')).toHaveLength(0)

  // Capture the mailto the form composes instead of navigating to it.
  const composed = []
  const original = Object.getOwnPropertyDescriptor(window, 'location')
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { set href(v) { composed.push(v) }, get href() { return 'http://localhost/' } },
  })

  try {
    await user.type(screen.getByLabelText('Name'), 'Maria Santos')
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(decodeURIComponent(composed.at(-1))).toContain('subject=Tripket PH enquiry&')

    await user.type(subject, 'Refund for booking 1234')
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(decodeURIComponent(composed.at(-1))).toContain(
      'subject=Tripket PH enquiry: Refund for booking 1234&',
    )
  } finally {
    if (original) Object.defineProperty(window, 'location', original)
  }
})

test('the contact form composes a real email rather than faking a send', async () => {
  const user = userEvent.setup()
  await go('/support/contact')

  await user.type(screen.getByLabelText('Name'), 'Maria Santos')
  await user.type(screen.getByLabelText('Email'), 'maria@example.com')
  await user.type(screen.getByLabelText('Message'), 'Where is my ticket?')
  await user.click(screen.getByRole('button', { name: /send message/i }))

  // No claim that anything was received — it points at the real inbox.
  const status = screen.getByRole('status')
  expect(status).toHaveTextContent(/email app should open/i)
  expect(status).toHaveTextContent(/support@tripketph\.com/i)
})

test('no internal review note is carried on the FAQ data or the page', async () => {
  const user = userEvent.setup()
  await go('/support/faq')

  // Outstanding policy questions are tracked as `TODO: Confirm with Tripket`
  // comments in src/data/faq.js, which the build strips. Nothing may reach the
  // data objects, and so nothing can reach the page.
  const items = FAQ_AUDIENCES.flatMap((a) => a.groups.flatMap((g) => g.items))
  items.forEach((item) => {
    expect(Object.keys(item).sort()).toEqual(['a', 'q'])
    expect(item.a).not.toMatch(/Confirm with Tripket|TODO/i)
  })

  for (const tab of FAQ_AUDIENCES) {
    await user.click(screen.getByRole('tab', { name: tab.label }))
    expect(document.body.textContent).not.toMatch(/Confirm with Tripket|TODO/i)
  }
})

test('the partner answers are labelled and scoped away from the passenger app', async () => {
  const user = userEvent.setup()
  await go('/support/faq')

  const partners = FAQ_AUDIENCES.find((a) => a.id === 'shipping')
  expect(partners.label).toBe('For Shipping Line Partners')

  await user.click(screen.getByRole('tab', { name: partners.label }))
  expect(screen.getByText(partners.note)).toBeInTheDocument()
  expect(partners.note).toMatch(/do not describe features of the passenger booking app/i)
})

test('booking and ticket answers match the live web app', async () => {
  await go('/support/faq')

  const answer = (fragment) => {
    const item = FAQ_AUDIENCES.flatMap((a) => a.groups.flatMap((g) => g.items))
      .find((i) => i.q.toLowerCase().includes(fragment))
    expect(item, `no FAQ item matching "${fragment}"`).toBeTruthy()
    return item.a
  }

  // Verified against app.tripketph.com: origin, destination, travel date.
  expect(answer('how to book tickets online')).toMatch(/origin/i)
  expect(answer('how to book tickets online')).toMatch(/destination/i)
  expect(answer('how to book tickets online')).toMatch(/travel date/i)

  // "My Tickets" replaces the old "virtual ticket wallet".
  expect(answer('receive my ticket')).toMatch(/My Tickets/)
  expect(answer('status of my booking')).toMatch(/My Tickets/)
  FAQ_AUDIENCES.flatMap((a) => a.groups.flatMap((g) => g.items)).forEach(({ q, a }) => {
    expect(a, `"${q}" still says virtual ticket wallet`).not.toMatch(/virtual ticket wallet/i)
    expect(a, `"${q}" still asks for a screenshot`).not.toMatch(/screenshot/i)
  })
})

test('the FAQ renders both audiences and switches between them', async () => {
  const user = userEvent.setup()
  await go('/support/faq')

  const [passengers, shipping] = FAQ_AUDIENCES

  expect(screen.getByRole('tab', { name: passengers.label })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(screen.getByRole('button', { name: new RegExp(passengers.groups[0].items[0].q, 'i') }))
    .toBeInTheDocument()

  await user.click(screen.getByRole('tab', { name: shipping.label }))
  expect(screen.getByRole('tab', { name: shipping.label })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(
    screen.getByRole('button', { name: new RegExp(shipping.groups[0].items[0].q, 'i') }),
  ).toBeInTheDocument()
})

test('an FAQ answer is collapsed until its question is activated', async () => {
  const user = userEvent.setup()
  await go('/support/faq')

  const first = FAQ_AUDIENCES[0].groups[0].items[0]
  const trigger = screen.getByRole('button', { name: new RegExp(first.q, 'i') })

  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  const panel = document.getElementById(trigger.getAttribute('aria-controls'))
  expect(panel).toHaveAttribute('hidden')

  await user.click(trigger)
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(panel).not.toHaveAttribute('hidden')
  expect(panel).toHaveTextContent(first.a)
})

test('the FAQ search filters questions and reports the count', async () => {
  const user = userEvent.setup()
  await go('/support/faq')

  const total = FAQ_AUDIENCES[0].groups.reduce((n, g) => n + g.items.length, 0)
  expect(screen.getByRole('status')).toHaveTextContent(`${total} answers`)

  await user.type(screen.getByLabelText(/search the faq/i), 'refund')
  const matches = screen.getAllByRole('button', { name: /\?$/ })
  expect(matches.length).toBeGreaterThan(0)
  expect(matches.length).toBeLessThan(total)
  matches.forEach((button) => expect(button.textContent.toLowerCase()).toBeTruthy())

  await user.clear(screen.getByLabelText(/search the faq/i))
  await user.type(screen.getByLabelText(/search the faq/i), 'zzzznothing')
  expect(screen.getByText(/no answers matched that search/i)).toBeInTheDocument()
})

test('the privacy policy renders every section and a matching contents list', async () => {
  await go('/support/privacy')

  const toc = document.querySelector('.legal-toc')
  PRIVACY_DOC.sections.forEach(({ id, title }) => {
    expect(within(toc).getByRole('link', { name: title })).toHaveAttribute('href', `#${id}`)
    expect(document.getElementById(id)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
  })
})

test('the terms of service renders every clause', async () => {
  await go('/support/terms')

  expect(TERMS_DOC.sections.length).toBeGreaterThanOrEqual(20)
  TERMS_DOC.sections.forEach(({ id, title }) => {
    expect(document.getElementById(id)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
  })
})

test('the account deletion page states what is removed and what is kept', async () => {
  await go('/support/account-deletion-request')

  expect(
    screen.getByRole('heading', { level: 1, name: /request account deletion/i }),
  ).toBeInTheDocument()

  DELETION_REMOVED.forEach((item) => expect(screen.getByText(item)).toBeInTheDocument())
  DELETION_RETAINED.forEach((item) => expect(screen.getByText(item)).toBeInTheDocument())

  // It must not promise a refund it cannot make.
  expect(screen.getByText(/does not refund existing bookings/i)).toBeInTheDocument()
})

test('the deletion request form asks for the account identifiers', async () => {
  const user = userEvent.setup()
  await go('/support/account-deletion-request')

  await user.type(screen.getByLabelText(/full name on the account/i), 'Ana Reyes')
  await user.type(screen.getByLabelText(/email address on the account/i), 'ana@example.com')
  await user.click(screen.getByRole('button', { name: /request deletion/i }))

  expect(screen.getByRole('status')).toHaveTextContent(/support@tripketph\.com/i)
})

test('the Support trigger is marked current while on a support page', async () => {
  const user = userEvent.setup()
  await go('/support/faq')

  const trigger = screen.getByRole('button', { name: 'Support' })
  expect(trigger).toHaveClass('is-current')

  // The menu is hidden until opened, so its links are out of the a11y tree.
  await user.click(trigger)
  const menu = document.getElementById('support-menu')
  expect(within(menu).getByRole('link', { name: 'FAQ' })).toHaveAttribute('aria-current', 'page')
  expect(within(menu).getByRole('link', { name: 'Privacy Policy' })).not.toHaveAttribute(
    'aria-current',
  )
})
