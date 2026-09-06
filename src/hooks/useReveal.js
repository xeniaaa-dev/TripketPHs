import { useEffect } from 'react'

const REVEAL_ATTR = 'data-reveal'
const READY_ATTR = 'revealReady'

/**
 * Reveals any `[data-reveal]` element as it scrolls into view: fade up 24px
 * over 500ms, matching the "Standard" scroll-reveal tier (power2.out, trigger
 * at top 85%). One observer serves the whole page.
 *
 * The hiding styles are scoped behind `data-reveal-ready` on <html>, which
 * this hook sets on mount — so if the script never runs, or the browser has no
 * IntersectionObserver, every element simply stays visible.
 *
 * `routeKey` re-runs the effect on a client-side page change. Within a page,
 * content that appears later — an FAQ tab switch, a filtered list — is picked
 * up by a MutationObserver, because anything the IntersectionObserver never
 * saw would stay stuck at opacity 0.
 */
export default function useReveal(routeKey) {
  useEffect(() => {
    const root = document.documentElement

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (reducedMotion?.matches || typeof IntersectionObserver === 'undefined') return undefined

    root.dataset[READY_ATTR] = 'true'

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          // A data attribute, not a class: React owns `className` and rewrites
          // it wholesale on re-render, which would silently strip a class added
          // here and send an already-revealed element back to opacity 0.
          entry.target.dataset.revealed = 'true'
          observer.unobserve(entry.target)
        }
      },
      // 85% of the viewport height from the top, per the motion spec.
      { rootMargin: '0px 0px -15% 0px', threshold: 0 },
    )

    // Already-revealed elements keep their attribute and need no re-observing.
    function observeWithin(scope) {
      for (const el of scope.querySelectorAll(`[${REVEAL_ATTR}]`)) {
        if (!el.dataset.revealed) observer.observe(el)
      }
    }

    observeWithin(document)

    // Elements rendered after mount (tab panels, search results) were never
    // handed to the IntersectionObserver, so they would never reveal.
    let mutationObserver
    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue
            if (node.matches(`[${REVEAL_ATTR}]`) && !node.dataset.revealed) observer.observe(node)
            observeWithin(node)
          }
        }
      })
      mutationObserver.observe(document.body, { childList: true, subtree: true })
    }

    // If the user turns reduced motion on mid-session, drop the effect entirely.
    const onPreferenceChange = (event) => {
      if (!event.matches) return
      observer.disconnect()
      delete root.dataset[READY_ATTR]
    }
    reducedMotion?.addEventListener?.('change', onPreferenceChange)

    return () => {
      observer.disconnect()
      mutationObserver?.disconnect()
      reducedMotion?.removeEventListener?.('change', onPreferenceChange)
      delete root.dataset[READY_ATTR]
    }
  }, [routeKey])
}
