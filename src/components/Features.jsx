import { FEATURES, SECTION_LABELS } from '../data/content'

function FeatureTile({ icon: Icon, title, copy }) {
  return (
    <li className="feature" data-reveal>
      <span className="feature-icon">
        <Icon aria-hidden="true" />
      </span>
      <h3>{title}</h3>
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
            Everything you need to <span className="accent">book and ship</span>
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
