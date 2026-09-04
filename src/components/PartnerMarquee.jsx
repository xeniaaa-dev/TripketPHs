import { PARTNER_LOGOS } from '../data/content'

// Two rows drifting in opposite directions read as a deliberate wall of
// carriers rather than a thin strip. Split once at module scope.
const SPLIT = Math.ceil(PARTNER_LOGOS.length / 2)
const ROWS = [PARTNER_LOGOS.slice(0, SPLIT), PARTNER_LOGOS.slice(SPLIT)]

function LogoGroup({ logos, rowIndex, cloned = false }) {
  return (
    <ul
      className="marquee-group"
      aria-label={cloned ? undefined : `Tripket PH shipping line partners, row ${rowIndex + 1}`}
      aria-hidden={cloned || undefined}
    >
      {logos.map(({ name, src }) => (
        <li className="partner" key={name}>
          <span className="partner-badge">
            {/* Eager: the track extends past the viewport horizontally, so lazy
                loading would leave blank badges scrolling into view. All 15
                optimized logos together weigh under 90 KB. */}
            <img src={src} alt="" width="96" height="96" decoding="async" />
          </span>
          <span className="partner-name">{name}</span>
        </li>
      ))}
    </ul>
  )
}

export default function PartnerMarquee() {
  return (
    <section className="trust-bar" id="partners" aria-labelledby="trust-heading">
      <div className="container trust-head" data-reveal>
        <h2 className="eyebrow" id="trust-heading">
          Trusted by leading Philippine shipping lines
        </h2>
        <p className="trust-stat">
          <strong>{PARTNER_LOGOS.length}</strong> Philippine shipping lines onboard
        </p>
      </div>

      {/* Motion stops on hover and on keyboard focus, and prefers-reduced-motion
          replaces both scrolling rows with one static grid (see styles.css). */}
      <div className="marquee">
        {ROWS.map((logos, rowIndex) => (
          <div
            className={rowIndex === 1 ? 'marquee-track is-reverse' : 'marquee-track'}
            key={rowIndex}
          >
            <LogoGroup logos={logos} rowIndex={rowIndex} />
            <LogoGroup logos={logos} rowIndex={rowIndex} cloned />
          </div>
        ))}
      </div>
    </section>
  )
}
