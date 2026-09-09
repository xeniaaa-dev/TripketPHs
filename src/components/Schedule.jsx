import { useMemo, useState } from 'react'
import { AlertCircle, ArrowRight, Clock, Ship } from 'lucide-react'
import useSchedules from '../hooks/useSchedules'
import { CARRIER_LOGOS, ROUTES, SCHEDULES, SECTION_LABELS } from '../data/content'

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

/**
 * Asked of the proxy, which clamps at the upstream's own ceiling of 100.
 * Deliberately far more than are shown, for two reasons: the filter can only
 * offer a line it has actually seen, and the quieter carriers sail late —
 * Cokaliong has one leg in a hundred — and each card now states how many
 * times its route runs, which is only true if we hold most of the day.
 */
const FETCH_LIMIT = 100

/**
 * Route cards rendered at once. The rest of the day lives in the web app,
 * which the "See all departures" link below the grid points at.
 */
const VISIBLE_LIMIT = 4

/**
 * Departure times printed on a card before the rest become "+N more". The
 * Cebu–Tagbilaran shuttle runs fourteen times a day; listing all of them would
 * make one card several times taller than its neighbours.
 */
const TIMES_SHOWN = 6

const ALL = 'all'

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

/**
 * One card per route, listing every time that route runs — rather than one
 * card per departure, which put the same origin, destination, vessel and
 * carrier photograph on screen up to fourteen times over.
 *
 * Grouped on the vessel as well as the route and carrier, so the one case in
 * today's data where a line runs two ships on the same crossing
 * (Bacolod–Iloilo, by Oceanjet and SS Fixed) stays two cards. They are
 * materially different sailings and merging them would hide one.
 *
 * Order is the upstream's: groups appear by their earliest departure, so the
 * grid still reads as what is leaving next.
 */
function groupByRoute(schedules) {
  const groups = new Map()

  for (const leg of schedules) {
    const key = [leg.origin ?? '', leg.destination ?? '', leg.vessel ?? '', leg.operator ?? ''].join('|')
    const group = groups.get(key)
    if (group) {
      group.legs.push(leg)
    } else {
      groups.set(key, { key, id: leg.id, legs: [leg] })
    }
  }

  return [...groups.values()]
}

/* Every field is optional: the API's exact shape is not pinned down yet, so
   anything the normaliser could not find is left out rather than rendered as
   an empty row. */
function RouteCard({ group }) {
  const [first] = group.legs
  /* The carrier's own photography and logo out of this project's assets,
     matched on the code the API sends. A carrier we do not stock gets the
     plain crest below rather than a broken image or a ragged grid. */
  const carrier = first.operatorCode ? CARRIER_LOGOS[first.operatorCode] : undefined

  const times = group.legs
    .filter((leg) => leg.departsAt)
    .map((leg) => ({ iso: leg.departsAt, label: formatTime(leg.departsAt) }))
    .filter((time) => time.label)
  const shown = times.slice(0, TIMES_SHOWN)
  const hidden = times.length - shown.length

  /* Across several departures the fare is a "from", and seats are per
     departure so there is no honest way to show one number for the group. */
  const fares = group.legs.map((leg) => leg.fare).filter((fare) => typeof fare === 'number')
  const fare = fares.length ? formatFare(Math.min(...fares), first.currency) : null
  const seats = group.legs.length === 1 ? first.seatsAvailable : undefined

  return (
    <li className="sailing">
      <article className="sailing-card">
        {carrier ? (
          <div className="sailing-media">
            {/* Decorative, and alt="" specifically rather than the vessel's
                name: this is a photograph of one of the line's ships, not
                necessarily the vessel working this route, and labelling it
                would assert something the API never said. */}
            <img src={carrier.ship} alt="" loading="lazy" decoding="async" />
            <span className="sailing-logo">
              <img src={carrier.src} alt="" loading="lazy" decoding="async" />
            </span>
          </div>
        ) : (
          <div className="sailing-media is-blank">
            <Ship aria-hidden="true" />
          </div>
        )}

        <div className="sailing-body">
          <h3 className="sailing-route">
            {first.origin ?? 'Origin'}
            <span aria-hidden="true"> → </span>
            <span className="visually-hidden"> to </span>
            {first.destination ?? 'Destination'}
          </h3>

          {first.vessel || first.operator ? (
            <p className="sailing-vessel">
              <Ship aria-hidden="true" />
              <span>{[first.vessel, first.operator].filter(Boolean).join(' · ')}</span>
            </p>
          ) : null}

          {shown.length ? (
            <p className="sailing-times">
              <Clock aria-hidden="true" />
              <span className="visually-hidden">
                {group.legs.length > 1 ? `${times.length} departures: ` : 'Departs '}
              </span>
              {shown.map((time) => (
                <time className="sailing-chip" dateTime={time.iso} key={time.iso}>
                  {time.label}
                </time>
              ))}
              {hidden > 0 ? <span className="sailing-chip is-more">+{hidden} more</span> : null}
            </p>
          ) : null}

          <p className="sailing-meta">
            {fare ? (
              <span className="sailing-fare">
                {group.legs.length > 1 ? <span className="sailing-from">from </span> : null}
                {fare}
              </span>
            ) : null}
            {typeof seats === 'number' ? <span className="sailing-seats">{seats} seats left</span> : null}
          </p>
        </div>
      </article>
    </li>
  )
}

