import { useEffect, useRef, useState } from 'react'

/**
 * Reports whether the page has scrolled far enough that the sticky header now
 * overlaps content. Attach the returned ref to a sentinel element placed
 * directly after the header: once that sentinel leaves the viewport, the
 * header is covering something and should lift off the page.
 *
 * Sentinel + IntersectionObserver rather than a scroll listener, so nothing
 * runs on the main thread per frame. (Observing the sticky header itself does
 * not work — it sits at the top of the viewport from the very first paint.)
 */
export default function useStuck() {
  const ref = useRef(null)
  const [isStuck, setIsStuck] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(([entry]) => setIsStuck(!entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, isStuck }
}
