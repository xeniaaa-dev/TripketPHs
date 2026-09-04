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

const go = (path) => {
  window.history.pushState({}, '', path)
  render(<App />)
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
    // A real page, not the home-page fallback.
    expect(
      screen.queryByRole('heading', { level: 1, name: /the new tripket ph is here/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()

    view.unmount()
  }
})

test('the contact page lists every real contact channel', () => {
  go('/support/contact')

  expect(screen.getByRole('heading', { level: 1, name: /contact us/i })).toBeInTheDocument()
  CONTACT_CHANNELS.forEach(({ value }) => {
    expect(screen.getByText(value)).toBeInTheDocument()
  })
  expect(screen.getByRole('link', { name: '+63 976 341 2190' })).toHaveAttribute(
    'href',
    'tel:+639763412190',
  )
})

test('the contact form composes a real email rather than faking a send', async () => {
  const user = userEvent.setup()
  go('/support/contact')

  await user.type(screen.getByLabelText('Name'), 'Maria Santos')
  await user.type(screen.getByLabelText('Email'), 'maria@example.com')
  await user.type(screen.getByLabelText('Message'), 'Where is my ticket?')
  await user.click(screen.getByRole('button', { name: /send message/i }))

  // No claim that anything was received — it points at the real inbox.
  const status = screen.getByRole('status')
  expect(status).toHaveTextContent(/email app should open/i)
  expect(status).toHaveTextContent(/support@tripketph\.com/i)
})

test('the FAQ renders both audiences and switches between them', async () => {
  const user = userEvent.setup()
  go('/support/faq')

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
  go('/support/faq')

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
  go('/support/faq')

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

test('the privacy policy renders every section and a matching contents list', () => {
  go('/support/privacy')

  const toc = document.querySelector('.legal-toc')
  PRIVACY_DOC.sections.forEach(({ id, title }) => {
    expect(within(toc).getByRole('link', { name: title })).toHaveAttribute('href', `#${id}`)
    expect(document.getElementById(id)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
  })
})

test('the terms of service renders every clause', () => {
  go('/support/terms')

  expect(TERMS_DOC.sections.length).toBeGreaterThanOrEqual(20)
  TERMS_DOC.sections.forEach(({ id, title }) => {
    expect(document.getElementById(id)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
  })
})

test('the account deletion page states what is removed and what is kept', () => {
  go('/support/account-deletion-request')

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
  go('/support/account-deletion-request')

  await user.type(screen.getByLabelText(/full name on the account/i), 'Ana Reyes')
  await user.type(screen.getByLabelText(/email address on the account/i), 'ana@example.com')
  await user.click(screen.getByRole('button', { name: /request deletion/i }))

  expect(screen.getByRole('status')).toHaveTextContent(/support@tripketph\.com/i)
})

test('the Support trigger is marked current while on a support page', async () => {
  const user = userEvent.setup()
  go('/support/faq')

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
