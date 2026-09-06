import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react'
import { PARTNER_LOGOS } from '../data/content'

function PartnerSlide({ name, src, ship, blurb }) {
  const [expanded, setExpanded] = useState(false)
  const bodyId = useId()

  return (
    <li className="p-slide">
      <article className={expanded ? 'p-card is-expanded' : 'p-card'}>
        <div className="p-card-media">
          <img src={ship} alt={`${name} vessel`} loading="lazy" decoding="async" />
          <span className="p-card-logo">
            <img src={src} alt="" loading="lazy" decoding="async" />
          </span>
        </div>

        <div className="p-card-body">
          <h3>{name}</h3>
          <p className="p-card-blurb" id={bodyId}>
            {blurb}
          </p>
          {/* These shipping lines have no page of their own to link to, so the
              action reveals the rest of the description instead of pointing at
              a URL that does not exist. */}
          <button
            className="p-card-more"
            type="button"
            aria-expanded={expanded}
            aria-controls={bodyId}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? 'Show less' : 'Learn more'}
            <ChevronDown aria-hidden="true" />
          </button>
        </div>
      </article>
    </li>
  )
}

export default function PartnerCarousel() {
  const trackRef = useRef(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [page, setPage] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const max = track.scrollWidth - track.clientWidth
    // The track carries a few px of padding so hover shadows are not clipped,
    // and scroll-snap rests the first card against it — so at-rest scrollLeft
    // is a small non-zero number, not 0. A page step is hundreds of px, so
    // this tolerance cannot mask a real position.
    const EDGE = 16
    setAtStart(track.scrollLeft <= EDGE)
    setAtEnd(track.scrollLeft >= max - EDGE)
    const pages = Math.max(1, Math.ceil(track.scrollWidth / Math.max(track.clientWidth, 1)))
    setPageCount(pages)
    setPage(max <= 0 ? 0 : Math.round((track.scrollLeft / max) * (pages - 1)))
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined
    measure()
    track.addEventListener('scroll', measure, { passive: true })

    // Guarded: without ResizeObserver the buttons still work, they just stop
    // re-measuring on resize. An unguarded constructor would throw and take
    // the whole page down.
    let resize
    if (typeof ResizeObserver !== 'undefined') {
      resize = new ResizeObserver(measure)
      resize.observe(track)
    }

    return () => {
      track.removeEventListener('scroll', measure)
      resize?.disconnect()
    }
  }, [measure])

  function scrollByPage(direction) {
    const track = trackRef.current
    if (!track) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    // A page is one viewport of the track, less a card's worth of overlap so
    // the reader keeps a visual anchor between pages.
    const step = Math.max(track.clientWidth * 0.85, 240)
    track.scrollBy({ left: direction * step, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <section className="partner-carousel" aria-labelledby="carousel-heading">
      <div className="container">
        <div className="section-head is-centered" data-reveal>
          <p className="eyebrow">Our network</p>
          <h2 id="carousel-heading">
            The shipping lines <span className="accent">onboard</span>
          </h2>
          <p className="section-lede">
            Swipe through every carrier booking through Tripket PH today.
          </p>
        </div>

        {/* A scroll-snap track: it is swipeable by touch and scrollable by
            keyboard on its own, and the buttons drive the same scroll. */}
        <ul
          className="p-track"
          ref={trackRef}
          tabIndex={0}
          role="group"
          aria-label={`${PARTNER_LOGOS.length} shipping line partners, scrollable`}
        >
          {PARTNER_LOGOS.map((partner) => (
            <PartnerSlide key={partner.name} {...partner} />
          ))}
        </ul>

        <div className="p-controls">
          <p className="p-progress" role="status" aria-live="polite">
            {String(page + 1).padStart(2, '0')}
            <span aria-hidden="true"> / </span>
            <span className="p-progress-total">{String(pageCount).padStart(2, '0')}</span>
          </p>

          <div className="p-buttons">
            <button
              className="p-nav"
              type="button"
              aria-label="Previous partners"
              disabled={atStart}
              onClick={() => scrollByPage(-1)}
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <button
              className="p-nav is-primary"
              type="button"
              aria-label="Next partners"
              disabled={atEnd}
              onClick={() => scrollByPage(1)}
            >
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
