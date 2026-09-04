import { ArrowDown, ArrowRight } from 'lucide-react'
import { HERO, HERO_CTA_LABEL, ROUTES } from '../data/content'

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <img
        className="hero-photo"
        src="/assets/optimized/tripket-ferry-hero-background.webp"
        alt="A passenger ferry crossing calm Philippine water at sunset"
        width="1600"
        height="900"
        fetchPriority="high"
        decoding="async"
      />
      <div className="hero-scrim" aria-hidden="true" />
      <svg className="hero-waves" viewBox="0 0 1440 240" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 120c180-56 360-56 540 0s360 56 540 0 240-42 360-14" />
        <path d="M0 168c180-56 360-56 540 0s360 56 540 0 240-42 360-14" />
        <path d="M0 216c180-56 360-56 540 0s360 56 540 0 240-42 360-14" />
      </svg>

      <div className="hero-inner container">
        <div className="hero-copy">
          <p className="hero-badge">{HERO.badge}</p>
          <h1 id="hero-heading">
            {HERO.headlineLead}
            <span className="accent">{HERO.headlineAccent}</span>
            {HERO.headlineTail}
          </h1>
          <p className="hero-lede">{HERO.copy}</p>
          <div className="hero-actions">
            <a className="button button-primary button-lg" href={ROUTES.book}>
              {HERO_CTA_LABEL}
              <ArrowRight aria-hidden="true" />
            </a>
            <a className="button button-ghost button-lg" href={ROUTES.features}>
              <ArrowDown aria-hidden="true" />
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
