import { ArrowRight, Ship } from 'lucide-react'
import PageHero from '../components/PageHero'
import WaveRule from '../components/WaveRule'
import { PARTNERS_CTA, PARTNERS_HERO, PARTNER_LOGOS, ROUTES } from '../data/content'

function PartnerCard({ name, src, blurb }) {
  return (
    <li className="partner-card" data-reveal>
      <div className="partner-card-logo">
        {/* The box is a fixed height, so no width/height attributes are needed
            to reserve space — and the logos vary in aspect ratio. */}
        <img src={src} alt={name} loading="lazy" decoding="async" />
      </div>
      <h3>{name}</h3>
      <p>{blurb}</p>
    </li>
  )
}

export default function PartnersPage() {
  return (
    <>
      <PageHero
        eyebrow={PARTNERS_HERO.eyebrow}
        lead={PARTNERS_HERO.headlineLead}
        accent={PARTNERS_HERO.headlineAccent}
        copy={PARTNERS_HERO.copy}
      >
        <p className="page-hero-note" data-reveal>
          <Ship aria-hidden="true" />
          {PARTNERS_HERO.note}
        </p>
        <p className="page-hero-count" data-reveal="scale">
          <strong>{PARTNER_LOGOS.length}</strong>
          <span>Philippine shipping lines onboard</span>
        </p>
      </PageHero>

      <section className="partner-directory" aria-labelledby="directory-heading">
        <div className="container">
          <h2 className="visually-hidden" id="directory-heading">
            Our shipping partners
          </h2>
          <ul className="partner-card-grid">
            {PARTNER_LOGOS.map((partner) => (
              <PartnerCard key={partner.name} {...partner} />
            ))}
          </ul>
        </div>
      </section>

      <WaveRule />

      <section className="page-cta" aria-labelledby="partners-cta-heading">
        <div className="container page-cta-inner" data-reveal="scale">
          <h2 id="partners-cta-heading">{PARTNERS_CTA.title}</h2>
          <p>{PARTNERS_CTA.body}</p>
          <div className="page-cta-actions">
            <a className="button button-primary button-lg" href={ROUTES.contact}>
              Contact us to partner
              <ArrowRight aria-hidden="true" />
            </a>
            <a className="button button-quiet button-lg" href={ROUTES.about}>
              Learn about us
              <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
