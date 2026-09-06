import '@testing-library/jest-dom/vitest'

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
