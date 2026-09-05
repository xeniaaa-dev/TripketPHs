import { PARTNER_LOGOS } from '../data/content'

function LogoGroup({ cloned = false }) {
  return (
    <ul
      className="marquee-group"
      aria-label={cloned ? undefined : 'Tripket PH shipping line partners'}
      aria-hidden={cloned || undefined}
    >
      {PARTNER_LOGOS.map(({ name, src }) => (
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

      {/* One continuous row. The clone is what makes the loop seamless: the
          track scrolls exactly one group's width, then snaps back invisibly.
          Motion stops on hover and on keyboard focus, and prefers-reduced-motion
          replaces the scroller with a static grid (see styles.css). */}
      <div className="marquee">
        <div className="marquee-track">
          <LogoGroup />
          <LogoGroup cloned />
        </div>
      </div>
    </section>
  )
}
