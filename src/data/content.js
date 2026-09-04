import {
  CheckCircle2,
  Clock,
  CreditCard,
  Headphones,
  Map,
  Package,
  Search,
  Smile,
  Ticket,
} from 'lucide-react'

// Retained for the standalone BookingPanel component, which the live
// tripketph.com layout does not place on the marketing page.
export const PORTS = [
  'Manila',
  'Cebu',
  'Caticlan',
  'Iloilo',
  'Bacolod',
  'Dumaguete',
  'Puerto Princesa',
]

/**
 * Every destination lives here so the live tripketph.com information
 * architecture can be re-pointed in one place. Paths mirror the real site;
 * in-page anchors are used only where the live site also uses an anchor.
 */
export const ROUTES = {
  home: '/',
  top: '#top',
  features: '#features',
  about: '/about',
  partners: '/partners',
  app: '/apps/tripket-ph',
  // TODO: point at the new Tripket web app once the live URL is confirmed.
  // Every "Book Now" CTA reads from here, so this is the only line to change.
  book: '#',
  admin: '/admin',
  contact: '/support/contact',
  faq: '/support/faq',
  privacy: '/support/privacy',
  terms: '/support/terms',
  accountDeletion: '/support/account-deletion-request',
}

export const PRIMARY_NAV = [
  { label: 'Home', href: ROUTES.top },
  { label: 'About', href: ROUTES.about },
  { label: 'Partners', href: ROUTES.partners },
]

export const SUPPORT_NAV = [
  { label: 'Contact Us', href: ROUTES.contact },
  { label: 'FAQ', href: ROUTES.faq },
  { label: 'Privacy Policy', href: ROUTES.privacy },
  { label: 'Terms of Service', href: ROUTES.terms },
  { label: 'Account Deletion', href: ROUTES.accountDeletion },
]

/**
 * The hero speaks to existing Tripket users arriving from the v2 launch email
 * or SMS, not to first-time visitors: it confirms the new version, states that
 * the old one is gone, and offers a single way forward.
 */
export const HERO = {
  badge: 'Version 2 is now available',
  headlineLead: 'The ',
  headlineAccent: 'new',
  headlineTail: ' Tripket PH is here',
  copy:
    'The previous version of Tripket PH is no longer accessible. Book your ferry tickets and cargo shipments on the new Tripket web app.',
}

export const SECTION_LABELS = {
  features: 'What you get',
  steps: 'How it works',
  testimonials: 'Why travellers stay',
  partner: 'For shipping lines',
}

/**
 * `featured: true` promotes an item to a large bento tile. The two flagged
 * items are the actual product lines (passenger tickets and cargo), so the
 * layout mirrors the business rather than treating all six as equal.
 */
export const FEATURES = [
  {
    icon: CreditCard,
    title: 'Online Payments',
    copy: 'Pay securely with GCash, PayMaya, GrabPay, or credit and debit cards.',
  },
  {
    icon: Ticket,
    title: 'Ticket Booking',
    featured: true,
    copy: 'Book ferry and bus tickets from anywhere, anytime, in just a few taps.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    copy: 'Our team is always ready to assist you with any booking concern.',
  },
  {
    icon: Map,
    title: 'Customized Routes',
    copy: 'Find the best route for your journey across the Philippine islands.',
  },
  {
    icon: Package,
    title: 'Cargo Shipping',
    featured: true,
    copy: 'Ship cargo and freight with trusted Philippine shipping line partners.',
  },
  {
    icon: Clock,
    title: 'Real-time Schedules',
    copy: 'Check live departure schedules and seat availability before you book.',
  },
]

export const JOURNEY_STEPS = [
  {
    icon: Search,
    step: 1,
    title: 'Search Routes',
    copy: 'Enter your origin, destination, and travel date to find available trips and schedules.',
  },
  {
    icon: CheckCircle2,
    step: 2,
    title: 'Choose & Book',
    copy: 'Select your preferred schedule and complete payment securely online.',
  },
  {
    icon: Smile,
    step: 3,
    title: 'Travel with Ease',
    copy: 'Receive your e-ticket by email and present it when boarding. That’s it!',
  },
]

