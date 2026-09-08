/**
 * Placeholder for the sailing schedule, which will be pulled from the Tripket
 * web app and rendered here.
 *
 * It renders nothing visible on purpose. The design is still open, and
 * reserving vertical space in the meantime would read as an unexplained gap
 * between the hero and the section rule below it.
 *
 * When the design lands, put the content inside this section and give it an
 * `aria-labelledby` pointing at its own heading. It carries no accessible
 * name yet deliberately: a named <section> becomes a landmark, and an empty
 * landmark is worse for a screen reader than no landmark at all.
 */
export default function Schedule() {
  return <section className="schedule" id="schedule" />
}
