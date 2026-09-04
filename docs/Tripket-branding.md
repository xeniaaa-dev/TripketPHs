# Tripket PH Branding & Hero Direction

## Brand idea

Tripket makes ferry and cargo travel around the Philippines feel clear, warm, and dependable. The visual tone should feel like the start of an island journey: optimistic, human, and transport-led rather than a generic travel marketplace.

## Reference implementation direction

Tripket PH is the same product, so its live experience and supplied reference are the approved source for the homepage hierarchy and visual language. Preserve these characteristics:

- Warm, sunlit Philippine maritime setting
- Creamy, translucent surfaces over a softly graded sea-and-sky photograph
- Large near-black sans-serif headlines with one meaningful Tripket-orange emphasis
- Calm, spacious composition that keeps booking as the primary action
- Rounded white navigation and controls, with restrained shadows and thin warm-gray borders

The approved page order is: maritime hero, clearly separate booking module, carrier proof, core booking/shipping services, three booking steps, testimonials, shipping-partner invitation, and a practical footer. Keep the live Tripket headline, ferry-and-cargo message, and navigation hierarchy aligned when updating this project.

## Core palette

| Token | Value | Use |
| --- | --- | --- |
| `--tripket-orange` | `#F45A16` | Primary CTA, important headline word, selected state, small transport accent |
| `--tripket-orange-dark` | `#C9460E` | CTA hover and active state |
| `--ink` | `#171717` | Headings, navigation, key content |
| `--ink-muted` | `#5F5A55` | Body copy and secondary labels |
| `--cream` | `#FFF8EE` | Primary light surface and page background |
| `--sand` | `#F6E6D2` | Soft supporting surface |
| `--peach` | `#F7C48B` | Atmospheric hero tint only |
| `--line-warm` | `#E4D6C6` | Borders and dividers |
| `--white` | `#FFFFFF` | High-contrast cards and navigation |

Use orange deliberately: one primary action per viewport should dominate. Do not introduce a competing blue or purple product palette.

## Typography

- Prefer a clean, modern grotesk sans-serif (for example Inter, Manrope, or a locally supplied equivalent) for headings and interface text.
- Headlines: tight letter spacing, near-black, bold but not extra-heavy; use generous scale and short line lengths.
- Body: 16px minimum, comfortable 1.5 line height, muted ink rather than low-contrast gray.
- Avoid decorative scripts, gradient text, excessive all caps, and more than two typefaces.

## Surface, shape, and interaction language

- Cards and navigation: off-white or white, 24-32px radius on large surfaces; 14-18px on fields and buttons.
- Borders: 1px warm neutral; shadows should be soft and low contrast.
- Buttons: orange filled primary CTA with dark/white accessible label; secondary actions are text links or quiet outlined controls.
- Icons: use a consistent SVG icon set, never emoji as interface icons.
- Interactive targets: at least 44px by 44px, keyboard-focusable, with a visible orange or near-black focus ring.
- Respect `prefers-reduced-motion`; transitions should be subtle and typically 150-250ms.

## Hero specification

**Asset:** `public/assets/tripket-ferry-hero-background.png`

The background was generated from the supplied reference's mood only. It contains a white passenger ferry with an orange hull accent at the far right, warm sunset water, and uncluttered left-side negative space for real HTML headline, supporting copy, and CTA.

- Place text on the left or center-left; do not place text over the ferry.
- Use a gentle cream/peach overlay only if required to guarantee contrast.
- Keep the hero image visually dominant and avoid UI-card clutter.
- Explicitly exclude itinerary cards and destination/place cards (such as Bohol, Boracay, or El Nido) from the hero.
- The booking interface belongs below the hero or as a clearly separate, accessible module—not as imagery baked into the background.

## Responsive and accessibility guardrails

- At mobile widths, retain the ferry as a cropped background detail and prioritize readable copy above it.
- Stack booking controls vertically on small screens; keep labels visible rather than relying on placeholders.
- Ensure text and controls meet 4.5:1 contrast where applicable, preserve keyboard focus, and provide semantic landmarks.

## Avoid

- Purple/blue AI gradients, glowing blobs, generic dashboards, or fake KPI cards
- Repeated card grids with no visual purpose
- Stock tropical scenery that competes with the ferry journey
- Finished-booking language: all demonstration output must be clearly marked as demo content
- App Store / Google Play badges unless real links are provided
