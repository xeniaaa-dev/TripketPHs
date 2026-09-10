import { PARTNER_LOGOS } from '../data/content'

/**
 * The carrier logos, as a static row.
 *
 * This used to be a looping marquee — a doubled track translated by -50% so
 * the seam was invisible, with the short partner list repeated until one group
 * was wider than the viewport. With three carriers that meant each logo
 * appeared five times over, which read as more partners than there are. A
 * still row of three says the true thing and needs no motion, no clone and no
 * reduced-motion fallback.
 */
export default function PartnerMarquee() {
  return (
    /* Not a section of its own: it renders inside the partner band, so the
       carriers read as evidence for the pitch above them rather than as an
       unexplained strip between that band and the footer. The heading is an h3
       for the same reason — it is subordinate to "Join Tripket PH as a
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

      <ul className="partner-row" aria-label="Tripket PH shipping line partners">
        {PARTNER_LOGOS.map(({ name, src }) => (
          <li className="partner" key={name}>
            <span className="partner-badge">
              <img src={src} alt="" width="96" height="96" decoding="async" draggable={false} />
            </span>
            <span className="partner-name">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
