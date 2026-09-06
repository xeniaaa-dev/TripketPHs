import { useState } from 'react'
import { Quote } from 'lucide-react'
import { FOUNDERS } from '../data/content'

/**
 * Split layout: a gallery of faces on the left, the detail cards on the right.
 *
 * The two columns are the same four people in the same order, which on its own
 * reads as duplication — so hovering either a portrait or a card lights up its
 * partner on the other side and dims the rest, making the pairing explicit.
 */
export default function Founders() {
  const [activeIndex, setActiveIndex] = useState(null)

  const pairProps = (index) => ({
    onMouseEnter: () => setActiveIndex(index),
    onMouseLeave: () => setActiveIndex(null),
    onFocus: () => setActiveIndex(index),
    onBlur: () => setActiveIndex(null),
  })

  const stateClass = (index, base) => {
    if (activeIndex === null) return base
    return activeIndex === index ? `${base} is-paired` : `${base} is-dimmed`
  }

  return (
    <section className="founders" aria-labelledby="founders-heading">
      <div className="container">
        <div className="section-head is-centered" data-reveal>
          <p className="eyebrow">The team</p>
          <h2 id="founders-heading">
            Meet the <span className="accent">founders</span>
          </h2>
        </div>

        <div className="founders-split">
          {/* Every name and role here is repeated in the cards alongside, so the
              gallery is presented as decoration rather than read out twice. */}
          <ul className="founder-faces" aria-hidden="true">
            {FOUNDERS.map(({ initials, name, role, photo }, index) => (
              <li
                className={stateClass(index, 'founder-face')}
                key={name}
                data-reveal
                {...pairProps(index)}
              >
                <div className="founder-portrait">
                  {photo ? (
                    <img src={photo} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className="founder-monogram">{initials}</span>
                  )}
                </div>
                <p className="founder-face-name">{name}</p>
                <p className="founder-face-role">{role}</p>
              </li>
            ))}
          </ul>

          <ul className="founder-cards">
            {FOUNDERS.map(({ initials, name, role, quote, photo }, index) => (
              <li
                className={stateClass(index, 'founder-card')}
                key={name}
                data-reveal="right"
                {...pairProps(index)}
              >
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
      </div>
    </section>
  )
}
