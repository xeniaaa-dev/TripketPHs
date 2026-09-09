import { useMemo } from 'react'
import { ArrowRight, ArrowUp } from 'lucide-react'
import PageHero from './PageHero'
import useScrollSpy from '../hooks/useScrollSpy'
import { ROUTES } from '../data/content'

/**
 * Renders a long support document from `src/data/legal.js`. Both the prose and
 * the table of contents come from the same section list, so they cannot drift.
 */
export default function LegalPage({ doc }) {
  const ids = useMemo(() => doc.sections.map((section) => section.id), [doc])
  const activeId = useScrollSpy(ids)

  return (
    <>
      <PageHero
        eyebrow={doc.eyebrow}
        lead={doc.title.replace(/\s\S+$/, ' ')}
        accent={doc.title.split(' ').pop()}
        copy={doc.lede}
      />

      <div className="legal">
        <div className="container legal-grid">
          <nav className="legal-toc" aria-labelledby="toc-heading">
            <h2 className="legal-toc-heading" id="toc-heading">
              On this page
            </h2>
            <ol>
              {doc.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={section.id === activeId ? 'is-active' : undefined}
                    aria-current={section.id === activeId ? 'true' : undefined}
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="legal-body">
            {/* Optional callout for a document that is not final yet. role
                note rather than alert: it is standing context, not something
                that just happened, so it should not interrupt a screen
                reader mid-page. */}
            {doc.notice ? (
              <aside className="legal-notice" role="note" aria-labelledby="legal-notice-heading">
                <h2 id="legal-notice-heading">{doc.notice.title}</h2>
                {doc.notice.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
                {doc.notice.links?.length ? (
                  <p className="legal-notice-actions">
                    {doc.notice.links.map(({ label, href }) => (
                      <a className="button button-quiet" href={href} key={href}>
                        {label}
                        <ArrowRight aria-hidden="true" />
                      </a>
                    ))}
                  </p>
                ) : null}
              </aside>
            ) : null}

            {doc.sections.map((section) => (
              <section key={section.id} id={section.id} data-reveal>
                <h2>{section.title}</h2>
                {section.body?.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
                {section.list ? (
                  <ul>
                    {section.list.map((item) => (
                      <li key={item.slice(0, 40)}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <div className="legal-footer">
              <a className="button button-quiet" href="#page-heading">
                <ArrowUp aria-hidden="true" />
                Back to top
              </a>
              <a className="button button-quiet" href={ROUTES.contact}>
                Contact support
                <ArrowRight aria-hidden="true" />
              </a>
            </div>
          </article>
        </div>
      </div>
    </>
  )
}
