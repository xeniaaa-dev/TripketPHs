/**
 * The hero's wave motif, reused as a section rule so the page reads as one
 * authored system rather than a stack of tinted bands.
 */
export default function WaveRule({ flip = false }) {
  return (
    /* The frame clips the drift. Safari does not clip a transformed child
       against `body { overflow-x: hidden }` the way Chrome does, so the
       scroll-driven slide used to widen the document by 3% of the viewport. */
    <div className="wave-rule-frame" aria-hidden="true">
      <svg
        className={flip ? 'wave-rule is-flipped' : 'wave-rule'}
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path d="M0 24c180-20 360-20 540 0s360 20 540 0 240-15 360-5" />
        <path d="M0 38c180-20 360-20 540 0s360 20 540 0 240-15 360-5" />
      </svg>
    </div>
  )
}
