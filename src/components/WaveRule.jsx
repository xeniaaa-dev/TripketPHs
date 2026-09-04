/**
 * The hero's wave motif, reused as a section rule so the page reads as one
 * authored system rather than a stack of tinted bands.
 */
export default function WaveRule({ flip = false }) {
  return (
    <svg
      className={flip ? 'wave-rule is-flipped' : 'wave-rule'}
      viewBox="0 0 1440 48"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M0 24c180-20 360-20 540 0s360 20 540 0 240-15 360-5" />
      <path d="M0 38c180-20 360-20 540 0s360 20 540 0 240-15 360-5" />
    </svg>
  )
}
