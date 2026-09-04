import { useEffect, useState } from 'react'

/**
 * Reports which of `ids` is the section currently being read, so a table of
 * contents can highlight it. Falls back to the first id when nothing has been
 * observed yet, and does nothing at all without IntersectionObserver.
 */
export default function useScrollSpy(ids) {
  const [activeId, setActiveId] = useState(ids[0] ?? null)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined

    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (elements.length === 0) return undefined

    // Visible headings are tracked in a set rather than taking the last one to
    // cross the line, so scrolling back up highlights the right section.
    const visible = new Set()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        const firstVisible = ids.find((id) => visible.has(id))
        if (firstVisible) setActiveId(firstVisible)
      },
      // A band near the top of the viewport: a section counts as "current"
      // once its heading reaches the upper third.
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    )

    for (const element of elements) observer.observe(element)
    return () => observer.disconnect()
  }, [ids])

  return activeId
}
