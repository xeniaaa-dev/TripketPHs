# Tripket PH Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, responsive React landing page for Tripket PH with accessible demo booking interactions.

**Architecture:** A Vite-powered React single page renders well-bounded visual sections and a stateful booking card. Component-local markup and a shared stylesheet create the editorial visual system; no external backend is called. A small interaction module controls booking state and reveal behavior, while CSS provides all layout and reduced-motion support.

**Tech Stack:** React, Vite, CSS, Vitest, Testing Library.

## Global Constraints

- The page must use the supplied ferry image and supplied orange Tripket assets.
- Do not copy the linked reference's branding, copy, illustrations, or exact layout.
- Do not imply a completed booking or transaction; all results must be marked as demo content.
- Do not add App Store or Google Play badges without real links; use “Get the app”.
- Respect `prefers-reduced-motion`, provide visible focus styles, semantic landmarks, labels, and accessible contrast.
- Keep the page responsive with a stacked booking module on mobile.

---

## File Structure

- `package.json`: scripts and React/Vite testing dependencies.
- `index.html`: document entry point and metadata.
- `src/main.jsx`: React mount point.
- `src/App.jsx`: section composition and navigation state.
- `src/components/BookingPanel.jsx`: tabbed Passenger/Cargo form and demo-result state.
- `src/components/PhoneMockup.jsx`: presentational app interface preview.
- `src/data/content.js`: partner, feature, journey, footer, and port data.
- `src/styles.css`: tokens, layout, art direction, animation, focus, and responsive styles.
- `src/test/setup.js`: Testing Library matchers.
- `src/App.test.jsx`: app structure and CTA behavior tests.
- `src/components/BookingPanel.test.jsx`: booking mode and demo search tests.
- `public/assets/`: copied user-supplied ferry and logo assets.

## Task 1: Bootstrap the React application and asset pipeline

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/styles.css`
- Create: `src/test/setup.js`
- Create: `public/assets/tripket-ferry.png`
- Create: `public/assets/tripket-ferry-mark.png`
- Create: `public/assets/tripket-wordmark.png`

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, and `npm run test` commands used by each later task.

- [ ] **Step 1: Write the failing smoke test**

```jsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Tripket PH brand', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: /tripket ph/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- --run src/App.test.jsx`
Expected: FAIL because `src/App.jsx` is not yet present.

- [ ] **Step 3: Add Vite, React, Vitest, and a minimal application mount**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>,
);
```

Copy the three supplied visual assets into `public/assets/` using descriptive filenames and configure Vite/Vitest scripts in `package.json`.

- [ ] **Step 4: Run the test to verify the tooling reaches the app**

Run: `npm run test -- --run src/App.test.jsx`
Expected: FAIL only because the brand link is not implemented yet.

## Task 2: Build the semantic landing-page skeleton and content data

**Files:**
- Create: `src/data/content.js`
- Create: `src/App.jsx`
- Modify: `src/App.test.jsx`

**Interfaces:**
- Consumes: React mount point from Task 1.
- Produces: `App` with `#book`, `#cargo`, `#routes`, `#partners`, `#help`, and `#app` anchors; `FEATURES`, `PARTNERS`, `JOURNEY_STEPS`, and `FOOTER_LINKS` exports.

- [ ] **Step 1: Extend the failing page structure test**

```jsx
test('renders the primary page landmarks and required campaign copy', () => {
  render(<App />);
  expect(screen.getByRole('banner')).toBeInTheDocument();
  expect(screen.getByRole('main')).toBeInTheDocument();
  expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /your next island/i })).toBeInTheDocument();
  expect(screen.getByText(/travel with shipping lines filipinos trust/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- --run src/App.test.jsx`
Expected: FAIL because the navigation, landmarks, and campaign sections are absent.

- [ ] **Step 3: Implement content constants and semantic section composition**

Create constants with the exact supplied shipping partners, feature copy, journey steps, and footer links. Build `App` with `header`, `nav`, `main`, named `section` elements, and `footer`; include all requested headlines/copy and anchor IDs.

- [ ] **Step 4: Run page structure tests**

Run: `npm run test -- --run src/App.test.jsx`
Expected: PASS.

## Task 3: Implement the accessible interactive booking panel

