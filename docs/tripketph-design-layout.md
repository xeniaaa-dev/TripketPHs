# Tripket PH — Design & Layout Documentation

> Structural and UX reference derived from https://tripketph.com/
> Branding elements (logo, color palette, wordmark, brand imagery) intentionally excluded — this document covers layout, structure, and interaction patterns only.

---

## 1. Page Structure Overview

The homepage follows a single-column, vertically-scrolling landing page pattern common to marketplace/booking platforms, composed of these stacked sections in order:

1. Header / Navigation bar
2. Hero section
3. Trust bar (partner logo strip)
4. Features grid
5. "How it works" step-by-step section
6. Testimonials section
7. Partner CTA (call-to-action) banner
8. Footer

---

## 2. Section-by-Section Breakdown

### 2.1 Header
- Fixed/top navigation bar
- Contains site logo/wordmark (left-aligned, per convention)
- Minimal nav — no visible multi-item menu captured in the crawl, suggesting a lightweight header, likely with a hamburger menu on mobile or a simple "Download App" CTA

### 2.2 Hero Section
- Large headline framing the value proposition ("Your ticket to easier, more convenient travel in the Philippines")
- Supporting subtext (one sentence, descriptive of the platform's dual function: ticket + cargo booking)
- **Dual CTA buttons**, side by side:
  - Primary: "Download App"
  - Secondary: "Learn More" (anchor-scrolls to the `#features` section)
- This is a classic hero pattern: headline → subtext → primary/secondary button pair

### 2.3 Trust Bar (Logo Carousel)
- Horizontal, auto-scrolling/looping logo strip
- Heading: "Trusted by leading Philippine shipping lines"
- Logos repeat in sequence (the same ~15 logos loop 3x in the raw markup), indicating an infinite-scroll marquee/carousel component rather than a static grid
- Each logo is a simple image + accessible alt-text label (company name)
- Pattern: social-proof strip, common right below the hero

### 2.4 Features Grid
- Section heading + one-line description ("Everything you need to book and ship")
- **6-item icon-grid layout**, likely arranged as a 3-column x 2-row (desktop) or stacked (mobile) grid:
  1. Online Payments
  2. Ticket Booking
  3. 24/7 Support
  4. Customized Routes
  5. Cargo Shipping
  6. Real-time Schedules
- Each item follows a consistent card pattern: icon (implied, not in text markup) + short title + one-sentence description
- This is the `#features` anchor target referenced by the hero's "Learn More" button

### 2.5 "How It Works" Section
- Heading: "Book your trip in 3 easy steps"
- Subtext: one-line supporting copy
- **3-step horizontal process flow** (likely with connecting lines/arrows or numbered badges on desktop, stacked vertically on mobile):
  1. Search Routes
  2. Choose & Book
  3. Travel with Ease
- Each step: short title + 1-sentence explanation
- Note: raw markup includes a stray "Step 2 of 0" string — likely a leftover from a JS-driven step indicator/progress component (possibly a bug or dynamically rendered element not fully captured in the static crawl)

### 2.6 Testimonials Section
- Heading: "Loved by travelers across the Philippines"
- Subtext: one-line framing
- **3-card testimonial layout**, each card containing:
  - Quote (1 sentence)
  - Avatar photo (circular, per the `pravatar.cc` placeholder pattern used)
  - Name
  - Location (city)
- Testimonials represent different personas/use cases: a passenger, a cargo shipper, and an island-hopper — deliberately varied to cover both product lines (tickets + cargo)

### 2.7 Partner CTA Banner
- Standalone conversion-focused band, distinct from the main features section
- Heading: "Join Tripket PH as a shipping partner"
- Subtext: value proposition aimed at B2B (shipping lines), not end consumers
- Dual CTA buttons: "Partner With Us" (primary) and "Learn More" (secondary, links to About page)
- Pattern: B2C site with an embedded B2B acquisition funnel

### 2.8 Footer
- Multi-column layout:
  - **Column 1**: Logo/wordmark + one-line site description (repeated from hero context)
  - **Column 2 — "Company"**: About Us, Partners, Get the App
  - **Column 3 — "Help & Support"**: Contact Us, FAQ, Privacy Policy, Terms of Service, Account Deletion
- **Social icons row**: Facebook, Instagram, Twitter/X, YouTube (icon-only links)
- Copyright line at the very bottom

---

## 3. Layout Patterns & Component Inventory

| Component | Type | Notes |
|---|---|---|
| Nav bar | Sticky/simple header | Logo + minimal links |
| Hero | Full-width banner | Headline, subtext, 2 CTAs |
| Logo marquee | Infinite horizontal scroll | ~15 unique logos, looped |
| Feature cards | Grid (6 items) | Icon + title + description |
| Process steps | Horizontal stepper (3 steps) | Numbered, sequential |
| Testimonial cards | 3-column card grid | Avatar + quote + name + location |
| CTA banner | Full-width band | Secondary conversion goal (B2B) |
| Footer | 3–4 column layout | Links + social icons + copyright |

---

## 4. Navigation & Information Architecture

```
Home (/)
├── #features (in-page anchor)
├── /about
├── /partners
├── /apps/tripket-ph (+ /redirect)
├── /support/contact
├── /support/faq
├── /support/privacy
├── /support/terms
└── /support/account-deletion-request
```

- Flat IA — no nested category structure visible; typical of a marketing/landing site backed by a deeper app experience (mobile app + booking flow presumably lives behind auth or in-app)
- The "Download App" CTA appearing in both the header and hero suggests **mobile-first product strategy**, with the website acting primarily as a marketing/informational front door rather than the full booking interface

---

## 5. UX Observations

- **Repetition for emphasis**: Both hero and footer restate the core value proposition — reinforcing message consistency across entry points.
- **Dual-audience design**: The page serves two distinct user types (passengers/shippers as B2C users, and shipping line companies as B2B partners), each with their own dedicated section and CTA.
- **Social proof placement**: Trust bar (logos) appears immediately after the hero — before any feature explanation — prioritizing credibility over detail.
- **Testimonial diversity**: Deliberately spans both product verticals (ticketing and cargo) and multiple cities (Cebu, Davao, Iloilo), signaling nationwide reach.
- **Anchor-linked CTA**: "Learn More" in the hero uses an in-page anchor (`#features`) rather than a separate page — keeps users on-page longer before pushing to app download or booking.
- **Possible dev artifact**: The "Step 2 of 0" text in the how-it-works section suggests a dynamically rendered stepper component that may not render correctly in non-JS/crawled contexts — worth a QA check on the live site.

---

*Document generated from a live crawl of tripketph.com. Structure reflects the page as rendered at time of access; dynamic/JS-rendered elements (icons, exact grid breakpoints, marquee animation behavior) were inferred from markup patterns rather than directly observed.*
