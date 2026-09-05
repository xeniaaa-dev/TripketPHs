import {
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  Handshake,
  Headphones,
  Map,
  Package,
  Search,
  Smile,
  Target,
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
  { label: 'Home', href: ROUTES.home },
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

/**
 * The two filled orange CTAs. The header keeps a plain action verb because it
 * is the persistent, always-visible control; the hero carries the launch
 * announcement instead. Both point at `ROUTES.book`.
 */
export const NAV_CTA_LABEL = 'Book Now'
export const HERO_CTA_LABEL = 'v2 is now available'

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

/**
 * The marquee on the home page uses `name` + `src`; the partners page also
 * renders `blurb`. Descriptions are the shipping lines' own copy, as published
 * on tripketph.com/partners.
 */
export const PARTNER_LOGOS = [
  {
    name: 'Medallion Transport Inc.',
    src: '/assets/optimized/partners/MedallionTransport.webp',
    blurb: 'We provide convenient two-way routes connecting Cebu and Bato.',
  },
  {
    name: 'Montenegro Shipping Lines, Inc.',
    src: '/assets/optimized/partners/MontenegroShippingLinesInc.webp',
    blurb: 'Pioneer in serving Filipino pasahero since 1978.',
  },
  {
    name: 'Aleson Shipping Lines, Inc',
    src: '/assets/optimized/partners/AlesonShippingLinesInc.webp',
    blurb: 'Come and experience a Cebu-Bohol and Dipolog-Dumaguete daily destination via Sea Jet.',
  },
  {
    name: '2GO Travel',
    src: '/assets/optimized/partners/2Go.webp',
    blurb: 'Leading ships, wide routes, Luzon connection.',
  },
  {
    name: 'Fast Cat',
    src: '/assets/optimized/partners/FastCat.webp',
    blurb: 'Fast Cat facilitates safe, efficient, and convenient travel by connecting the islands of the Philippines through their reliable ferry services.',
  },
  {
    name: 'Lite Shipping Corporation',
    src: '/assets/optimized/partners/LiteShippingCorporation.webp',
    blurb: 'Lite Shipping Corporation played a pioneering role in establishing and promoting diverse routes throughout the Visayas region.',
  },
  {
    name: 'Cokaliong Shipping Lines',
    src: '/assets/optimized/partners/CokaliongShippingLines.webp',
    blurb: 'Explore Visayas and Mindanao\'s hidden treasures with Cokaliong\'s captivating sailings.',
  },
  {
    name: 'OceanJet',
    src: '/assets/optimized/partners/OceanJet.webp',
    blurb: 'Bacolod, Batangas, Calapan, Cebu, Dumaguete, Iloilo, Larena, Ormoc, Siquijor, and Tagbilaran.',
  },
  {
    name: 'SuperCat',
    src: '/assets/optimized/partners/SuperCat.webp',
    blurb: 'Affordable, secure, high-quality transportation for budget-conscious travellers.',
  },
  {
    name: 'Starlite Ferries',
    src: '/assets/optimized/partners/starliteFerries.webp',
    blurb: 'Starlite Ferries has emerged as a prominent figure in the realm of sea transportation.',
  },
  {
    name: 'Trans-Asia Shipping Lines',
    src: '/assets/optimized/partners/transasia.webp',
    blurb: 'With its roots in Cebu and unmatched expertise in the Philippines, Trans-Asia Shipping Lines holds a distinct position in the industry.',
  },
  {
    name: 'Maayo Shipping Incorporation',
    src: '/assets/optimized/partners/MaayoShippingIncorporation.webp',
    blurb: 'Serving the Sibulan-Liloan and Tampi-Bato routes between Negros Oriental and Cebu.',
  },
  {
    name: 'Kho Shipping Lines',
    src: '/assets/optimized/partners/KhoShippingLines.webp',
    blurb: 'A reliable ferry service offering a range of options for travellers to reach beautiful island destinations, with a focus on flexibility, convenience, and quality service.',
  },
  {
    name: 'HS Star Marine Shipping',
    src: '/assets/optimized/partners/HsStarMarineShipping.webp',
    blurb: 'HS Star Marine Shipping Corporation, also operating as Anika Shipping Line.',
  },
  {
    name: 'Evaristo and Sons',
    src: '/assets/optimized/partners/evaristoAndSons.webp',
    blurb: 'Fast craft and RORO ferry company offering daily trips from Surigao City to Dapa, Siargao Island and vice versa.',
  },
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


/* =========================================================================
   ABOUT PAGE — copy taken from tripketph.com/about
   ========================================================================= */

export const ABOUT_HERO = {
  eyebrow: 'Who we are',
  headlineLead: 'About ',
  headlineAccent: 'Tripket PH',
  copy:
    'We are a Philippine-based online ticketing and cargo shipping platform dedicated to making inter-island travel seamless for every Filipino.',
}

export const ABOUT_PILLARS = [
  {
    icon: Target,
    title: 'Our Mission',
    body:
      'To make inter-island travel and cargo shipping in the Philippines accessible, convenient, and affordable for every Filipino.',
  },
  {
    icon: Compass,
    title: 'Our Vision',
    body:
      'To become the most trusted online transportation ticketing platform in the Philippines, bridging islands and connecting communities.',
  },
  {
    icon: Handshake,
    title: 'Our Values',
    body:
      'We are committed to transparency, reliability, and customer-first service. Every booking should be simple, secure, and stress-free.',
  },
]

export const ABOUT_STORY = {
  eyebrow: 'Our story',
  title: 'Booking a ferry should not mean queueing at a ticket office',
  body:
    'Tripket PH was founded to solve a real problem: booking ferry tickets and cargo shipments in the Philippines was complicated, time-consuming, and often required visiting physical ticketing offices. We built an all-in-one digital platform that lets passengers and shippers book and manage their trips online.',
}

export const ABOUT_CONTACT = [
  {
    label: 'Our office',
    value:
      '2nd floor, Mats Place, Hibbard Avenue, Piapi, Dumaguete City, Negros Oriental, Philippines',
  },
  { label: 'Contact us', value: 'support@tripketph.com', href: 'mailto:support@tripketph.com' },
]

/** Founder names, roles and quotes exactly as published on the live About page. */
export const FOUNDERS = [
  {
    initials: 'AM',
    name: 'Allan Bennett Yap Uy Matiao',
    role: 'CEO / Co-Founder',
    quote: 'Tripket PH is the future of booking.',
  },
  {
    initials: 'IU',
    name: 'Irwin Noel Ramas-Uypitching',
    role: 'CEO / Co-Founder',
    quote: 'Building connections, one route at a time.',
  },
  {
    initials: 'SC',
    name: 'Sherwin Caraig',
    role: 'CEO / Co-Founder',
    quote: 'The best way to predict the future is to create it.',
  },
  {
    initials: 'AT',
    name: 'Arvin Tia',
    role: 'CEO / Co-Founder',
    quote: 'Design the future, one blueprint at a time.',
  },
]

export const ABOUT_CTA = {
  title: 'Travel smarter with Tripket PH',
  // The live page says "download our app"; this project's hero announces the
  // v2 web app, so the primary action stays consistent with that.
  body: 'Book your next ferry ticket or cargo shipment in minutes on the new Tripket web app.',
}

/* =========================================================================
   PARTNERS PAGE — copy taken from tripketph.com/partners
   ========================================================================= */

export const PARTNERS_HERO = {
  eyebrow: 'Our shipping partners',
  headlineLead: 'Trusted by shipping lines ',
  headlineAccent: 'nationwide',
  copy:
    'Tripket PH is trusted by leading Philippine shipping lines to power their online ticketing and cargo booking.',
  note: 'Our growing network of partners covers routes across Luzon, Visayas, and Mindanao.',
}

export const PARTNERS_CTA = {
  title: 'Become a Tripket PH partner',
  body:
    'Join our network and connect your shipping line to thousands of passengers booking online every day.',
}
