import { Star } from 'lucide-react'
import { SECTION_LABELS, TESTIMONIALS } from '../data/content'

const MAX_RATING = 5

function Rating({ value }) {
  return (
    <p className="rating" role="img" aria-label={`Rated ${value} out of ${MAX_RATING}`}>
      {Array.from({ length: MAX_RATING }, (_, index) => (
        <Star key={index} className={index < value ? 'is-filled' : undefined} aria-hidden="true" />
      ))}
    </p>
  )
}

/**
 * Person first, then the rating, then the quote — the attribution leads the
 * card rather than closing it, so the three cards line up on a shared visual
 * rhythm instead of ragging against each other at the bottom.
 */
function Testimonial({ initials, name, location, quote, route, rating, featured = false }) {
  return (
    <li className={featured ? 'testimonial-cell is-featured' : 'testimonial-cell'} data-reveal>
      <figure className="testimonial">
        <figcaption className="testimonial-head">
          <span className="avatar" aria-hidden="true">
            {initials}
          </span>
          <span className="testimonial-person">
            <strong>{name}</strong>
            <span>
              {location} · {route}
            </span>
          </span>
        </figcaption>
        <Rating value={rating} />
        <blockquote>{quote}</blockquote>
      </figure>
    </li>
  )
}

export default function Testimonials() {
  return (
    <section className="testimonials" id="testimonials" aria-labelledby="testimonials-heading">
      <div className="container">
        <div className="section-head is-centered" data-reveal>
          <p className="eyebrow">{SECTION_LABELS.testimonials}</p>
          <h2 id="testimonials-heading">
            Loved by <span className="accent">travelers</span> across the Philippines
          </h2>
          <p className="section-lede">
            See what passengers and shippers say about booking with Tripket PH.
          </p>
        </div>

        <ul className="testimonial-grid">
          {TESTIMONIALS.map((testimonial) => (
            <Testimonial key={testimonial.name} {...testimonial} />
          ))}
        </ul>
      </div>
    </section>
  )
}
