/**
 * Query-parameter allowlist for the schedules proxy.
 *
 * Nothing the caller sends is forwarded verbatim. Every value is matched
 * against a fixed set or coerced into a bounded number, and anything that
 * fails falls back to the default rather than being passed through. That is
 * what stops a caller steering the upstream request — the host and path are
 * fixed in the handler, and these four values are the only variables.
 */

const DATES = ['yesterday', 'today', 'tomorrow']
const SORT_COLUMNS = ['departure_ts', 'arrival_ts', 'price']
const SORT_DIRECTIONS = ['asc', 'desc']

export const PAGE_LIMIT_MIN = 1
/**
 * The upstream's own ceiling — it answers 422 ("The page limit field must not
 * be greater than 100") above this, so asking for more can only ever produce
 * an error. Clamping to the same number means a caller cannot make us send a
 * request that is guaranteed to fail, and cannot ask for more than one page of
 * the upstream's data in one go either.
 */
export const PAGE_LIMIT_MAX = 100
export const PAGE_LIMIT_DEFAULT = 10

/** One member of `allowed`, or `fallback`. Never the caller's own string. */
function oneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback
}

export function sanitizeParams(query = {}) {
  // A repeated param arrives as an array; take the first and ignore the rest
  // so `?date=today&date=../../etc` cannot smuggle a second value through.
  const first = (value) => (Array.isArray(value) ? value[0] : value)

  const rawLimit = Number.parseInt(first(query.pageLimit), 10)
  const pageLimit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, PAGE_LIMIT_MIN), PAGE_LIMIT_MAX)
    : PAGE_LIMIT_DEFAULT

  return {
    date: oneOf(first(query.date), DATES, 'today'),
    sortColumn: oneOf(first(query.sortColumn), SORT_COLUMNS, 'departure_ts'),
    sortDirection: oneOf(first(query.sortDirection), SORT_DIRECTIONS, 'asc'),
    pageLimit,
  }
}

export { DATES, SORT_COLUMNS, SORT_DIRECTIONS }
