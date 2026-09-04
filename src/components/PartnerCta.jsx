import { ArrowRight, Check } from 'lucide-react'
import { PARTNER_BENEFITS, ROUTES, SECTION_LABELS } from '../data/content'

export default function PartnerCta() {
  return (
    <section className="partner-cta" aria-labelledby="partner-cta-heading">
      {/* Same optimized hero asset, so it is already in cache — the only
          full-bleed dark moment on the page, marking the B2B ask as a
          different surface from the consumer sections above it. */}
      <img
        className="partner-cta-photo"
        src="/assets/optimized/tripket-ferry-hero-background.webp"
        alt=""
        width="1600"
        height="900"
        loading="lazy"
        decoding="async"
      />
      <div className="partner-cta-scrim" aria-hidden="true" />

      <div className="container partner-cta-inner" data-reveal="scale">
        <p className="eyebrow">{SECTION_LABELS.partner}</p>
        <h2 id="partner-cta-heading">
          Join Tripket PH as a <span className="accent">shipping partner</span>
        </h2>
        <p className="section-lede">
          Connect your shipping line to thousands of passengers nationwide and grow your bookings
          online.
        </p>

        <ul className="partner-benefits">
          {PARTNER_BENEFITS.map((benefit) => (
            <li key={benefit}>
              <Check aria-hidden="true" />
              {benefit}
            </li>
          ))}
        </ul>

        <div className="cta-actions">
          <a className="button button-primary button-lg" href={ROUTES.partners}>
            Partner With Us
            <ArrowRight aria-hidden="true" />
          </a>
          <a className="button button-ghost button-lg is-on-dark" href={ROUTES.about}>
            Learn More
          </a>
        </div>
      </div>
    </section>
  )
}
