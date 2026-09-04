/**
 * Compact hero for the interior pages. The home page keeps the full-bleed
 * ferry photograph; these get a shorter warm band so the pages read as part
 * of the same site without competing with it.
 */
export default function PageHero({ eyebrow, lead, accent, copy, children }) {
  return (
    <section className="page-hero" aria-labelledby="page-heading">
      <div className="page-hero-glow" aria-hidden="true" />
      <svg className="page-hero-waves" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 100c180-48 360-48 540 0s360 48 540 0 240-36 360-12" />
        <path d="M0 144c180-48 360-48 540 0s360 48 540 0 240-36 360-12" />
      </svg>

      <div className="container page-hero-inner">
        <p className="eyebrow" data-reveal>
          {eyebrow}
        </p>
        <h1 id="page-heading" data-reveal>
          {lead}
          <span className="accent">{accent}</span>
        </h1>
        <p className="page-hero-lede" data-reveal>
          {copy}
        </p>
        {children}
      </div>
    </section>
  )
}
