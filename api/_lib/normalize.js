/**
 * Turns whatever the upstream returns into the one shape the UI renders.
 *
 * The response shape has not been seen yet, so each field tries the key names
 * this API's own conventions make likely — it uses `departure_ts`, so
 * snake_case first — and camelCase and nested `{ name }` objects as
 * alternatives. A field that is not found is simply absent, and the UI skips
 * what is absent rather than printing "undefined".
 *
 * Doing this here rather than in the browser has a second benefit: only these
 * keys ever cross to the client, so an upstream payload that happens to carry
 * internal or personal fields does not get forwarded by accident.
 *
 * When a real sample lands, correct the candidate lists below. Nothing else
 * has to change.
 */

/** First value at any of `paths` that is neither undefined, null nor ''. */
function pick(source, paths) {
  for (const path of paths) {
    let value = source
    for (const key of path.split('.')) {
      value = value?.[key]
      if (value === undefined || value === null) break
    }
    if (value === undefined || value === null) continue
    if (typeof value === 'string' && value.trim() === '') continue
    return value
  }
  return undefined
}

/** Ports and vessels may arrive as a string or as an object with a name. */
function asText(value) {
  if (value === undefined) return undefined
  if (typeof value === 'string') return value.trim() || undefined
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    const name = value.name ?? value.title ?? value.label ?? value.code
    return typeof name === 'string' ? name.trim() || undefined : undefined
  }
  return undefined
}

/**
 * A timestamp the browser can parse, as an ISO string. Accepts ISO already,
 * epoch seconds and epoch milliseconds — `_ts` suffixes are usually epochs,
 * and seconds vs milliseconds is decided by magnitude.
 */
function asInstant(value) {
  if (value === undefined) return undefined
  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    const n = Number(value)
    const ms = n < 1e11 ? n * 1000 : n
    const date = new Date(ms)
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
  }
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function asAmount(value) {
  if (value === undefined) return undefined
  const n = typeof value === 'number' ? value : Number(String(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : undefined
}

/** Finds the array of legs, wherever the payload keeps it. */
export function extractList(payload) {
  if (Array.isArray(payload)) return payload
  for (const path of ['data', 'data.data', 'schedules', 'legs', 'items', 'results', 'data.items']) {
    const value = path.split('.').reduce((acc, key) => acc?.[key], payload)
    if (Array.isArray(value)) return value
  }
  return []
}

export function normalizeLeg(leg, index) {
  if (!leg || typeof leg !== 'object') return null

  const origin = asText(
    pick(leg, ['origin_name', 'origin_port', 'origin', 'from_port', 'from', 'originName', 'origin.name']),
  )
  const destination = asText(
    pick(leg, [
      'destination_name',
      'destination_port',
      'destination',
      'to_port',
      'to',
      'destinationName',
      'destination.name',
    ]),
  )
  const departsAt = asInstant(
    pick(leg, ['departure_ts', 'departure_time', 'departs_at', 'departure', 'etd', 'departureTs']),
  )
  const arrivesAt = asInstant(
    pick(leg, ['arrival_ts', 'arrival_time', 'arrives_at', 'arrival', 'eta', 'arrivalTs']),
  )
  const vessel = asText(pick(leg, ['vessel_name', 'vessel', 'ship_name', 'ship', 'vessel.name']))
  const operator = asText(
    pick(leg, [
      'shipping_line_name',
      'shipping_line',
      'operator',
      'carrier',
      'shippingLine.name',
      'operator.name',
    ]),
  )
  const fare = asAmount(pick(leg, ['price', 'fare', 'base_fare', 'min_price', 'amount']))
  const currency = asText(pick(leg, ['currency', 'currency_code', 'currencyCode'])) ?? 'PHP'
  const seatsAvailable = asAmount(
    pick(leg, ['seats_available', 'available_seats', 'slots_available', 'capacity_remaining']),
  )

  // A row with neither endpoint nor a departure time has nothing to show.
  if (!origin && !destination && !departsAt) return null

  const id = asText(pick(leg, ['id', 'leg_id', 'uuid', 'code'])) ?? `leg-${index}`

  return {
    id,
    origin,
    destination,
    departsAt,
    arrivesAt,
    vessel,
    operator,
    ...(fare !== undefined ? { fare, currency } : {}),
    ...(seatsAvailable !== undefined ? { seatsAvailable } : {}),
  }
}

export function normalizeSchedules(payload, limit = 10) {
  return extractList(payload)
    .slice(0, limit)
    .map(normalizeLeg)
    .filter(Boolean)
}
