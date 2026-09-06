import { Ship } from 'lucide-react'
import { JOURNEY_STEPS, SECTION_LABELS } from '../data/content'

const ROUTE_D = 'M4 40C220 4 400 76 720 40s500-36 716 0'

/**
 * The connector is drawn as a sailing route rather than a straight rule: a
 * faint dotted guide with a solid orange line that draws itself in on reveal.
 * `pathLength="100"` normalises the dash maths, so the CSS animation does not
 * depend on the real geometry. Decorative, and hidden once the steps stack.
 */
function RoutePath() {
  return (
    /* Scales uniformly (no preserveAspectRatio="none") so the ferry riding the
       path is not squashed horizontally along with it. */
    <svg className="route-path" viewBox="0 0 1440 80" aria-hidden="true" focusable="false">
      <path className="route-guide" d={ROUTE_D} />
      <path className="route-drawn" d={ROUTE_D} pathLength="100" />

      {/* Sails the same curve via CSS offset-path — see .route-ship. A nested
          <svg> keeps the icon in its own viewport, so it stays upright and
          crisp while the group beneath it is moved and rotated. */}
      <g className="route-ship">
        <Ship x="-24" y="-24" width="48" height="48" />
      </g>
    </svg>
  )
}

export default function Steps() {
  return (
    <section className="steps" id="how-it-works" aria-labelledby="steps-heading">
      <div className="container">
        <div className="section-head is-centered" data-reveal>
          <p className="eyebrow">{SECTION_LABELS.steps}</p>
          <h2 id="steps-heading">
            Book your trip in <span className="accent">3 easy steps</span>
          </h2>
          <p className="section-lede">Getting your ticket is quick and simple with Tripket PH.</p>
        </div>

        <div className="step-map" data-reveal>
          <RoutePath />

          <ol className="step-list">
            {JOURNEY_STEPS.map(({ icon: Icon, step, title, copy }) => (
              <li className="step" key={title}>
                <span className="step-badge">
                  <Icon aria-hidden="true" />
                  <span className="step-number" aria-hidden="true">
                    {String(step).padStart(2, '0')}
                  </span>
                  <span className="sr-only">Step {step}</span>
                </span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
