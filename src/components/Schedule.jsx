import { AlertCircle, ArrowRight, Clock, Ship } from 'lucide-react'
import useSchedules from '../hooks/useSchedules'
import { ROUTES, SCHEDULES, SECTION_LABELS } from '../data/content'

/**
 * Times are shown in Philippine Standard Time whatever the visitor's own
 * timezone is: a Cebu departure at 06:00 must read 06:00 in Manila, London
 * and anywhere else, because that is what the ticket says.
 */
const TIME = new Intl.DateTimeFormat('en-PH', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila',
})

function formatTime(instant) {
  if (!instant) return null
  const date = new Date(instant)
  return Number.isNaN(date.getTime()) ? null : TIME.format(date)
}

function formatFare(fare, currency) {
  if (typeof fare !== 'number') return null
  try {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency || 'PHP',
      maximumFractionDigits: 0,
    }).format(fare)
  } catch {
    // An unrecognised currency code should not take the whole row down.
    return `${currency ?? ''} ${Math.round(fare)}`.trim()
  }
}

/* Every field is optional: the API's exact shape is not pinned down yet, so
   anything the normaliser could not find is left out rather than rendered as
   an empty row. */
function Sailing({ leg }) {
  const departs = formatTime(leg.departsAt)
  const arrives = formatTime(leg.arrivesAt)
  const fare = formatFare(leg.fare, leg.currency)

  return (
    <li className="sailing">
      <p className="sailing-route">
        {leg.origin ?? 'Origin'}
        <span aria-hidden="true"> → </span>
        <span className="visually-hidden"> to </span>
        {leg.destination ?? 'Destination'}
      </p>

      {departs ? (
        <p className="sailing-time">
          <Clock aria-hidden="true" />
          <span>
            <time dateTime={leg.departsAt}>{departs}</time>
            {arrives ? (
              <>
                <span aria-hidden="true"> – </span>
                <span className="visually-hidden"> arriving </span>
                <time dateTime={leg.arrivesAt}>{arrives}</time>
              </>
            ) : null}
          </span>
        </p>
      ) : null}

      {leg.vessel || leg.operator ? (
        <p className="sailing-vessel">
          <Ship aria-hidden="true" />
          <span>{[leg.vessel, leg.operator].filter(Boolean).join(' · ')}</span>
        </p>
      ) : null}

      <p className="sailing-meta">
        {fare ? <span className="sailing-fare">{fare}</span> : null}
        {typeof leg.seatsAvailable === 'number' ? (
          <span className="sailing-seats">{leg.seatsAvailable} seats left</span>
        ) : null}
      </p>
    </li>
  )
}

export default function Schedule() {
  const { status, schedules, error, retry } = useSchedules({ date: 'today', pageLimit: 10 })

  return (
    <section className="schedule" id="schedule" aria-labelledby="schedule-heading">
      <div className="container">
        <div className="section-head is-centered" data-reveal>
          <p className="eyebrow">{SECTION_LABELS.schedules}</p>
          <h2 id="schedule-heading">
            {SCHEDULES.headlineLead}
            <span className="accent">{SCHEDULES.headlineAccent}</span>
          </h2>
          <p className="section-lede">{SCHEDULES.lede}</p>
        </div>

        {/* One live region for the whole panel, so a screen reader is told once
            that sailings loaded rather than once per row. */}
        <div className="schedule-panel" aria-live="polite" aria-busy={status === 'loading'}>
          {status === 'loading' ? (
            <>
              <p className="visually-hidden">{SCHEDULES.loading}</p>
              <ul className="sailing-grid" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5].map((key) => (
                  <li className="sailing is-skeleton" key={key} />
                ))}
              </ul>
            </>
          ) : null}

          {status === 'error' ? (
            <p className="schedule-notice is-error">
              <AlertCircle aria-hidden="true" />
              <span>{error}</span>
              <button type="button" className="button button-quiet" onClick={retry}>
                {SCHEDULES.errorRetry}
              </button>
            </p>
          ) : null}

          {status === 'ready' && schedules.length === 0 ? (
            <p className="schedule-notice">
              <span>{SCHEDULES.empty}</span>
              <a className="button button-quiet" href={ROUTES.book}>
                {SCHEDULES.emptyCta}
                <ArrowRight aria-hidden="true" />
              </a>
            </p>
          ) : null}

          {status === 'ready' && schedules.length > 0 ? (
            <ul className="sailing-grid">
              {schedules.map((leg) => (
                <Sailing key={leg.id} leg={leg} />
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  )
}