/**
 * DEMO CONTENT — these three testimonials, their routes and their ratings are
 * placeholders inherited from the live site's sample data. Replace them with
 * real, attributable customer quotes (or delete the section) before launch.
 */
export const TESTIMONIALS = [
  {
    initials: 'MS',
    name: 'Maria Santos',
    route: 'Cebu → Tagbilaran',
    rating: 5,
    featured: true,
    location: 'Cebu City',
    quote:
      'Booking my ferry ticket used to be a headache. With Tripket PH I can do it in minutes, right from my phone.',
  },
  {
    initials: 'RD',
    name: 'Roberto Dela Cruz',
    route: 'Davao → General Santos',
    rating: 5,
    location: 'Davao City',
    quote:
      'I ship cargo every week. Tripket PH made it far easier to manage bookings across several shipping lines.',
  },
  {
    initials: 'AR',
    name: 'Ana Reyes',
    route: 'Iloilo → Bacolod',
    rating: 4,
    location: 'Iloilo City',
    quote:
      'Finally, a platform that just works. Perfect for planning island-hopping trips around the Visayas.',
  },
]

export const PARTNER_LOGOS = [
  { name: 'Medallion Transport Inc.', src: '/assets/optimized/partners/MedallionTransport.webp' },
  { name: 'Montenegro Shipping Lines, Inc.', src: '/assets/optimized/partners/MontenegroShippingLinesInc.webp' },
  { name: 'Aleson Shipping Lines, Inc', src: '/assets/optimized/partners/AlesonShippingLinesInc.webp' },
  { name: '2GO Travel', src: '/assets/optimized/partners/2Go.webp' },
  { name: 'Fast Cat', src: '/assets/optimized/partners/FastCat.webp' },
  { name: 'Lite Shipping Corporation', src: '/assets/optimized/partners/LiteShippingCorporation.webp' },
  { name: 'Cokaliong Shipping Lines', src: '/assets/optimized/partners/CokaliongShippingLines.webp' },
  { name: 'OceanJet', src: '/assets/optimized/partners/OceanJet.webp' },
  { name: 'SuperCat', src: '/assets/optimized/partners/SuperCat.webp' },
  { name: 'Starlite Ferries', src: '/assets/optimized/partners/starliteFerries.webp' },
  { name: 'Trans-Asia Shipping Lines', src: '/assets/optimized/partners/transasia.webp' },
  { name: 'Maayo Shipping Incorporation', src: '/assets/optimized/partners/MaayoShippingIncorporation.webp' },
  { name: 'Kho Shipping Lines', src: '/assets/optimized/partners/KhoShippingLines.webp' },
  { name: 'HS Star Marine Shipping', src: '/assets/optimized/partners/HsStarMarineShipping.webp' },
  { name: 'Evaristo and Sons', src: '/assets/optimized/partners/evaristoAndSons.webp' },
]

/**
 * Capability statements, deliberately free of commercial terms (rates,
 * settlement periods, volumes). Get commercial claims signed off before
 * adding any number here.
 */
export const PARTNER_BENEFITS = [
  'Nationwide passenger reach',
  'Online booking and cargo manifests',
  'Dedicated partner support',
]

export const FOOTER_GROUPS = [
  {
    heading: 'Company',
    links: [
      { label: 'About Us', href: ROUTES.about },
      { label: 'Partners', href: ROUTES.partners },
      { label: 'Get the App', href: ROUTES.app },
    ],
  },
  {
    heading: 'Help & Support',
    links: SUPPORT_NAV,
  },
]

export const FOOTER_TAGLINE =
  'The all-in-one platform for Philippine transportation ticketing — book ferry tickets and cargo shipments online.'

export const SOCIAL_LINKS = [
  { label: 'Tripket PH on Facebook', network: 'facebook', href: 'https://www.facebook.com/tripketph' },
  { label: 'Tripket PH on Instagram', network: 'instagram', href: 'https://www.instagram.com/tripketph' },
  { label: 'Tripket PH on X', network: 'x', href: 'https://x.com/tripketph' },
  { label: 'Tripket PH on YouTube', network: 'youtube', href: 'https://www.youtube.com/@tripketph' },
]
