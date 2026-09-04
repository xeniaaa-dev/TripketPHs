import Features from '../components/Features'
import Hero from '../components/Hero'
import PartnerCta from '../components/PartnerCta'
import PartnerMarquee from '../components/PartnerMarquee'
import Steps from '../components/Steps'
import Testimonials from '../components/Testimonials'
import WaveRule from '../components/WaveRule'

export default function HomePage() {
  return (
    <>
      <Hero />
      <PartnerMarquee />
      <WaveRule />
      <Features />
      <Steps />
      <Testimonials />
      <PartnerCta />
    </>
  )
}
