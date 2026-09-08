import { useCallback, useEffect, useState } from 'react'

const ENDPOINT = '/api/schedules'
/** Shorter than the proxy's own 8s upstream timeout, plus room for the hop. */
const CLIENT_TIMEOUT_MS = 10000

/**
 * Loads sailings from our own /api/schedules route.
 *
 * The browser never talks to the schedules API directly, so there is no API
 * host or credential in this file — just a same-origin path.
 *
 * There is no automatic retry. A failing upstream would otherwise get a
 * retry storm from every open tab, which is the opposite of protecting it;
 * the UI offers the visitor a retry button instead.
 */
export default function useSchedules({ date = 'today', pageLimit = 10 } = {}) {
  const [state, setState] = useState({ status: 'loading', schedules: [], error: null })
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => {
    setState({ status: 'loading', schedules: [], error: null })
    setAttempt((n) => n + 1)
  }, [])

  useEffect(() => {
    // AbortController is missing in some older mobile browsers; without it the
    // request simply cannot be cancelled, which is survivable.
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timer = controller ? setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS) : null
    let live = true

    async function load() {
      try {
        const query = new URLSearchParams({ date, pageLimit: String(pageLimit) })
        const response = await fetch(`${ENDPOINT}?${query}`, {
          headers: { Accept: 'application/json' },
          signal: controller?.signal,
        })

        // The proxy returns a JSON body with its own message on every path,
        // including 429 and 503, so the reason can be shown as-is.
        const payload = await response.json().catch(() => null)
        if (!live) return

        if (!response.ok) {
          setState({
            status: 'error',
            schedules: [],
            error: payload?.error ?? 'Schedules are unavailable right now.',
          })
          return
        }

        setState({
          status: 'ready',
          schedules: Array.isArray(payload?.schedules) ? payload.schedules : [],
          error: null,
        })
      } catch (error) {
        if (!live || error?.name === 'AbortError') return
        setState({
          status: 'error',
          schedules: [],
          error: 'Could not reach the schedule service.',
        })
      }
    }

    load()
    return () => {
      live = false
      if (timer) clearTimeout(timer)
      controller?.abort()
    }
  }, [date, pageLimit, attempt])

  return { ...state, retry }
}
