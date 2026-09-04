import { useId, useState } from 'react'
import { ArrowRight, BriefcaseBusiness, CalendarDays, Search, UsersRound } from 'lucide-react'
import { PORTS } from '../data/content'

const today = new Date().toISOString().slice(0, 10)

function PortField({ id, label, value, onChange }) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} name={id} autoComplete="off" value={value} onChange={onChange}>
        {PORTS.map((port) => <option key={port}>{port}</option>)}
      </select>
    </label>
  )
}

export default function BookingPanel() {
  const instanceId = useId()
  const [mode, setMode] = useState('passenger')
  const [from, setFrom] = useState('Manila')
  const [to, setTo] = useState('Caticlan')
  const [date, setDate] = useState(today)
  const [passengers, setPassengers] = useState('2')
  const [cargoType, setCargoType] = useState('General cargo')
  const [result, setResult] = useState('')

  const isPassenger = mode === 'passenger'
  const panelId = `${instanceId}-${mode}-panel`

  function handleSubmit(event) {
    event.preventDefault()
    const detail = isPassenger ? `${passengers} passenger${passengers === '1' ? '' : 's'}` : cargoType.toLowerCase()
    setResult(`Demo route preview: ${from} to ${to} on ${date} for ${detail}. Live availability is not shown.`)
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setResult('')
  }

  return (
    <section className="booking-panel" id="book" aria-labelledby="booking-heading">
      <div className="booking-topline">
        <div>
          <p className="eyebrow">Plan your crossing</p>
          <h2 id="booking-heading">Where are you headed?</h2>
        </div>
        <span className="demo-chip">Demo trip planner</span>
      </div>
      <div className="booking-tabs" role="tablist" aria-label="Booking type">
        <button id={`${instanceId}-passenger-tab`} type="button" role="tab" aria-selected={isPassenger} aria-controls={panelId} tabIndex={isPassenger ? 0 : -1} onClick={() => switchMode('passenger')}>
          <UsersRound aria-hidden="true" /> Passenger
        </button>
        <button id={`${instanceId}-cargo-tab`} type="button" role="tab" aria-selected={!isPassenger} aria-controls={panelId} tabIndex={isPassenger ? -1 : 0} onClick={() => switchMode('cargo')}>
          <BriefcaseBusiness aria-hidden="true" /> Cargo
        </button>
      </div>
      <form id={panelId} role="tabpanel" aria-labelledby={`${instanceId}-${mode}-tab`} onSubmit={handleSubmit}>
        <div className="booking-fields">
          <PortField id={`${instanceId}-from`} label="From" value={from} onChange={(event) => setFrom(event.target.value)} />
          <PortField id={`${instanceId}-to`} label="To" value={to} onChange={(event) => setTo(event.target.value)} />
          <label className="field" htmlFor={`${instanceId}-date`}>
            <span>{isPassenger ? 'Departure date' : 'Pickup date'}</span>
            <span className="field-input-icon"><CalendarDays aria-hidden="true" /><input id={`${instanceId}-date`} name="travel-date" autoComplete="off" type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} /></span>
          </label>
          {isPassenger ? (
            <label className="field" htmlFor={`${instanceId}-passengers`}>
              <span>Passengers</span>
              <select id={`${instanceId}-passengers`} name="passengers" autoComplete="off" value={passengers} onChange={(event) => setPassengers(event.target.value)}>
                {[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'passenger' : 'passengers'}</option>)}
              </select>
            </label>
          ) : (
            <label className="field" htmlFor={`${instanceId}-cargo-type`}>
              <span>Cargo type</span>
              <select id={`${instanceId}-cargo-type`} name="cargo-type" autoComplete="off" value={cargoType} onChange={(event) => setCargoType(event.target.value)}>
                <option>General cargo</option><option>Vehicle</option><option>Refrigerated goods</option><option>Business freight</option>
              </select>
            </label>
          )}
          <button className="button button-primary search-button" type="submit"><Search aria-hidden="true" /> {isPassenger ? 'Search routes' : 'Check cargo options'}</button>
        </div>
      </form>
      <p className="booking-note">Tripket is currently showing a demonstration only. Confirm schedules with your carrier.</p>
      {result && <p className="demo-result" role="status">{result}<ArrowRight aria-hidden="true" /></p>}
    </section>
  )
}
