import { Quote } from 'lucide-react'
import { FOUNDERS } from '../data/content'

/**
 * One row of founder cards: avatar, name, role and a short quote each.
 *
 * This was a split layout — a gallery of square portraits on the left, these
 * cards on the right — with hover pairing between the two columns to make the
 * repetition read as deliberate. The gallery is gone, so the pairing went with
 * it: each card now simply lifts on its own hover.
 */
export default function Founders() {
  return (
    <section className="founders" aria-labelledby="founders-heading">
      <div className="container">
        <div className="section-head is-centered" data-reveal>
          <p className="eyebrow">The team</p>
          <h2 id="founders-heading">
            Meet the <span className="accent">founders</span>
          </h2>
        </div>

        <ul className="founder-cards">
          {FOUNDERS.map(({ initials, name, role, quote, photo }) => (
            <li className="founder-card" key={name} data-reveal>
              <figure>
                <span className="founder-avatar" aria-hidden="true">
                  {photo ? <img src={photo} alt="" loading="lazy" decoding="async" /> : initials}
                </span>
                <figcaption className="founder-person">
                  <strong>{name}</strong>
                  <span>{role}</span>
                </figcaption>
                <blockquote>
                  <Quote className="founder-quote-mark" aria-hidden="true" />
                  {quote}
                </blockquote>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
