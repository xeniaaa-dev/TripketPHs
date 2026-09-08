import Features from '../components/Features'
import Hero from '../components/Hero'
import PartnerCta from '../components/PartnerCta'
import Schedule from '../components/Schedule'
import Steps from '../components/Steps'
import Testimonials from '../components/Testimonials'
import WaveRule from '../components/WaveRule'

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* Live sailings, fetched through our own /api/schedules proxy. */}
      <Schedule />
      <WaveRule />
      <Features />
      <Steps />
      <Testimonials />
      {/* The carrier logos are part of PartnerCta now, inside the same dark
          band as the pitch they support. */}
      <PartnerCta />
    </>
  )
}
