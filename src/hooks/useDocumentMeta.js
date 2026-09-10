import { useEffect } from 'react'
import { PAGE_META } from '../data/content'

/* The host serving this build. Used for the canonical link and the runtime
   og:url. Must match the origin in index.html's og:* tags — a canonical
   pointing at a domain that serves a different site is worse than none, and
   src/security.test.js fails if the two drift apart. Change both together
   when this build takes over tripketph.com. */
const SITE_URL = 'https://tripket-p-hs.vercel.app'

/** Creates the tag on first use, then keeps its content in step with the route. */
function setMeta(selector, create, value) {
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = create()
    document.head.appendChild(tag)
  }
  if (tag.tagName === 'LINK') tag.setAttribute('href', value)
  else tag.setAttribute('content', value)
}

/**
 * A client-side page change does not reload the document, so the title and
 * description stay on whatever index.html shipped. Every route would otherwise
 * share one title in search results and link previews.
 */
export default function useDocumentMeta(path) {
  useEffect(() => {
    const meta = PAGE_META[path] ?? PAGE_META['/']

    document.title = meta.title
    setMeta('meta[name="description"]', () => {
      const el = document.createElement('meta')
      el.setAttribute('name', 'description')
      return el
    }, meta.description)

    /* Only some routes ask to be hidden from search engines — currently the
       placeholder refund policy. The tag has to be REMOVED again on every
       other route, not just left in place: this is a single document that
       never reloads, so a lingering noindex would follow the visitor around
       and quietly de-index the whole site. */
    const robots = document.head.querySelector('meta[name="robots"]')
    if (meta.robots) {
      if (robots) robots.setAttribute('content', meta.robots)
      else {
        const el = document.createElement('meta')
        el.setAttribute('name', 'robots')
        el.setAttribute('content', meta.robots)
        document.head.appendChild(el)
      }
    } else if (robots) {
      robots.remove()
    }

    setMeta('link[rel="canonical"]', () => {
      const el = document.createElement('link')
      el.setAttribute('rel', 'canonical')
      return el
    }, SITE_URL + path)

    for (const [property, value] of [
      ['og:title', meta.title],
      ['og:description', meta.description],
      ['og:url', SITE_URL + path],
      ['og:type', 'website'],
    ]) {
      setMeta(`meta[property="${property}"]`, () => {
        const el = document.createElement('meta')
        el.setAttribute('property', property)
        return el
      }, value)
    }
  }, [path])
}
