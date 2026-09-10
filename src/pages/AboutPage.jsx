import { ArrowRight, Mail, MapPin } from 'lucide-react'
import Founders from '../components/Founders'
import PageHero from '../components/PageHero'
import WaveRule from '../components/WaveRule'
import {
  ABOUT_CONTACT,
  BOOKING_AVAILABLE,
  ABOUT_CTA,
  ABOUT_HERO,
  ABOUT_PILLARS,
  ABOUT_STORY,
  ROUTES,
} from '../data/content'

const CONTACT_ICONS = [MapPin, Mail]

/* Same water card as the home page's "What you get" tiles — see the shared
   rule in styles.css. Decorative only: the copy is readable at rest, so
   nothing is gated behind a hover that touch users do not have. */
function Pillar({ icon: Icon, title, body }) {
  return (
    <li className="pillar" data-reveal>
      <div className="card-water" aria-hidden="true">
        <svg className="card-wave" viewBox="0 0 240 24" preserveAspectRatio="none" focusable="false">
          <path d="M0 14c30-10 60-10 90 0s60 10 90 0 40-7 60-3V24H0Z" />
        </svg>
      </div>

      <div className="card-head">
        <span className="pillar-icon" aria-hidden="true">
          <Icon />
        </span>
        <h3>{title}</h3>
      </div>

      <p>{body}</p>
    </li>
  )
}

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow={ABOUT_HERO.eyebrow}
        lead={ABOUT_HERO.headlineLead}
        accent={ABOUT_HERO.headlineAccent}
        copy={ABOUT_HERO.copy}
      />

      <section className="pillars" aria-labelledby="pillars-heading">
        <div className="container">
          <h2 className="visually-hidden" id="pillars-heading">
            Our mission, vision and values
          </h2>
          <ul className="pillar-grid">
            {ABOUT_PILLARS.map((pillar) => (
              <Pillar key={pillar.title} {...pillar} />
            ))}
          </ul>
        </div>
      </section>

      <WaveRule />

      <section className="story" aria-labelledby="story-heading">
        <div className="container story-grid">
          <div className="story-copy">
            <p className="eyebrow" data-reveal>
              {ABOUT_STORY.eyebrow}
            </p>
            <h2 id="story-heading" data-reveal>
              {ABOUT_STORY.title}
            </h2>

            {/* Office and email live here rather than in a section of their
                own: two short rows beside the story instead of two large
                cards under it. */}
            <ul className="contact-rows story-contact" data-reveal>
              {ABOUT_CONTACT.map(({ label, value, href }, index) => {
                const Icon = CONTACT_ICONS[index] ?? MapPin
                return (
                  <li key={label}>
                    <span className="contact-row-icon" aria-hidden="true">
                      <Icon />
                    </span>
                    <span className="contact-row-text">
                      <span className="contact-row-label">{label}</span>
                      {href ? <a href={href}>{value}</a> : <span className="contact-row-value">{value}</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="story-body" data-reveal="right">
            <p>{ABOUT_STORY.body}</p>
          </div>
        </div>
      </section>

      <Founders />

      <section className="page-cta" aria-labelledby="about-cta-heading">
        <div className="container page-cta-inner" data-reveal="scale">
          <h2 id="about-cta-heading">{ABOUT_CTA.title}</h2>
          <p>{ABOUT_CTA.body}</p>
          <div className="page-cta-actions">
            {BOOKING_AVAILABLE ? (
              <a className="button button-primary button-lg" href={ROUTES.book}>
                Book Now
                <ArrowRight aria-hidden="true" />
              </a>
            ) : null}
            <a className="button button-quiet button-lg" href={ROUTES.partners}>
              See our partners
              <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
