import { FEATURES, SECTION_LABELS } from '../data/content'

function FeatureTile({ icon: Icon, title, copy }) {
  return (
    <li className="feature" data-reveal>
      {/* The water and its crest. Purely decorative: it rises to fill the card
          on hover, but every word on the card is already readable at rest, so
          nothing is gated behind a gesture that touch and keyboard users do
          not have. */}
      <div className="card-water" aria-hidden="true">
        <svg className="card-wave" viewBox="0 0 240 24" preserveAspectRatio="none" focusable="false">
          <path d="M0 14c30-10 60-10 90 0s60 10 90 0 40-7 60-3V24H0Z" />
        </svg>
      </div>

      <div className="card-head">
        <span className="feature-icon">
          <Icon aria-hidden="true" />
        </span>
        <h3>{title}</h3>
      </div>

      <p>{copy}</p>
    </li>
  )
}

export default function Features() {
  return (
    <section className="features" id="features" aria-labelledby="features-heading">
      <div className="container">
        <div className="section-head is-centered" data-reveal>
          <p className="eyebrow">{SECTION_LABELS.features}</p>
          <h2 id="features-heading">
            Everything you need to <span className="accent">book and travel</span>
          </h2>
          <p className="section-lede">
            Tripket PH brings Philippine transportation online — fast, secure, and easy.
          </p>
        </div>

        {/* Even 3x2 grid in the order the capabilities are published. */}
        <ul className="feature-grid">
          {FEATURES.map((feature) => (
            <FeatureTile key={feature.title} {...feature} />
          ))}
        </ul>
      </div>
    </section>
  )
}
