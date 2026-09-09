import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import ContactPage from './ContactPage'

/**
 * The contact form's posting path.
 *
 * ContactPage is rendered directly rather than through the router. The route
 * is code-split, and waiting on its chunk is the slowest and flakiest part of
 * the existing page tests; none of that is what these cases are about.
 *
 * reCAPTCHA is supplied rather than loaded. `useRecaptcha` short-circuits when
 * `window.grecaptcha` is already present, which is both how a second mount
 * avoids a duplicate script and the seam these tests use — no network, and no
 * dependence on Google being reachable from a test runner.
 */

const SITE_KEY = 'test-site-key'

/** A submission the server would accept. */
const FILLED = {
  Name: 'Maria Santos',
  Email: 'maria@example.com',
  Subject: 'Missing ticket',
  Message: 'Where is my ticket?',
}

function stubRecaptcha(token = 'token-from-google') {
  const execute = vi.fn().mockResolvedValue(token)
  window.grecaptcha = { ready: (callback) => callback(), execute }
  return execute
}

/** The call the form made to our own route, if it made one. */
function postedBody() {
  const call = globalThis.fetch.mock.calls.find(([url]) => String(url) === '/api/inquiry')
  return call ? JSON.parse(call[1].body) : null
}

const accepted = () => ({ ok: true, status: 200, json: async () => ({ ok: true }) })
const refused = (status, body) => ({ ok: false, status, json: async () => body })

async function fillAndSend(user, overrides = {}) {
  const entries = { ...FILLED, ...overrides }
  for (const [label, value] of Object.entries(entries)) {
    if (value) await user.type(screen.getByLabelText(label), value)
  }
  await user.click(screen.getByRole('button', { name: /send message/i }))
}

beforeEach(() => {
  vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', SITE_KEY)
  globalThis.fetch.mockResolvedValue(accepted())
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllEnvs()
  delete window.grecaptcha
  vi.restoreAllMocks()
})

describe('sending an enquiry', () => {
  test('posts the five fields and a fresh token to our own route', async () => {
    const user = userEvent.setup()
    stubRecaptcha()
    render(<ContactPage />)

    await fillAndSend(user)

    await waitFor(() => expect(postedBody()).not.toBeNull())
    expect(postedBody()).toMatchObject({
      name: 'Maria Santos',
      email: 'maria@example.com',
      subject: 'Missing ticket',
      message: 'Where is my ticket?',
      'g-recaptcha-response': 'token-from-google',
    })

    const [, init] = globalThis.fetch.mock.calls.find(([url]) => String(url) === '/api/inquiry')
    expect(init.method).toBe('POST')
    // Load-bearing: the route refuses anything that is not JSON, which is what
    // stops another site posting this form on a visitor's behalf.
    expect(init.headers['Content-Type']).toBe('application/json')
  })

  test('the browser is never given the upstream API address', async () => {
    const user = userEvent.setup()
    stubRecaptcha()
    render(<ContactPage />)

    await fillAndSend(user)

    await waitFor(() => expect(postedBody()).not.toBeNull())
    for (const [url] of globalThis.fetch.mock.calls) {
      expect(String(url).startsWith('/api/')).toBe(true)
    }
  })

  test('confirms the send and clears what was typed', async () => {
    const user = userEvent.setup()
    stubRecaptcha()
    render(<ContactPage />)

    await fillAndSend(user)

    expect(await screen.findByText(/your message is with our support team/i)).toBeInTheDocument()
    // Cleared, so a second press cannot silently send the same thing twice.
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByLabelText('Message')).toHaveValue('')
  })

  test('a fresh token is minted for every attempt', async () => {
    const user = userEvent.setup()
    const execute = stubRecaptcha()
    render(<ContactPage />)

    await fillAndSend(user)
    await screen.findByText(/your message is with our support team/i)
    await fillAndSend(user)

    // Verification consumes a token and it expires after two minutes, so
    // reusing one guarantees the second attempt fails.
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(2))
  })

  test('carries the honeypot, out of sight and out of reach', async () => {
    const user = userEvent.setup()
    stubRecaptcha()
    const { container } = render(<ContactPage />)

    const trap = container.querySelector('input[name="company"]')
    expect(trap).not.toBeNull()
    // Unreachable by keyboard and hidden from assistive tech: the two ways a
    // person could otherwise trip over a field meant only for scripts.
    expect(trap).toHaveAttribute('tabindex', '-1')
    expect(trap.closest('[aria-hidden="true"]')).not.toBeNull()

    await fillAndSend(user)
    await waitFor(() => expect(postedBody()).not.toBeNull())
    expect(postedBody().company).toBe('')
  })

  test('shows the reCAPTCHA attribution Google requires', async () => {
    stubRecaptcha()
    render(<ContactPage />)

    // The floating badge is hidden by CSS, and this text is the alternative
    // Google's terms allow. Removing one without the other breaks the terms.
    expect(screen.getByText(/protected by reCAPTCHA/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute(
      'href',
      'https://policies.google.com/privacy',
    )
    expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute(
      'href',
      'https://policies.google.com/terms',
    )
  })
})

