import { Mail, MapPin, Phone } from 'lucide-react'

/* =========================================================================
   CONTACT — copy and details taken from tripketph.com/support/contact
   ========================================================================= */

export const CONTACT_HERO = {
  eyebrow: 'Get in touch',
  headlineLead: 'Contact ',
  headlineAccent: 'us',
  copy: "Have a question or need help with your booking? We're here to assist you.",
}

export const CONTACT_CHANNELS = [
  {
    icon: Phone,
    label: 'Mobile',
    value: '+63 960 921 6651',
    note: 'Mon–Fri, 8AM–6PM PHT',
    // tel: needs the number with no spaces, so this has to be edited in step
    // with `value` above — they are the same number in two formats.
    href: 'tel:+639609216651',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'support@tripketph.com',
    note: 'Reply within 1–2 business days',
    href: 'mailto:support@tripketph.com',
  },
  {
    icon: MapPin,
    label: 'Our office',
    value: '2nd floor, Mats Place, Hibbard Avenue, Piapi, Dumaguete City, Negros Oriental, Philippines',
    note: 'Where to find us',
  },
]

/* =========================================================================
   ACCOUNT DELETION

   The live site links to /support/account-deletion-request from both the nav
   and the footer, but that URL currently redirects to the home page — there
   is no published copy to transcribe. This page is therefore written from
   Tripket PH's own Privacy Policy, which is the only authoritative statement
   of what data is held and how removal is requested:

     - the data categories come from "How do we use the information we
       collect?"
     - the retention wording comes from "How long do we keep your
       information?"
     - the identity-check and contact route come from "Can I update or correct
       my information?"

   No processing deadline is claimed, because Tripket PH has not published
   one. Confirm the real timeline before launch.
   ========================================================================= */

export const DELETION_HERO = {
  eyebrow: 'Your data',
  headlineLead: 'Request account ',
  headlineAccent: 'deletion',
  copy:
    'You can ask us to delete your Tripket PH account and the personal information attached to it. Send us the request below and we will verify your identity before anything is removed.',
}

export const DELETION_REMOVED = [
  'Your name, username and password',
  'Your phone number, email address and billing address',
  'Stored payment method details',
  'Your age and passenger type',
  'Vehicle details saved for RORO bookings',
]

export const DELETION_RETAINED = [
  'Completed booking and payment records we are required to keep for legal, tax or regulatory reasons',
  'Information that has already been anonymised and can no longer identify you',
  'Records held by a shipping line under its own terms, which we cannot delete on your behalf',
]

export const DELETION_STEPS = [
  {
    step: 1,
    title: 'Send your request',
    body:
      'Email support@tripketph.com from the address on your account, or use the form on this page, and tell us you want your account deleted.',
  },
  {
    step: 2,
    title: 'We verify it is you',
    body:
      'We may take reasonable steps to confirm your identity before we act on the request. This protects your account from someone else deleting it.',
  },
  {
    step: 3,
    title: 'Your data is removed',
    body:
      'Once verified, we delete the personal information listed above, or anonymise it where we have a legal obligation to keep the underlying record.',
  },
]

export const DELETION_NOTE =
  'Deleting your account does not refund existing bookings. A ticket already marked as used cannot be refunded, and cancellations follow the refund rules in our Terms of Service.'
