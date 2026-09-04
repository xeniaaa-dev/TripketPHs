import { AlertTriangle, Check, Info, X } from 'lucide-react'
import PageHero from '../components/PageHero'
import SupportForm from '../components/SupportForm'
import WaveRule from '../components/WaveRule'
import {
  DELETION_HERO,
  DELETION_NOTE,
  DELETION_REMOVED,
  DELETION_RETAINED,
  DELETION_STEPS,
} from '../data/support'
import { ROUTES } from '../data/content'

const FIELDS = [
  { name: 'name', label: 'Full name on the account', autoComplete: 'name' },
  {
    name: 'email',
    label: 'Email address on the account',
    type: 'email',
    autoComplete: 'email',
    hint: 'Send from this address where possible — it helps us verify the request.',
  },
  { name: 'phone', label: 'Mobile number on the account', type: 'tel', optional: true },
  { name: 'reason', label: 'Reason for deleting', rows: 4, optional: true, wide: true },
]

export default function AccountDeletionPage() {
  return (
    <>
      <PageHero
        eyebrow={DELETION_HERO.eyebrow}
        lead={DELETION_HERO.headlineLead}
        accent={DELETION_HERO.headlineAccent}
        copy={DELETION_HERO.copy}
      />

      <section className="deletion-data" aria-labelledby="deletion-data-heading">
        <div className="container">
          <div className="section-head is-centered" data-reveal>
            <p className="eyebrow">What happens</p>
            <h2 id="deletion-data-heading">
              What is <span className="accent">deleted</span>, and what we must keep
            </h2>
          </div>

          <div className="deletion-columns">
            <div className="deletion-card is-removed" data-reveal>
              <h3>
                <span className="deletion-badge" aria-hidden="true">
                  <X />
                </span>
                Deleted from your account
              </h3>
              <ul>
                {DELETION_REMOVED.map((item) => (
                  <li key={item}>
                    <Check aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="deletion-card is-retained" data-reveal="right">
              <h3>
                <span className="deletion-badge" aria-hidden="true">
                  <Info />
                </span>
                Kept or anonymised
              </h3>
              <ul>
                {DELETION_RETAINED.map((item) => (
                  <li key={item}>
                    <Check aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="deletion-note" data-reveal>
            <AlertTriangle aria-hidden="true" />
            <span>
              {DELETION_NOTE} See the <a href={ROUTES.terms}>Terms of Service</a> and{' '}
              <a href={ROUTES.privacy}>Privacy Policy</a> for the full detail.
            </span>
          </p>
        </div>
      </section>

      <WaveRule />

      <section className="deletion-steps" aria-labelledby="deletion-steps-heading">
        <div className="container">
          <div className="section-head is-centered" data-reveal>
            <p className="eyebrow">The process</p>
            <h2 id="deletion-steps-heading">
              Three steps to <span className="accent">close</span> your account
            </h2>
          </div>
          <ol className="deletion-step-grid">
            {DELETION_STEPS.map(({ step, title, body }) => (
              <li key={step} data-reveal>
                <span className="deletion-step-number" aria-hidden="true">
                  {String(step).padStart(2, '0')}
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="contact-form-band" aria-labelledby="deletion-form-heading">
        <div className="container contact-form-grid">
          <div className="contact-form-copy" data-reveal>
            <p className="eyebrow">Send the request</p>
            <h2 id="deletion-form-heading">
              Request <span className="accent">deletion</span>
            </h2>
            <p>
              Fill this in and we will confirm your identity before removing anything. You can also
              email <a href="mailto:support@tripketph.com">support@tripketph.com</a> directly from
              the address on your account.
            </p>
          </div>

          <div className="contact-form-shell" data-reveal="right">
            <SupportForm
              fields={FIELDS}
              subjectPrefix="Account deletion request"
              submitLabel="Request deletion"
            />
          </div>
        </div>
      </section>
    </>
  )
}
