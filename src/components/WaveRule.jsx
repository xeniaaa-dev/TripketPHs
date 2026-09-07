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
      {/* The viewBox is 56 units tall, not 48. Each path swings 15 units either
          side of its baseline, so the lower one reached y=53 and its middle
          hump was being cut off by a 48-unit box - the line looked broken
          rather than wavy. Baselines 21 and 35 leave an even 6 units of
          headroom top and bottom, so the flipped variant clips identically.
          The rule is still 48px tall in CSS; preserveAspectRatio="none"
          compresses the motif into it. */}
      <svg
        className={flip ? 'wave-rule is-flipped' : 'wave-rule'}
        viewBox="0 0 1440 56"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path d="M0 21c180-20 360-20 540 0s360 20 540 0 240-15 360-5" />
        <path d="M0 35c180-20 360-20 540 0s360 20 540 0 240-15 360-5" />
      </svg>
    </div>
  )
}
