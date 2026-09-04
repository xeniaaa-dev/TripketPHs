import { FEATURES, SECTION_LABELS } from '../data/content'

const FEATURED = FEATURES.filter((feature) => feature.featured)
const SUPPORTING = FEATURES.filter((feature) => !feature.featured)

function FeatureTile({ icon: Icon, title, copy, large = false }) {
  return (
    <li className={large ? 'feature feature-lg' : 'feature'} data-reveal>
      {large ? <Icon className="feature-watermark" aria-hidden="true" /> : null}
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
        <div className="section-head" data-reveal>
          <p className="eyebrow">{SECTION_LABELS.features}</p>
          <h2 id="features-heading">
            Everything you need to <span className="accent">book and ship</span>
          </h2>
          <p className="section-lede">
            Tripket PH brings Philippine transportation online — fast, secure, and easy.
          </p>
        </div>

        <ul className="feature-grid">
          {FEATURED.map((feature) => (
            <FeatureTile key={feature.title} {...feature} large />
          ))}
          {SUPPORTING.map((feature) => (
            <FeatureTile key={feature.title} {...feature} />
          ))}
        </ul>
      </div>
    </section>
  )
}
