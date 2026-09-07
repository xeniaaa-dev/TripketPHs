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
  const [status, setStatus] = useState('')

  function set(name, value) {
    setValues((previous) => ({ ...previous, [name]: value }))
  }

  function onSubmit(event) {
    event.preventDefault()

    // The subject line is the prefix, plus whatever the visitor typed. An
    // empty field leaves the prefix alone rather than a trailing colon.
    const typedSubject = (values.subject ?? '').trim()
    const subject = typedSubject ? `${subjectPrefix}: ${typedSubject}` : subjectPrefix

    const body = fields
      .filter((field) => field.name !== 'subject')
      .map((field) => `${field.label}: ${values[field.name] ?? ''}`)
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
                placeholder={field.placeholder}
                value={values[field.name] ?? ''}
                onChange={(event) => set(field.name, event.target.value)}
              />
            )}

            {field.hint ? <span className="form-hint">{field.hint}</span> : null}
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