/**
 * The lines present in what the API returned, busiest first — not a hardcoded
 * list. A carrier that is not sailing today gets no chip, so the filter can
 * never offer a choice that leads to an empty grid.
 */
function countLines(schedules) {
  const byCode = new Map()

  for (const leg of schedules) {
    const code = leg.operatorCode
    if (!code) continue
    const seen = byCode.get(code)
    if (seen) {
      seen.count += 1
    } else {
      byCode.set(code, {
        code,
        // Our own spelling where we have it: the API sends "Oceanjet" and
        // "HS Star Marine Shipping Corp", which sit awkwardly next to the
        // rest of the page.
        name: CARRIER_LOGOS[code]?.name ?? leg.operator ?? code,
        count: 1,
      })
    }
  }

  return [...byCode.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export default function Schedule() {
  const { status, schedules, error, retry } = useSchedules({
    date: 'today',
    pageLimit: FETCH_LIMIT,
  })
  const [selected, setSelected] = useState(ALL)

  const lines = useMemo(() => countLines(schedules), [schedules])

  /* Read through what is actually available rather than trusted directly, so
     a selection that no longer exists in the data resolves to "all lines"
     during the same render instead of filtering the grid to nothing.
     Defensive today: the only refetch is the manual retry, which is reachable
     only from the error state, so a selection cannot currently outlive the
     data it was made against. It becomes load-bearing the moment this section
     gains a date switcher or refreshes on a timer — and costs nothing now. */
  const active = lines.some((line) => line.code === selected) ? selected : ALL
  const activeName = lines.find((line) => line.code === active)?.name

  /* Keyed on the selection rather than on the filtered array: that array is
     rebuilt every render, so a memo depending on it would never hit. */
  const { routes, sailings } = useMemo(() => {
    const matching = active === ALL ? schedules : schedules.filter((leg) => leg.operatorCode === active)
    return { routes: groupByRoute(matching), sailings: matching.length }
  }, [schedules, active])

  const visible = routes.slice(0, VISIBLE_LIMIT)

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

        {/* Only once there is something to filter: chips over a failed or empty
            request would be controls that do nothing. */}
        {status === 'ready' && lines.length > 1 ? (
          <div className="schedule-filter">
            <div className="filter-chips" role="group" aria-label={SCHEDULES.filterLabel}>
              <button
                type="button"
                className={active === ALL ? 'filter-chip is-on' : 'filter-chip'}
                aria-pressed={active === ALL}
                onClick={() => setSelected(ALL)}
              >
                {SCHEDULES.filterAll}
                <span className="filter-count">{schedules.length}</span>
              </button>

              {lines.map((line) => (
                <button
                  key={line.code}
                  type="button"
                  className={active === line.code ? 'filter-chip is-on' : 'filter-chip'}
                  aria-pressed={active === line.code}
                  onClick={() => setSelected(line.code)}
                >
                  {CARRIER_LOGOS[line.code] ? (
                    <img
                      className="filter-chip-logo"
                      src={CARRIER_LOGOS[line.code].src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                  {line.name}
                  <span className="filter-count">{line.count}</span>
                </button>
              ))}
            </div>

            {/* Its own live region, separate from the grid below: the count is
                the confirmation that a chip did something, and it is far
                shorter to hear than eight re-announced cards. */}
            <p className="filter-status" role="status" aria-live="polite">
              {active === ALL
                ? SCHEDULES.showingAll(visible.length, routes.length, sailings)
                : SCHEDULES.showingLine(visible.length, routes.length, sailings, activeName)}
            </p>
          </div>
        ) : null}

        {/* One live region for the whole panel, so a screen reader is told once
            that sailings loaded rather than once per row. */}
        <div className="schedule-panel" aria-live="polite" aria-busy={status === 'loading'}>
          {status === 'loading' ? (
            <>
              <p className="visually-hidden">{SCHEDULES.loading}</p>
              <ul className="sailing-grid" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((key) => (
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

          {status === 'ready' && visible.length > 0 ? (
            <>
              <ul className="sailing-grid">
                {visible.map((group) => (
                  <RouteCard key={group.key} group={group} />
                ))}
              </ul>

              {/* Quiet, not filled: the sticky header already carries the one
                  orange Book Now, and a second filled button in the same
                  viewport would compete with it. */}
              <p className="schedule-more">
                <a className="button button-quiet" href={ROUTES.schedule}>
                  {SCHEDULES.seeMore}
                  <ArrowRight aria-hidden="true" />
                </a>
              </p>
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}
