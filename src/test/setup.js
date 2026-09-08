import '@testing-library/jest-dom/vitest'
import { beforeEach, vi } from 'vitest'

// The schedule section fetches on mount. Without a stub, every test that
// renders the home page would make a real request to a relative URL, which in
// jsdom means an actual connection attempt to localhost — slow, and flaky
// depending on whether anything happens to be listening. The default answer is
// an empty, successful payload; tests that care about a specific state install
// their own mock over the top.
beforeEach(() => {
  // Reset first: vi.spyOn hands back the existing spy when a function is
  // already spied, so without this the call history accumulates across every
  // test in a file and per-test call counts are meaningless.
  const fetchSpy = vi.spyOn(globalThis, 'fetch')
  fetchSpy.mockReset()
  fetchSpy.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ date: 'today', count: 0, schedules: [] }),
  })
})

// jsdom ships no matchMedia; the theme hook reads it for the system preference.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}

// Node 26 defines its own disabled `localStorage` global, which shadows the one
// jsdom installs and leaves `window.localStorage` undefined. The theme hook
// reads and writes it, so tests get an in-memory stand-in.
if (!window.localStorage) {
  const store = new Map()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      get length() {
        return store.size
      },
      key: (index) => [...store.keys()][index] ?? null,
      getItem: (key) => (store.has(String(key)) ? store.get(String(key)) : null),
      setItem: (key, value) => store.set(String(key), String(value)),
      removeItem: (key) => store.delete(String(key)),
      clear: () => store.clear(),
    },
  })
}

// jsdom has no layout, so scrollTo is unimplemented and logs a noisy
// "Not implemented" warning every time the router resets the scroll position.
if (!window.scrollTo || !window.scrollTo._stubbed) {
  const stub = () => {}
  stub._stubbed = true
  window.scrollTo = stub
}

// jsdom has no layout engine and so no ResizeObserver; the carousel observes
// its track to re-measure how many pages it has.
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
