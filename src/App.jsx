import Header from './components/Header'
import SiteFooter from './components/SiteFooter'
import AboutPage from './pages/AboutPage'
import AccountDeletionPage from './pages/AccountDeletionPage'
import ContactPage from './pages/ContactPage'
import FaqPage from './pages/FaqPage'
import HomePage from './pages/HomePage'
import PartnersPage from './pages/PartnersPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import useDocumentMeta from './hooks/useDocumentMeta'
import useReveal from './hooks/useReveal'
import useRouter from './hooks/useRouter'
import useStuck from './hooks/useStuck'
import useTheme from './hooks/useTheme'

const PAGES = {
  '/': HomePage,
  '/about': AboutPage,
  '/partners': PartnersPage,
  '/support/contact': ContactPage,
  '/support/faq': FaqPage,
  '/support/privacy': PrivacyPage,
  '/support/terms': TermsPage,
  '/support/account-deletion-request': AccountDeletionPage,
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const { ref: sentinelRef, isStuck } = useStuck()
  const path = useRouter()
  useDocumentMeta(path)
  useReveal(path)

  const Page = PAGES[path] ?? HomePage

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
        <Page />
      </main>

      <SiteFooter />
    </div>
  )
}