**Files:**
- Create: `src/components/BookingPanel.jsx`
- Create: `src/components/BookingPanel.test.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `PORTS` data exported by `src/data/content.js`.
- Produces: `<BookingPanel />` with a Passenger/Cargo tablist and a polite demo result region.

- [ ] **Step 1: Write failing interaction tests**

```jsx
test('switches to cargo fields', async () => {
  const user = userEvent.setup();
  render(<BookingPanel />);
  await user.click(screen.getByRole('tab', { name: /cargo/i }));
  expect(screen.getByLabelText(/cargo type/i)).toBeInTheDocument();
  expect(screen.queryByLabelText(/passengers/i)).not.toBeInTheDocument();
});

test('announces a clearly labeled demo result', async () => {
  const user = userEvent.setup();
  render(<BookingPanel />);
  await user.click(screen.getByRole('button', { name: /search routes/i }));
  expect(screen.getByRole('status')).toHaveTextContent(/demo route preview/i);
});
```

- [ ] **Step 2: Run the booking test to verify it fails**

Run: `npm run test -- --run src/components/BookingPanel.test.jsx`
Expected: FAIL because `BookingPanel` does not exist.

- [ ] **Step 3: Implement local tab and form state**

Use semantic `role="tablist"`, tab `aria-selected` state, associated `tabpanel`, explicit `label` elements, native select/date/number controls, and a submit handler that sets `role="status"` text beginning `Demo route preview:`. Passenger mode uses From, To, Departure date, Passengers, and Search routes; Cargo mode uses From, To, Pickup date, Cargo type, and Check cargo options.

- [ ] **Step 4: Run interaction tests**

Run: `npm run test -- --run src/components/BookingPanel.test.jsx`
Expected: PASS.

## Task 4: Apply the premium visual system and responsive art direction

**Files:**
- Modify: `src/styles.css`
- Modify: `src/App.jsx`
- Modify: `src/components/BookingPanel.jsx`

**Interfaces:**
- Consumes: landing structure from Task 2 and booking markup from Task 3.
- Produces: responsive desktop and mobile visual treatment including hero image composition, booking-card layout, editorial cards, phones, journey line, cargo section, and partner invitation.

- [ ] **Step 1: Write a failing behavioral visual-accessibility test**

```jsx
test('primary trip CTA moves focus to the booking form', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('link', { name: /find a trip/i }));
  expect(screen.getByRole('tab', { name: /passenger/i })).toHaveFocus();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- --run src/App.test.jsx`
Expected: FAIL because the CTA has no focus behavior.

- [ ] **Step 3: Add visual styling and focus behavior**

Define color and spacing tokens; create terracotta/cream hero and cargo compositions; place the supplied ferry artwork behind a darkened, rounded media area; create route badges, logo rail, feature artwork, phone frames, and line animation using CSS. Add `scrollIntoView` and focus behavior to the Find a trip CTA. Include responsive breakpoints so navigation and booking fields stack, then add `@media (prefers-reduced-motion: reduce)` rules that remove transitions, transforms, animations, and smooth scrolling.

- [ ] **Step 4: Run all component tests**

Run: `npm run test -- --run`
Expected: PASS.

## Task 5: Validate the production build and rendered experience

**Files:**
- Modify: any file identified by verification failures only.

**Interfaces:**
- Consumes: completed React application.
- Produces: a buildable application with desktop and mobile visual verification.

- [ ] **Step 1: Build production assets**

Run: `npm run build`
Expected: exit code 0 and a generated `dist/` directory.

- [ ] **Step 2: Run the complete test suite**

Run: `npm run test -- --run`
Expected: PASS with zero failing tests.

- [ ] **Step 3: Inspect the rendered page**

Run: `npm run dev -- --host 127.0.0.1`
Expected: Vite serves the page locally. Inspect at wide and narrow browser dimensions; verify visible logo/nav, ferry hero, tab panel, stacked mobile booking form, all requested sections, focus indicators, and demo result wording.

- [ ] **Step 4: Address only observed defects and re-run verification**

Run: `npm run build && npm run test -- --run`
Expected: both commands exit successfully after any fixes.

## Self-Review

- Spec coverage: Task 2 supplies every requested content section; Task 3 covers Passenger/Cargo demo behavior; Task 4 covers art direction, responsive layout, motion, and accessibility; Task 5 covers build and visual checks.
- Placeholder scan: no unassigned implementation or testing work remains.
- Interface consistency: `PORTS` is exported by content data and consumed by `BookingPanel`; `App` composes `BookingPanel`; test paths match component paths.
