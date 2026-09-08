import { PARTNER_LOGOS } from '../data/content'

/**
 * The loop translates the track by exactly -50%, so one group has to be wider
 * than the viewport or the seam becomes a visible gap. With only a handful of
 * partners the list is repeated until it is wide enough; with twenty or more it
 * is used as-is.
 */
const TARGET_LOGOS_PER_GROUP = 20
const REPEATS = Math.max(1, Math.ceil(TARGET_LOGOS_PER_GROUP / PARTNER_LOGOS.length))

function LogoGroup({ cloned = false }) {
  return (
    <ul
      className="marquee-group"
      aria-label={cloned ? undefined : 'Tripket PH shipping line partners'}
      aria-hidden={cloned || undefined}
    >
      {Array.from({ length: REPEATS }, (_, pass) =>
        PARTNER_LOGOS.map(({ name, src }) => (
          <li
            className="partner"
            key={`${pass}-${name}`}
            /* Only the first pass is announced, so each carrier is read once
               however many times it is repeated for width. */
            aria-hidden={pass > 0 || undefined}
          >
            <span className="partner-badge">
              {/* Eager: the track extends past the viewport horizontally, so
                  lazy loading would leave blank badges scrolling into view. The
                  optimized logos together weigh under 90 KB. */}
              <img src={src} alt="" width="96" height="96" decoding="async" draggable={false} />
            </span>
            <span className="partner-name">{name}</span>
          </li>
        )),
      )}
    </ul>
  )
}

export default function PartnerMarquee() {
  return (
    /* Not a section of its own any more: it renders inside the partner band,
       so the carriers read as evidence for the pitch above them instead of as
       an unexplained strip between that band and the footer. The heading is an
       h3 for the same reason - it is subordinate to "Join Tripket PH as a
       shipping partner", which labels the section. */
    <div className="partner-cta-trust">
      <div className="container trust-head" data-reveal>
        <h3 className="eyebrow" id="trust-heading">
          Trusted by leading Philippine shipping lines
        </h3>
        <p className="trust-stat">
          <strong>{PARTNER_LOGOS.length}</strong> Philippine shipping lines onboard
        </p>
      </div>

      {/* One continuous row. The clone is what makes the loop seamless: the
          track scrolls exactly one group's width, then snaps back invisibly.
          Motion stops on keyboard focus, but deliberately not on hover -
          pointer users kept freezing the row by accident. prefers-reduced-motion
          replaces the scroller with a static grid (see styles.css). */}
      <div className="marquee">
        <div className="marquee-track">
          <LogoGroup />
          <LogoGroup cloned />
        </div>
      </div>
    </div>
  )
}
