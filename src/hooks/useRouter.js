import { useEffect, useRef, useState } from 'react'

/** The pages this project actually ships. */
export const ROUTE_PATHS = [
  '/',
  '/about',
  '/partners',
  '/support/contact',
  '/support/faq',
  '/support/refund-policy',
  '/support/privacy',
  '/support/terms',
  '/support/account-deletion-request',
]

function normalise(pathname) {
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

export function isInternalRoute(pathname) {
  return ROUTE_PATHS.includes(normalise(pathname))
}

/**
 * Minimal history router. Three static marketing pages do not need a routing
 * library, so `location.pathname` stays the single source of truth: this
 * intercepts same-origin clicks that land on a page we own, and deliberately
 * lets everything else through to a real navigation — the support pages, the
 * admin dashboard and the app link are not part of this project, and
 * swallowing those clicks would make dead links look like working ones.
 */
export default function useRouter() {
  const [path, setPath] = useState(() => normalise(window.location.pathname))
  const isFirstRender = useRef(true)

  useEffect(() => {
    function onClick(event) {
      // Leave modified clicks, middle clicks and new tabs to the browser.
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const link = event.target.closest?.('a[href]')
      if (!link) return
      if (link.target && link.target !== '_self') return
      if (link.hasAttribute('download') || link.getAttribute('rel') === 'external') return

      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin) return

      // In-page anchors (#features, #top) keep their native scroll behaviour.
      if (normalise(url.pathname) === normalise(window.location.pathname)) return
      if (!isInternalRoute(url.pathname)) return

      event.preventDefault()
      window.history.pushState({}, '', url.pathname + url.hash)
      setPath(normalise(url.pathname))
    }

    function onPopState() {
      setPath(normalise(window.location.pathname))
    }

    document.addEventListener('click', onClick)
    window.addEventListener('popstate', onPopState)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  // A client-side page change is not a document load, so the browser neither
  // resets the scroll position nor tells assistive tech that the page moved.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (window.location.hash) return

    window.scrollTo(0, 0)
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [path])

  // An unknown deep link renders the home page rather than nothing at all.
  return isInternalRoute(path) ? path : '/'
}
