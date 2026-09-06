import PageHero from '../components/PageHero'
import SupportForm from '../components/SupportForm'
import { CONTACT_CHANNELS, CONTACT_HERO, CONTACT_SUBJECTS } from '../data/support'
import { ROUTES } from '../data/content'

const FIELDS = [
  { name: 'name', label: 'Name', autoComplete: 'name', placeholder: 'Juan Dela Cruz' },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    autoComplete: 'email',
    placeholder: 'juan@example.com',
  },
  { name: 'subject', label: 'Subject', options: CONTACT_SUBJECTS, wide: true },
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
                    <span className="contact-row-note">{note}</span>
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
            <SupportForm fields={FIELDS} subjectPrefix="Tripket PH enquiry" />
          </div>
        </div>
      </section>
    </>
  )
}
