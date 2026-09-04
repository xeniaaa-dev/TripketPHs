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
 * `routeKey` re-runs the effect on a client-side page change. Without it the
 * observer would only ever know about the elements present on first render,
 * and every section of a newly rendered page would stay stuck at opacity 0.
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
          entry.target.classList.add('is-revealed')
          observer.unobserve(entry.target)
        }
      },
      // 85% of the viewport height from the top, per the motion spec.
      { rootMargin: '0px 0px -15% 0px', threshold: 0 },
    )

    for (const el of document.querySelectorAll(`[${REVEAL_ATTR}]`)) observer.observe(el)

    // If the user turns reduced motion on mid-session, drop the effect entirely.
    const onPreferenceChange = (event) => {
      if (!event.matches) return
      observer.disconnect()
      delete root.dataset[READY_ATTR]
    }
    reducedMotion?.addEventListener?.('change', onPreferenceChange)

    return () => {
      observer.disconnect()
      reducedMotion?.removeEventListener?.('change', onPreferenceChange)
      delete root.dataset[READY_ATTR]
    }
  }, [routeKey])
}
