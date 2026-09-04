import Features from './components/Features'
import Header from './components/Header'
import Hero from './components/Hero'
import PartnerCta from './components/PartnerCta'
import PartnerMarquee from './components/PartnerMarquee'
import SiteFooter from './components/SiteFooter'
import Steps from './components/Steps'
import Testimonials from './components/Testimonials'
import WaveRule from './components/WaveRule'
import useReveal from './hooks/useReveal'
import useStuck from './hooks/useStuck'
import useTheme from './hooks/useTheme'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const { ref: sentinelRef, isStuck } = useStuck()
  useReveal()

  return (
    <div className="page" id="top">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <Header theme={theme} onToggleTheme={toggleTheme} isStuck={isStuck} />
      {/* Leaves the viewport as soon as the header starts covering content. */}
      <div className="scroll-sentinel" ref={sentinelRef} aria-hidden="true" />

      <main id="main-content">
        <Hero />
        <PartnerMarquee />
        <WaveRule />
        <Features />
        <Steps />
        <Testimonials />
        <PartnerCta />
      </main>

      <SiteFooter />
    </div>
  )
}
