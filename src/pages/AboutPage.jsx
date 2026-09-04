import { ArrowRight, Mail, MapPin, Quote } from 'lucide-react'
import PageHero from '../components/PageHero'
import WaveRule from '../components/WaveRule'
import {
  ABOUT_CONTACT,
  ABOUT_CTA,
  ABOUT_HERO,
  ABOUT_PILLARS,
  ABOUT_STORY,
  FOUNDERS,
  PARTNER_LOGOS,
  ROUTES,
} from '../data/content'

const CONTACT_ICONS = [MapPin, Mail]

function Pillar({ icon: Icon, title, body }) {
  return (
    <li className="pillar" data-reveal>
      <span className="pillar-icon" aria-hidden="true">
        <Icon />
      </span>
      <h3>{title}</h3>
      <p>{body}</p>
    </li>
  )
}

function Founder({ initials, name, role, quote }) {
  return (
    <li className="founder" data-reveal>
      <figure>
        <span className="avatar" aria-hidden="true">
          {initials}
        </span>
        <figcaption className="founder-person">
          <strong>{name}</strong>
          <span>{role}</span>
        </figcaption>
        <blockquote>
          <Quote className="founder-quote-mark" aria-hidden="true" />
          {quote}
        </blockquote>
      </figure>
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
          </div>
          <div className="story-body" data-reveal="right">
            <p>{ABOUT_STORY.body}</p>
            <ul className="story-stats">
              <li>
                <strong>{PARTNER_LOGOS.length}</strong>
                <span>Shipping lines onboard</span>
              </li>
              <li>
                <strong>3</strong>
                <span>Island groups served</span>
              </li>
              <li>
                <strong>2</strong>
                <span>Booking types: tickets and cargo</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="founders" aria-labelledby="founders-heading">
        <div className="container">
          <div className="section-head is-centered" data-reveal>
            <p className="eyebrow">The team</p>
            <h2 id="founders-heading">
              Meet the <span className="accent">founders</span>
            </h2>
          </div>
          <ul className="founder-grid">
            {FOUNDERS.map((founder) => (
              <Founder key={founder.name} {...founder} />
            ))}
          </ul>
        </div>
      </section>

      <section className="contact-band" aria-labelledby="contact-heading">
        <div className="container">
          <div className="section-head is-centered" data-reveal>
            <p className="eyebrow">Find us</p>
            <h2 id="contact-heading">
              Based in <span className="accent">Dumaguete</span>
            </h2>
          </div>
          <ul className="contact-grid">
            {ABOUT_CONTACT.map(({ label, value, href }, index) => {
              const Icon = CONTACT_ICONS[index] ?? MapPin
              return (
                <li className="contact-card" key={label} data-reveal>
                  <span className="contact-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <h3>{label}</h3>
                  {href ? <a href={href}>{value}</a> : <p>{value}</p>}
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className="page-cta" aria-labelledby="about-cta-heading">
        <div className="container page-cta-inner" data-reveal="scale">
          <h2 id="about-cta-heading">{ABOUT_CTA.title}</h2>
          <p>{ABOUT_CTA.body}</p>
          <div className="page-cta-actions">
            <a className="button button-primary button-lg" href={ROUTES.book}>
              Book Now
              <ArrowRight aria-hidden="true" />
            </a>
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
