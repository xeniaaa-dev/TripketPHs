import Features from '../components/Features'
import Hero from '../components/Hero'
import PartnerCta from '../components/PartnerCta'
import PartnerMarquee from '../components/PartnerMarquee'
import Schedule from '../components/Schedule'
import Steps from '../components/Steps'
import Testimonials from '../components/Testimonials'
import WaveRule from '../components/WaveRule'

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* Empty for now — the schedule feed is still being designed. */}
      <Schedule />
      <WaveRule />
      <Features />
      <Steps />
      <Testimonials />
      {/* The carrier logos now close the page, directly under the partner
          pitch they belong with, rather than opening it under the hero. */}
      <PartnerCta />
      <PartnerMarquee />
    </>
  )
}
