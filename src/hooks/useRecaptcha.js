import { useCallback, useEffect, useState } from 'react'

/**
 * Loads reCAPTCHA v3 and mints a token per submission.
 *
 * The site key is public by design — every reCAPTCHA site ships it in the
 * markup — so this is the one value in the project that *should* carry the
 * VITE_ prefix and be inlined into the bundle. What stops someone using ours
 * is the domain list in the reCAPTCHA console plus the server-side check, not
 * secrecy. The secret key is a different thing entirely and never appears in
 * this directory.
 *
 * A token is minted at submit time, not on mount, for two reasons: it expires
 * two minutes after it is issued, and a fresh one is needed for every attempt
 * because verification consumes it. Reusing a token after a failed submission
 * guarantees a second failure.
 */

const SCRIPT_ID = 'recaptcha-v3'
const LOAD_TIMEOUT_MS = 10_000

/** Shared across every mount, so the script is fetched once per page load. */
let loader = null

function siteKey() {
  // Read at call time rather than at module scope, so a test can stub it.
  return import.meta.env.VITE_RECAPTCHA_SITE_KEY
}

/**
 * Resolves once `window.grecaptcha` is ready to use.
 *
 * An already-present `grecaptcha` short-circuits the whole thing. That covers
 * a second mount, and it is also the seam a test uses to supply its own.
 */
function loadRecaptcha(key) {
  if (typeof window === 'undefined') return Promise.reject(new Error('no-window'))
  if (window.grecaptcha?.execute) return Promise.resolve(window.grecaptcha)
  if (loader) return loader

  loader = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID)
    const script = existing ?? document.createElement('script')

    // A blocked script never fires either handler in some browsers, so the
    // wait is bounded rather than left to hang the submit button forever.
    const timer = setTimeout(() => reject(new Error('recaptcha-load-timeout')), LOAD_TIMEOUT_MS)

    script.addEventListener('load', () => {
      clearTimeout(timer)
      // `ready` waits for the library to finish its own setup; calling
      // `execute` before that throws.
      if (window.grecaptcha?.ready) {
        window.grecaptcha.ready(() => resolve(window.grecaptcha))
      } else {
        reject(new Error('recaptcha-loaded-without-api'))
      }
    })
    script.addEventListener('error', () => {
      clearTimeout(timer)
      reject(new Error('recaptcha-blocked'))
    })

    if (!existing) {
      script.id = SCRIPT_ID
      script.async = true
      script.defer = true
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(key)}`
      document.head.appendChild(script)
    }
  }).catch((error) => {
    // Clear the cache so a later attempt can retry, rather than every submit
    // inheriting one bad load for the life of the page.
    loader = null
    throw error
  })

  return loader
}

export default function useRecaptcha(action) {
  const key = siteKey()
  const [blocked, setBlocked] = useState(false)

  /**
   * No key means the build was deployed without VITE_RECAPTCHA_SITE_KEY. The
   * form falls back to email in that case rather than breaking, but this is a
   * misconfiguration and not something to swallow quietly — the note tells
   * the visitor and this tells whoever is looking at the console.
   */
  useEffect(() => {
    if (!key) {
      console.warn('VITE_RECAPTCHA_SITE_KEY is not set; the contact form will fall back to email.')
    }
  }, [key])

  /** Warms the script up on mount, so the first submit is not also the first
   *  network round trip. Failure here is not reported: `execute` reports it. */
  useEffect(() => {
    if (!key) return
    let live = true
    loadRecaptcha(key).catch(() => {
      if (live) setBlocked(true)
    })
    return () => {
      live = false
    }
  }, [key])

  const execute = useCallback(async () => {
    if (!key) throw new Error('recaptcha-unconfigured')
    const grecaptcha = await loadRecaptcha(key)
    const token = await grecaptcha.execute(key, { action })
    if (!token) throw new Error('recaptcha-empty-token')
    return token
  }, [key, action])

  return { configured: Boolean(key), blocked, execute }
}

export { LOAD_TIMEOUT_MS, SCRIPT_ID }
