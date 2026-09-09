import Features from '../components/Features'
import Hero from '../components/Hero'
import PartnerCta from '../components/PartnerCta'
import Schedule from '../components/Schedule'
import Steps from '../components/Steps'
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
      {/* "Why travellers stay" sits here when it is shown. Hidden for now
          rather than deleted: Testimonials.jsx, its styles and the TESTIMONIALS
          copy are all untouched, so restoring it is re-adding the import and
          <Testimonials /> on this line. */}
      {/* The carrier logos are part of PartnerCta now, inside the same dark
          band as the pitch they support. */}
      <PartnerCta />
    </>
  )
}
