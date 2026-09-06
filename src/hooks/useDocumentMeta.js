import { useEffect } from 'react'
import { PAGE_META } from '../data/content'

const SITE_URL = 'https://tripketph.com'

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
