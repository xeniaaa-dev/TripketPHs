import { ArrowRight, ChevronDown, Menu, Moon, Sun, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import Brand from './Brand'
import { PRIMARY_CTA_LABEL, PRIMARY_NAV, ROUTES, SUPPORT_NAV } from '../data/content'

export default function Header({ theme, onToggleTheme, isStuck = false, path = '/' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const supportRef = useRef(null)
  const supportButtonRef = useRef(null)

  const closeAll = useCallback(() => {
    setMenuOpen(false)
    setSupportOpen(false)
  }, [])

  // Escape closes the Support disclosure and hands focus back to its trigger.
  useEffect(() => {
    if (!supportOpen) return undefined

    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      setSupportOpen(false)
      supportButtonRef.current?.focus()
    }

    function onPointerDown(event) {
      if (!supportRef.current?.contains(event.target)) setSupportOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [supportOpen])

  const isDark = theme === 'dark'
  const inSupport = path.startsWith('/support')

  return (
    <header className={isStuck ? 'site-header is-stuck' : 'site-header'}>
      <div className={menuOpen ? 'nav-shell is-menu-open' : 'nav-shell'}>
        <Brand />

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav
          className={menuOpen ? 'site-nav is-open' : 'site-nav'}
          id="primary-navigation"
          aria-label="Primary"
        >
          <ul className="nav-links">
            {PRIMARY_NAV.map(({ label, href }) => {
              const isCurrent = href === path
              // Home links to `/` so it routes back from any other page. Only
              // once we are already home does it degrade to the #top anchor —
              // an href pointing at the current route would otherwise reload
              // the document instead of scrolling up.
              const target = isCurrent && href === ROUTES.home ? ROUTES.top : href
              return (
                <li key={label}>
                  <a
                    className={isCurrent ? 'nav-link is-current' : 'nav-link'}
                    href={target}
                    aria-current={isCurrent ? 'page' : undefined}
                    onClick={closeAll}
                  >
                    {label}
                  </a>
                </li>
              )
            })}

            <li className="nav-support" ref={supportRef}>
              <button
                className={
                  inSupport ? 'nav-link nav-support-trigger is-current' : 'nav-link nav-support-trigger'
                }
                type="button"
                ref={supportButtonRef}
                aria-expanded={supportOpen}
                aria-controls="support-menu"
                onClick={() => setSupportOpen((open) => !open)}
              >
                Support
                <ChevronDown className="nav-chevron" aria-hidden="true" />
              </button>
              <ul className="support-menu" id="support-menu" hidden={!supportOpen}>
                {SUPPORT_NAV.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className={href === path ? 'is-current' : undefined}
                      aria-current={href === path ? 'page' : undefined}
                      onClick={closeAll}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          </ul>

          <div className="nav-actions">
            <a className="button button-quiet" href={ROUTES.admin} onClick={closeAll}>
              Admin Dashboard
              <ArrowRight aria-hidden="true" />
            </a>
            <a className="button button-primary" href={ROUTES.book} onClick={closeAll}>
              {PRIMARY_CTA_LABEL}
              <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </nav>

        <button
          className="theme-toggle"
          type="button"
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-pressed={isDark}
          onClick={onToggleTheme}
        >
          {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        </button>
      </div>
    </header>
  )
}
