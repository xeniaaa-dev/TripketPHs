import PageHero from '../components/PageHero'
import SupportForm from '../components/SupportForm'
import WaveRule from '../components/WaveRule'
import { CONTACT_CHANNELS, CONTACT_HERO, CONTACT_SUBJECTS } from '../data/support'
import { ROUTES } from '../data/content'

const FIELDS = [
  { name: 'name', label: 'Name', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'subject', label: 'Subject', options: CONTACT_SUBJECTS, wide: true },
  { name: 'message', label: 'Message', rows: 6, wide: true },
]

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow={CONTACT_HERO.eyebrow}
        lead={CONTACT_HERO.headlineLead}
        accent={CONTACT_HERO.headlineAccent}
        copy={CONTACT_HERO.copy}
      />

      <section className="contact-channels" aria-labelledby="channels-heading">
        <div className="container">
          <h2 className="visually-hidden" id="channels-heading">
            How to reach us
          </h2>
          <ul className="channel-grid">
            {CONTACT_CHANNELS.map(({ icon: Icon, label, value, note, href }) => (
              <li className="channel-card" key={label} data-reveal>
                <span className="channel-icon" aria-hidden="true">
                  <Icon />
                </span>
                <h3>{label}</h3>
                {href ? (
                  <a href={href}>{value}</a>
                ) : (
                  <p className="channel-value">{value}</p>
                )}
                <p className="channel-note">{note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <WaveRule />

      <section className="contact-form-band" aria-labelledby="form-heading">
        <div className="container contact-form-grid">
          <div className="contact-form-copy" data-reveal>
            <p className="eyebrow">Send us a message</p>
            <h2 id="form-heading">
              Tell us what you <span className="accent">need</span>
            </h2>
            <p>
              Give us the details of your booking or enquiry and our support team will pick it up.
              For urgent travel-day problems, calling is faster than email.
            </p>
            <p className="contact-form-links">
              Looking for a quick answer first? Read the{' '}
              <a href={ROUTES.faq}>frequently asked questions</a>.
            </p>
          </div>

          <div className="contact-form-shell" data-reveal="right">
            <SupportForm fields={FIELDS} subjectPrefix="Tripket PH enquiry" />
          </div>
        </div>
      </section>
    </>
  )
}