describe('when the send does not work', () => {
  test('a field the server rejects is shown against that field, and nothing is lost', async () => {
    const user = userEvent.setup()
    stubRecaptcha()
    globalThis.fetch.mockResolvedValue(
      refused(400, {
        ok: false,
        error: 'Please check the highlighted fields and try again.',
        fields: { email: 'Enter an email address we can reply to.' },
      }),
    )
    render(<ContactPage />)

    await fillAndSend(user)

    expect(await screen.findByText(/enter an email address we can reply to/i)).toBeInTheDocument()
    // Nobody retypes a long message because one field was wrong.
    expect(screen.getByLabelText('Message')).toHaveValue('Where is my ticket?')
    expect(screen.getByLabelText('Email')).toHaveValue('maria@example.com')
  })

  test('a captcha rejection asks for a retry instead of blaming the form', async () => {
    const user = userEvent.setup()
    stubRecaptcha()
    globalThis.fetch.mockResolvedValue(
      refused(400, {
        ok: false,
        error: 'We could not confirm you are human. Please try sending again.',
        retry: true,
      }),
    )
    render(<ContactPage />)

    await fillAndSend(user)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/try sending again/i)
    // There is nothing wrong with what was typed, so no email escape hatch is
    // pushed at the visitor — pressing send again is the answer.
    expect(screen.queryByRole('button', { name: /email us instead/i })).not.toBeInTheDocument()
  })

  test('a blocked reCAPTCHA offers the email route rather than a dead end', async () => {
    const user = userEvent.setup()
    // What an ad blocker or a strict extension looks like from here.
    window.grecaptcha = { ready: (cb) => cb(), execute: vi.fn().mockRejectedValue(new Error('x')) }
    render(<ContactPage />)

    await fillAndSend(user)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/could not run the spam check/i)
    // The server fails closed on a captcha it cannot confirm, so without this
    // an outage at Google would mean nobody can reach support at all.
    expect(screen.getByRole('button', { name: /email us instead/i })).toBeInTheDocument()
    expect(postedBody()).toBeNull()
  })

  test('an unreachable route is reported without leaking anything', async () => {
    const user = userEvent.setup()
    stubRecaptcha()
    globalThis.fetch.mockRejectedValue(new Error('ECONNREFUSED 127.0.0.1:3000'))
    render(<ContactPage />)

    await fillAndSend(user)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/could not reach our support service/i)
    expect(alert).not.toHaveTextContent(/ECONNREFUSED/)
  })

  test('an empty required field is caught before anything is sent', async () => {
    const user = userEvent.setup()
    stubRecaptcha()
    render(<ContactPage />)

    await fillAndSend(user, { Message: '' })

    expect(await screen.findByText(/message is required/i)).toBeInTheDocument()
    expect(postedBody()).toBeNull()
  })

  test('a mobile number in the wrong format is caught before anything is sent', async () => {
    const user = userEvent.setup()
    stubRecaptcha()
    render(<ContactPage />)

    await user.type(screen.getByLabelText(/mobile number/i), '09171234567')
    await fillAndSend(user)

    expect(await screen.findByText(/\+639xxxxxxxxx/i)).toBeInTheDocument()
    expect(postedBody()).toBeNull()
  })
})

describe('without a site key', () => {
  test('falls back to composing an email instead of offering a broken button', async () => {
    const user = userEvent.setup()
    vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', '')
    const { container } = render(<ContactPage />)

    await fillAndSend(user)

    // Nothing posted, and the visitor still has a way to send the message.
    expect(postedBody()).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent(/email app should open/i)
    expect(screen.getByRole('status')).toHaveTextContent(/support@tripketph\.com/i)

    // No honeypot and no attribution, because neither applies on this path.
    expect(container.querySelector('input[name="company"]')).toBeNull()
    expect(screen.queryByText(/protected by reCAPTCHA/i)).not.toBeInTheDocument()
  })

  test('says so in the console, because it is a deploy mistake', async () => {
    vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', '')
    render(<ContactPage />)

    await waitFor(() =>
      expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/VITE_RECAPTCHA_SITE_KEY/)),
    )
  })
})
