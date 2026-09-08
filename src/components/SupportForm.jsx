import { useId, useState } from 'react'
import { ArrowRight } from 'lucide-react'

const SUPPORT_EMAIL = 'support@tripketph.com'

/**
 * There is no server behind this site, so rather than fake a submission the
 * form composes a real, pre-filled email to support@tripketph.com and hands it
 * to the visitor's mail client. Nothing is sent silently and nothing pretends
 * to have been received.
 */
export default function SupportForm({ fields, subjectPrefix, submitLabel = 'Send message' }) {
  const uid = useId()
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')

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
   */
  function validate() {
    const found = {}
    for (const field of fields) {
      const value = (values[field.name] ?? '').trim()
      if (!field.pattern || !value) continue
      if (!new RegExp(field.pattern).test(value)) {
        found[field.name] = field.patternMessage ?? `Check the format of ${field.label}.`
      }
    }
    return found
  }

  function onSubmit(event) {
    event.preventDefault()

    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      const first = fields.find((field) => found[field.name])
      document.getElementById(`${uid}-${first.name}`)?.focus()
      setStatus('')
      return
    }

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

    setStatus(
      `Your email app should open with this message ready to send to ${SUPPORT_EMAIL}. If it did not, email us there directly.`,
    )
  }

  return (
    <form className="support-form" onSubmit={onSubmit} noValidate>
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

      <div className="form-actions">
        <button className="form-submit" type="submit">
          <span className="form-submit-icon" aria-hidden="true">
            <ArrowRight />
          </span>
          {submitLabel}
        </button>
        <p className="form-note">
          This opens your own email app with the details filled in — it is not sent from the page.
        </p>
      </div>

      <p className="form-status" role="status">
        {status}
      </p>
    </form>
  )
}
