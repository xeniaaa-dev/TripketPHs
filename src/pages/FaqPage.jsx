import { useId, useMemo, useRef, useState } from 'react'
import { ArrowRight, ChevronDown, Search } from 'lucide-react'
import PageHero from '../components/PageHero'
import { FAQ_AUDIENCES } from '../data/faq'
import { ROUTES } from '../data/content'

function Answer({ item, idPrefix }) {
  const [open, setOpen] = useState(false)
  const panelId = `${idPrefix}-panel`
  const buttonId = `${idPrefix}-button`

  return (
    <li className={open ? 'faq-item is-open' : 'faq-item'}>
      <h4>
        <button
          type="button"
          id={buttonId}
          className="faq-question"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{item.q}</span>
          <ChevronDown className="faq-chevron" aria-hidden="true" />
        </button>
      </h4>
      {/* Kept in the DOM and hidden, so in-page search and screen-reader
          browsing still reach the answers. */}
      <div className="faq-answer" id={panelId} role="region" aria-labelledby={buttonId} hidden={!open}>
        <p>{item.a}</p>
      </div>
    </li>
  )
}

export default function FaqPage() {
  const [audienceId, setAudienceId] = useState(FAQ_AUDIENCES[0].id)
  const [query, setQuery] = useState('')
  const tabRefs = useRef([])
  const uid = useId()

  const audience = FAQ_AUDIENCES.find((item) => item.id === audienceId) ?? FAQ_AUDIENCES[0]

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return audience.groups
    return audience.groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.q.toLowerCase().includes(needle) || item.a.toLowerCase().includes(needle),
        ),
      }))
      .filter((group) => group.items.length > 0)
  }, [audience, query])

  const matchCount = groups.reduce((total, group) => total + group.items.length, 0)

  // Left/right arrows move between tabs, as expected of a tablist.
  function onTabKeyDown(event, index) {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    event.preventDefault()
    const next = (index + delta + FAQ_AUDIENCES.length) % FAQ_AUDIENCES.length
    setAudienceId(FAQ_AUDIENCES[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <>
      <PageHero
        eyebrow="Support"
        lead="Frequently asked "
        accent="questions"
        copy="Find answers to common questions about booking, payments, cancellations, and more."
      />

      <section className="faq" aria-labelledby="faq-heading">
        <div className="container">
          <h2 className="visually-hidden" id="faq-heading">
            Questions and answers
          </h2>

          <div className="faq-controls">
            <div className="faq-tabs" role="tablist" aria-label="Choose who you are">
              {FAQ_AUDIENCES.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  ref={(node) => {
                    tabRefs.current[index] = node
                  }}
                  id={`${uid}-tab-${item.id}`}
                  className={item.id === audienceId ? 'faq-tab is-selected' : 'faq-tab'}
                  aria-selected={item.id === audienceId}
                  aria-controls={`${uid}-panel-${item.id}`}
                  tabIndex={item.id === audienceId ? 0 : -1}
                  onClick={() => setAudienceId(item.id)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="faq-search">
              <Search aria-hidden="true" />
              <label className="visually-hidden" htmlFor={`${uid}-search`}>
                Search the FAQ
              </label>
              <input
                id={`${uid}-search`}
                type="search"
                placeholder="Search questions…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          <p className="faq-count" role="status">
            {query.trim()
              ? `${matchCount} ${matchCount === 1 ? 'answer' : 'answers'} matching “${query.trim()}”`
              : `${matchCount} answers`}
          </p>

          <div
            role="tabpanel"
            id={`${uid}-panel-${audience.id}`}
            aria-labelledby={`${uid}-tab-${audience.id}`}
            tabIndex={-1}
          >
            {groups.length === 0 ? (
              <p className="faq-empty">
                No answers matched that search. Try a different word, or{' '}
                <a href={ROUTES.contact}>contact our support team</a>.
              </p>
            ) : (
              groups.map((group) => (
                <div className="faq-group" key={group.title} data-reveal>
                  <h3>{group.title}</h3>
                  <ul>
                    {group.items.map((item) => (
                      <Answer
                        key={item.q}
                        item={item}
                        idPrefix={`${uid}-${audience.id}-${item.q.slice(0, 24).replace(/\W+/g, '-')}`}
                      />
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="page-cta" aria-labelledby="faq-cta-heading">
        <div className="container page-cta-inner" data-reveal="scale">
          <h2 id="faq-cta-heading">Still have questions?</h2>
          <p>Our support team is ready to help you with any booking concern.</p>
          <div className="page-cta-actions">
            <a className="button button-primary button-lg" href={ROUTES.contact}>
              Contact us
              <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
