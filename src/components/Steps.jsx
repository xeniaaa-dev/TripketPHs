import BrandMark, { BRAND_MARK_RATIO } from './BrandMark'
import { JOURNEY_STEPS, SECTION_LABELS } from '../data/content'

const ROUTE_D = 'M4 40C220 4 400 76 720 40s500-36 716 0'

/* The vessel on the route is the Tripket mark itself, not a generic glyph.
   Sized in the outer SVG's user units, and offset by half its width so the
   hull centres on the point riding the path. The mark's own hull line sits
   about 84% down its 266-unit box, so the vertical offset lands that line on
   the route instead of the middle of the sails — the ship reads as sailing
   along the line rather than floating above it. */
/* 52, not the old glyph's 48: roughly a third of the mark's box is its own
   wave crest, so a like-for-like box would render a visibly smaller hull. */
const SHIP_H = 52
const SHIP_W = Math.round(SHIP_H * BRAND_MARK_RATIO)
const SHIP_WATERLINE = 0.84

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

      {/* Sails the same curve via CSS offset-path — see .route-ship. BrandMark
          renders a nested <svg>, which keeps the mark in its own viewport and
          scaling cleanly while the group beneath it is moved and rotated. */}
      <g className="route-ship">
        <BrandMark
          className="route-ship-mark"
          size={SHIP_H}
          x={-SHIP_W / 2}
          y={-Math.round(SHIP_H * SHIP_WATERLINE)}
        />
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
