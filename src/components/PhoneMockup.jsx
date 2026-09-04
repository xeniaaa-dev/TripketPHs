import { CheckCircle2, MapPin, ShipWheel } from 'lucide-react'

export default function PhoneMockup() {
  return (
    <div className="phone-wrap" aria-hidden="true">
      <div className="phone-mockup">
        <div className="phone-notch" />
        <div className="phone-screen">
          <div className="phone-header"><span className="mini-logo"><ShipWheel /></span><span>Tripket</span><span className="phone-avatar" /></div>
          <p className="phone-greeting">Good morning, Ana</p>
          <section className="phone-route-card"><span className="route-label">NEXT CROSSING</span><strong>Manila <span>→</span> Caticlan</strong><p>Fri, 24 May · 8:00 AM</p><div><MapPin /> Pier 4, North Harbor</div></section>
          <div className="phone-ticket"><CheckCircle2 /><div><strong>You're all set</strong><span>Keep your boarding details ready.</span></div></div>
          <div className="phone-nav"><span className="active-dot" /><span /><span /><span /></div>
        </div>
      </div>
      <span className="phone-orbit phone-orbit-one" /><span className="phone-orbit phone-orbit-two" />
    </div>
  )
}
