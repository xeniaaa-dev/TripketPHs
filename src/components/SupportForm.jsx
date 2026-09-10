import { useId, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import useRecaptcha from '../hooks/useRecaptcha'

const SUPPORT_EMAIL = 'support@tripketph.com'

/** Longer than the proxy's own 8s upstream timeout, plus room for the hop. */
const CLIENT_TIMEOUT_MS = 12_000

/**
 * The support forms.
 *
 * Two ways of sending, chosen by the `submit` prop:
 *
 *   - no `submit` — the form composes a pre-filled email and hands it to the
 *     visitor's mail client. Nothing is sent silently and nothing pretends to
 *     have been received. This is still how the account-deletion page works,
 *     because its fields (`phone`, `reason`) are not the ones the inquiry API
 *     accepts.
 *
 *   - `submit={{ endpoint, action }}` — the form posts to our own proxy,
 *     which forwards it to the inquiry API. The contact page uses this.
 *
 * The email path is also the fallback for the posting path. If reCAPTCHA
 * cannot load — an extension blocked it, the site key was never deployed,
 * Google is having a bad day — the visitor is offered the mail composer
 * rather than a dead end. That matters because the server fails closed on a
 * captcha it cannot confirm, so without a fallback an outage at Google would
 * mean nobody can reach support at all.
 */
export default function SupportForm({ fields, subjectPrefix, submitLabel = 'Send message', submit }) {
  const uid = useId()
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')
  /** idle | sending | sent | failed */
  const [phase, setPhase] = useState('idle')
  const [offerEmail, setOfferEmail] = useState(false)

  const recaptcha = useRecaptcha(submit?.action)
  // A build without the site key falls back to email rather than presenting a
  // send button that cannot work.
  const posting = Boolean(submit) && recaptcha.configured

  function set(name, value) {
    setValues((previous) => ({ ...previous, [name]: value }))
    // Clear the complaint as soon as the visitor starts fixing the field,
    // rather than leaving a stale error under a value they have changed.
    setErrors((previous) => (previous[name] ? { ...previous, [name]: undefined } : previous))
  }

  /**
   * The form is `noValidate`, so a `pattern` on the input would never be
   * enforced by the browser. Formats are checked here instead. An empty
   * optional field is valid - the format only has to hold once something has
   * actually been typed.
   *
   * This is for the visitor's benefit only. The server validates the same
   * things again, because anything checked here can be skipped entirely.
   *
   * The empty-required check applies to the posting path only. On the email
   * path there is nothing to reject — the composer hands whatever was typed
   * to a mail client the visitor still has to press send in — and adding a
   * gate there would change how the account-deletion page has always behaved.
   */
  function validate() {
    const found = {}
    for (const field of fields) {
      const value = (values[field.name] ?? '').trim()

      if (posting && !field.optional && !value) {
        found[field.name] = `${field.label} is required.`
        continue
      }
      if (!field.pattern || !value) continue
      if (!new RegExp(field.pattern).test(value)) {
        found[field.name] = field.patternMessage ?? `Check the format of ${field.label}.`
      }
    }
    return found
  }

  function focusFirstError(found) {
    const first = fields.find((field) => found[field.name])
    if (first) document.getElementById(`${uid}-${first.name}`)?.focus()
  }

  /** Opens the visitor's mail client with everything they typed carried over. */
  function composeEmail() {
    // The subject line is the prefix, plus whatever the visitor typed. An
    // empty field leaves the prefix alone rather than a trailing colon.
    const typedSubject = (values.subject ?? '').trim()
    const subject = typedSubject ? `${subjectPrefix}: ${typedSubject}` : subjectPrefix

    // An optional field left blank is omitted rather than sent as a bare
    // label with nothing after it.
    const body = fields
      .filter((field) => field.name !== 'subject')
      .filter((field) => !field.optional || (values[field.name] ?? '').trim())
      .map((field) => `${field.label}: ${(values[field.name] ?? '').trim()}`)
      .join('\n\n')

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`

    setPhase('idle')
    setOfferEmail(false)
    setStatus(
      `Your email app should open with this message ready to send to ${SUPPORT_EMAIL}. If it did not, email us there directly.`,
    )
  }

  /**
   * Posts to our own route. Only the declared fields are sent, plus the
   * honeypot and a token minted for this attempt.
   */
  async function send() {
    setPhase('sending')
    setStatus('')
    setOfferEmail(false)

    let token
    try {
      token = await recaptcha.execute()
    } catch {
      // Not the visitor's fault, and there is a way through: the mail client.
      setPhase('failed')
      setOfferEmail(true)
      setStatus('We could not run the spam check on this page. You can email us instead.')
      return
    }

    const payload = { 'g-recaptcha-response': token }
    for (const field of fields) {
      payload[field.name] = (values[field.name] ?? '').trim()
    }
    // Left empty by anyone who can see the page. Filled in by scripts that
    // populate every input they find.
    payload.company = values.company ?? ''

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timer = controller ? setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS) : null

    try {
      const response = await fetch(submit.endpoint, {
        method: 'POST',
        // Also what makes the route refuse a cross-origin form post, so this
        // header is load-bearing rather than decoration.
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller?.signal,
      })

      const body = await response.json().catch(() => null)

      if (response.ok) {
        setPhase('sent')
        setValues({})
        setErrors({})
        setStatus(
          'Thanks — your message is with our support team. We reply within 1–2 business days.',
        )
        return
      }

      // The route answers with its own copy on every path, so whatever it
      // says can be shown as-is. It never passes the upstream's wording on.
      setPhase('failed')
      setStatus(body?.error ?? 'We could not send your message. Please try again.')
      if (body?.fields) {
        setErrors(body.fields)
        focusFirstError(body.fields)
      }

      /**
       * Keyed on the status class, not on `retry`.
       *
       * A 4xx is about this submission: a field to correct, or a captcha to
       * mint again by pressing send. Offering email there would push people
       * out of a form that is one keystroke from working.
       *
       * A 5xx is our end failing — the upstream unreachable, misconfigured, or
       * missing the route entirely. Pressing send again will fail the same way,
       * so the visitor needs the other route out.
       *
       * This used to read `!body?.retry && !body?.fields`, which suppressed the
       * email offer on precisely the failures that most needed it: our 502s
       * carry `retry`, so a broken upstream left people looking at "we cannot
       * send your message right now" with nowhere else to go.
       */
      setOfferEmail(response.status >= 500)
    } catch (error) {
      if (error?.name === 'AbortError') {
        setPhase('failed')
        setOfferEmail(true)
        setStatus('That took too long. Please try again, or email us instead.')
        return
      }
      setPhase('failed')
      setOfferEmail(true)
      setStatus('We could not reach our support service. Please try again, or email us instead.')
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  function onSubmit(event) {
    event.preventDefault()
    if (phase === 'sending') return

    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      focusFirstError(found)
      setStatus('')
      setPhase('idle')
      return
    }

    if (posting) {
      send()
      return
    }
    composeEmail()
  }

  const sending = phase === 'sending'

  return (
    <form className="support-form" onSubmit={onSubmit} noValidate aria-busy={sending || undefined}>
      {fields.map((field) => {
        const id = `${uid}-${field.name}`
        const error = errors[field.name]
        // The error message already spells the format out, so it replaces the
        // hint rather than stacking on top of it and saying the same thing
        // twice. The hint comes back once the value is valid.
        const hintId = field.hint && !error ? `${id}-hint` : null
        const errorId = error ? `${id}-error` : null
        const describedBy = errorId ?? hintId ?? undefined
        return (
          <p className={field.wide ? 'form-row is-wide' : 'form-row'} key={field.name}>
            <label htmlFor={id}>
              {field.label}
              {field.optional ? <span className="form-optional"> (optional)</span> : null}
            </label>

            {field.options ? (
              <select
                id={id}
                name={field.name}
                value={values[field.name] ?? ''}
                onChange={(event) => set(field.name, event.target.value)}
              >
                <option value="">Choose one…</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : field.rows ? (
              <textarea
                id={id}
                name={field.name}
                rows={field.rows}
                required={!field.optional}
                placeholder={field.placeholder}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                value={values[field.name] ?? ''}
                onChange={(event) => set(field.name, event.target.value)}
              />
            ) : (
              <input
                id={id}
                name={field.name}
                type={field.type ?? 'text'}
                required={!field.optional}
                autoComplete={field.autoComplete}
                inputMode={field.inputMode}
                placeholder={field.placeholder}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                value={values[field.name] ?? ''}
                onChange={(event) => set(field.name, event.target.value)}
              />
            )}

            {/* The error comes first so it is read before the format hint. */}
            {error ? (
              <span className="form-error" id={errorId}>
                {error}
              </span>
            ) : null}
            {hintId ? (
              <span className="form-hint" id={hintId}>
                {field.hint}
              </span>
            ) : null}
          </p>
        )
      })}

      {/* A field nobody can see, so nobody fills it in. Off-screen rather than
          display:none because more scripts notice the latter and skip it;
          tabIndex -1 and aria-hidden keep it away from keyboards and screen
          readers, which is what makes it invisible to people. */}
      {posting ? (
        <div className="form-trap" aria-hidden="true">
          <label htmlFor={`${uid}-company`}>Company</label>
          <input
            id={`${uid}-company`}
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.company ?? ''}
            onChange={(event) => set('company', event.target.value)}
          />
        </div>
      ) : null}

      <div className="form-actions">
        <button className="form-submit" type="submit" disabled={sending}>
          <span className="form-submit-icon" aria-hidden="true">
            <ArrowRight />
          </span>
          {sending ? 'Sending…' : submitLabel}
        </button>
        <p className="form-note">
          {posting
            ? 'Sent straight to our support team. We reply within 1–2 business days.'
            : 'This opens your own email app with the details filled in — it is not sent from the page.'}
        </p>
      </div>

      {/* Required by Google whenever the reCAPTCHA badge is hidden, and the
          badge is hidden because it floats over the layout. */}
      {posting ? (
        <p className="form-legal">
          This site is protected by reCAPTCHA and the Google{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer noopener">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer noopener">
            Terms of Service
          </a>{' '}
          apply.
        </p>
      ) : null}

      {phase === 'failed' ? (
        <p className="form-status is-error" role="alert">
          {status}
          {offerEmail ? (
            <>
              {' '}
              <button type="button" className="form-link-button" onClick={composeEmail}>
                Email us instead
              </button>
            </>
          ) : null}
        </p>
      ) : (
        <p className="form-status" role="status">
          {status}
        </p>
      )}
    </form>
  )
}
