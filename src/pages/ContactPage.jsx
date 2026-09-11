import PageHero from '../components/PageHero'
import SupportForm from '../components/SupportForm'
import { CONTACT_CHANNELS, CONTACT_HERO } from '../data/support'
import { ROUTES } from '../data/content'

/* Mirrors the inquiry API's own field list and order, taken from the
   developer's own request definition for it. `mobile` is the only optional
   one, and the only one with a format to enforce.

   These names are the payload keys, so renaming one here changes what is
   sent. `api/_lib/inquiry-fields.js` holds the same list server-side and
   drops anything not on it, which is what keeps the two in step. */
const FIELDS = [
  { name: 'name', label: 'Name', autoComplete: 'name', placeholder: 'Juan Dela Cruz' },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    autoComplete: 'email',
    placeholder: 'juan@example.com',
  },
  {
    name: 'mobile',
    label: 'Mobile number',
    type: 'tel',
    optional: true,
    autoComplete: 'tel',
    inputMode: 'tel',
    placeholder: '+639171234567',
    // Philippine mobile numbers in E.164: +63, then 9, then nine digits.
    pattern: '^\\+639\\d{9}$',
    patternMessage: 'Use the format +639xxxxxxxxx — a plus sign, 639, then nine more digits.',
    hint: 'Format: +639xxxxxxxxx',
  },
  { name: 'subject', label: 'Subject', wide: true, placeholder: 'What is this about?' },
  { name: 'message', label: 'Message', rows: 5, wide: true, placeholder: 'Type your message…' },
]

export default function ContactPage() {
  return (
    <>
      {/* Same header as the other support pages. The lede is omitted because
          the section below already opens with it. */}
      <PageHero eyebrow={CONTACT_HERO.eyebrow} lead="Contact " accent="us" />

      <section className="contact-compact" aria-labelledby="contact-details-heading">
        <div className="container contact-compact-grid">
          <div className="contact-intro">
            <h2 id="contact-details-heading" data-reveal>
              Need help with a booking?
              <span>Get in touch with us</span>
            </h2>
            <p className="contact-intro-lede" data-reveal>
              {CONTACT_HERO.copy}
            </p>

            <ul className="contact-rows" data-reveal>
              {CONTACT_CHANNELS.map(({ icon: Icon, label, value, note, href }) => (
                <li key={label}>
                  <span className="contact-row-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <span className="contact-row-text">
                    <span className="contact-row-label">{label}</span>
                    {href ? (
                      <a href={href}>{value}</a>
                    ) : (
                      <span className="contact-row-value">{value}</span>
                    )}
                    {note ? <span className="contact-row-note">{note}</span> : null}
                  </span>
                </li>
              ))}
            </ul>

            <p className="contact-intro-links" data-reveal>
              Looking for a quick answer first? Read the{' '}
              <a href={ROUTES.faq}>frequently asked questions</a>.
            </p>
          </div>

          <div className="contact-form-card" data-reveal="right">
            <h2 className="visually-hidden">Send us a message</h2>
            <SupportForm
              fields={FIELDS}
              subjectPrefix="Tripket PH enquiry"
              /* Posts to our own route, which forwards to the inquiry API.
                 The action name is what the reCAPTCHA console groups the
                 scores under, and what a verifier checks the token against.
                 Falls back to the email composer if reCAPTCHA cannot load. */
              submit={{ endpoint: '/api/inquiry', action: 'contact_submit' }}
            />
          </div>
        </div>
      </section>
    </>
  )
}
