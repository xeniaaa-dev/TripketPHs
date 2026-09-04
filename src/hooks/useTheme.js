import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'tripket-theme.v1'
const THEME_COLOR = { light: '#FFF8EE', dark: '#16110D' }

function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Private mode or blocked storage: fall through to the system preference.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Light is the brand default (warm cream surfaces); dark is the opt-in variant
 * that mirrors the toggle on tripketph.com. The choice is remembered per
 * browser and reflected on <html> so scrollbars and form controls follow it.
 */
export default function useTheme() {
  const [theme, setTheme] = useState(readStoredTheme)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.style.colorScheme = theme

    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', THEME_COLOR[theme])

    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Preference is session-only when storage is unavailable.
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
