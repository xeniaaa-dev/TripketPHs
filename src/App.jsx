import { Suspense, lazy } from 'react'
import Header from './components/Header'
import SiteFooter from './components/SiteFooter'
import HomePage from './pages/HomePage'
import useDocumentMeta from './hooks/useDocumentMeta'
import useReveal from './hooks/useReveal'
import useRouter from './hooks/useRouter'
import useStuck from './hooks/useStuck'
import useTheme from './hooks/useTheme'

/**
 * The home page is bundled with the shell because it is the landing route for
 * almost all traffic — code-splitting it would only add a round trip before
 * the hero can paint. Every other page is fetched on demand, so a visitor who
 * never opens the legal pages never downloads the 34-item FAQ, the two long
 * legal documents, or the partner carousel.
 */
const LAZY_PAGES = {
  '/about': lazy(() => import('./pages/AboutPage')),
  '/partners': lazy(() => import('./pages/PartnersPage')),
  '/support/contact': lazy(() => import('./pages/ContactPage')),
  '/support/faq': lazy(() => import('./pages/FaqPage')),
  '/support/refund-policy': lazy(() => import('./pages/RefundPage')),
  '/support/privacy': lazy(() => import('./pages/PrivacyPage')),
  '/support/terms': lazy(() => import('./pages/TermsPage')),
  '/support/account-deletion-request': lazy(() => import('./pages/AccountDeletionPage')),
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const { ref: sentinelRef, isStuck } = useStuck()
  const path = useRouter()
  useDocumentMeta(path)
  useReveal(path)

  const Page = path === '/' ? HomePage : LAZY_PAGES[path] ?? HomePage

  return (
    <div className="page" id="top">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <Header theme={theme} onToggleTheme={toggleTheme} isStuck={isStuck} path={path} />
      {/* Leaves the viewport as soon as the header starts covering content. */}
      <div className="scroll-sentinel" ref={sentinelRef} aria-hidden="true" />

      {/* tabIndex lets useRouter move focus here on a client-side page change,
          so the change is announced instead of happening silently. */}
      <main id="main-content" tabIndex={-1}>
        {/* The placeholder reserves height so the footer does not jump up and
            back while a page chunk is in flight. It is deliberately blank
            rather than a spinner: chunks are small and same-origin, so a
            spinner would usually be a flash. The route change is already
            announced by the focus move in useRouter and the title update in
            useDocumentMeta. */}
        <Suspense fallback={<div className="route-pending" aria-hidden="true" />}>
          <Page />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  )
}
