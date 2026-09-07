/**
 * FAQ content, transcribed from the two tabs on tripketph.com/support/faq.
 *
 * Wording describing how the product behaves has been reconciled with the live
 * web app at app.tripketph.com (verified: booking takes an origin, a
 * destination and a travel date; booked trips appear under "My Tickets"; saved
 * traveller and vehicle details live under "Passengers", split into People and
 * Vehicles).
 *
 * Answers that state a business policy this project cannot verify — fees,
 * discounts, refunds, deadlines, ID rules, partner-portal claims — carry a
 * `TODO: Confirm with Tripket` comment. Those answers keep the live site's
 * exact wording; they are NOT rewritten from guesswork. Comments are stripped
 * at build time, so none of this reaches the published bundle. Clear each one
 * with the Tripket product owner, then delete its comment.
 *
 * To list what is still outstanding:  grep -c "Confirm with Tripket" this file
 */
export const FAQ_AUDIENCES = [
  {
    id: 'passengers',
    label: 'For Passengers',
    groups: [
      {
        title: 'Booking Process',
        items: [
          {
            q: 'How to book tickets online?',
            a:
              'On the Tripket PH web app, choose your origin, your destination and your travel date, then book an available trip and complete payment online. Your booked trip and ticket details then appear in My Tickets. The Tripket PH app is also available on the Google Play Store.',
          },
          {
            q: 'What information do I need to provide while booking?',
            a:
              'You must provide accurate personal information including your full name, contact details, and a valid ID type. Ensure all information is correct to avoid issues with your booking.',
          },
          {
            q: 'Can I book tickets for someone else?',
            a:
              'Yes, you can book tickets for someone else using your account, provided you enter precise and correct information. The booked trip and its ticket details stay available in My Tickets on the booking account.',
            // The live site added "you must have access to the screenshot of
            // the paid ticket for retrieval and presentation". Retrieval is now
            // My Tickets, so the screenshot requirement was dropped per the
            // no-screenshot instruction.
            // TODO: Confirm with Tripket — what the traveller must present at boarding when someone else
            //   booked for them.
          },
          {
            q: 'How can I get discounts?',
            a:
              'Discounts are available for students with valid school IDs, senior citizens, and children. Select the correct passenger type during booking and present the required valid identification when boarding.',
            // TODO: Confirm with Tripket — discount eligibility and the documents required.
          },
          {
            q: 'How far in advance can I book tickets?',
            a:
              'The booking window allows reservations up to 30 days in advance. You can also book as close as 1 hour before the scheduled travel time for last-minute arrangements.',
            // TODO: Confirm with Tripket — booking lead time and the last-minute cut-off.
          },
          {
            q: 'Are there age restrictions for booking?',
            a:
              'Individuals 10 years old and above may book independently. Those 9 years old and below must be accompanied by an adult during the booking process.',
            // TODO: Confirm with Tripket — age limits and minor-travel rules.
          },
        ],
      },
      {
        title: 'Payment & Tickets',
        items: [
          {
            q: 'What payment methods are accepted?',
            a:
              'We accept GCash, PayMaya, GrabPay, and major credit/debit cards (Visa, Mastercard). Payment is processed securely through our platform.',
            // TODO: Confirm with Tripket — accepted payment methods.
          },
          {
            q: 'How will I receive my ticket after booking?',
            a:
              'After a successful booking, your booked trip and ticket details are available in My Tickets.',
          },
          {
            q: 'Can I rebook my ticket?',
            a:
              'Yes, rebooking is allowed within a 6-month window from the original travel date. Only the travel date can be changed — no name, destination, shipping line, or accommodation changes are permitted. Rebooking fees apply.',
            // TODO: Confirm with Tripket — rebooking eligibility, fees and the time limit.
          },
          {
            q: 'Are there additional fees for booking online?',
            a:
              'Yes, a convenience fee applies to cover administrative and processing costs. This will be shown as a separate line item during checkout before you confirm your booking.',
            // TODO: Confirm with Tripket — the convenience/booking fee and how it is shown.
          },
          {
            q: 'Can I print my ticket or show it on my phone?',
            a:
              'You may either print your ticket or display it on your mobile device — as long as you have a valid and paid ticket.',
          },
          {
            q: 'Can I get a refund if I cancel?',
            a:
              'If you cancel due to personal reasons, an 8% deduction applies to cover transaction fees. If the trip is cancelled by the shipping line due to weather or operational reasons, you are entitled to a full refund or free rebooking.',
            // TODO: Confirm with Tripket — cancellation deductions and free-rebooking conditions.
          },
          {
            q: 'How long does a refund take?',
            a:
              'Refund processing typically takes 5–10 business days depending on your payment method. GCash and PayMaya refunds may be faster than card refunds.',
            // TODO: Confirm with Tripket — refund processing times per payment method.
          },
        ],
      },
      {
        title: 'Booking Issues & Support',
        items: [
          {
            q: 'What happens if I miss my departure?',
            a:
              'If you miss your scheduled departure, your ticket may be used for future travel. However, priority rescheduling may not be guaranteed. Contact our support team for assistance.',
            // TODO: Confirm with Tripket — the missed-departure policy.
          },
          {
            q: 'What should I do if I made a mistake while booking?',
            a:
              'If you notice an error before completing payment, restart the booking process and re-enter the correct information. Double-check all details before confirming to avoid complications.',
          },
          {
            q: 'How can I check the status of my booking?',
            a:
              'Open My Tickets to view your booked trips and ticket details.',
          },
          {
            q: 'What should I do if I encounter technical issues?',
            a:
              'If you experience technical issues during booking, contact our technical support team for prompt assistance and resolution.',
          },
          {
            q: 'What ID do I need when boarding?',
            a:
              'Present a valid government-issued ID along with your e-ticket (printed or digital) when boarding. Minors must also present a copy of their birth certificate.',
            // TODO: Confirm with Tripket — boarding ID requirements, including for minors.
          },
        ],
      },
    ],
  },
  {
    id: 'shipping',
    label: 'For Shipping Line Partners',
    note:
      'These answers cover the partner portal used by shipping lines. They do not describe features of the passenger booking app.',
    groups: [
      {
        title: 'Accessing The Dashboard',
        items: [
          {
            q: 'How do I access the client dashboard?',
            a:
              'Sign in to your account at client.tripketph.com or create a new one if necessary. Locate the Dashboard or My Account option and click on it to access your management portal.',
            // TODO: Confirm with Tripket — the partner portal URL and sign-in flow.
          },
        ],
      },
      {
        title: 'Dashboard Information',
        items: [
          {
            q: 'What information is displayed on the dashboard?',
            a:
              'The dashboard provides a concise summary of weekly sales, passengers, tickets, users, and vehicles. It offers insights into revenue, customer demand, ticket volume, user growth, and transportation resource utilization.',
            // TODO: Confirm with Tripket — what the partner dashboard actually shows.
          },
          {
            q: 'How often is the dashboard updated?',
            a:
              'The dashboard is updated in real-time, ensuring that the displayed information continuously reflects the most current data available. This enables immediate responsiveness to changes in sales, passengers, and ticket availability.',
            // TODO: Confirm with Tripket — partner dashboard refresh behaviour.
          },
        ],
      },
      {
        title: 'Payments & Verification',
        items: [
          {
            q: 'How do we receive payouts?',
            a:
              'Payments collected through Tripket PH are settled to your designated bank account on a weekly payout schedule. Our team will provide full details during onboarding.',
            // TODO: Confirm with Tripket — payout schedule and settlement terms.
          },
          {
            q: 'How do we verify tickets?',
            a:
              'Ticket verification is facilitated through the conductor scanner app. Scan the ticket barcode or QR code to instantly authenticate it by cross-referencing with the ticketing system database.',
            // TODO: Confirm with Tripket — ticket verification / QR scanning for partners.
          },
        ],
      },
      {
        title: 'Platform & Operations',
        items: [
          {
            q: 'Can I manage multiple vessels and routes?',
            a:
              'Yes. The Tripket PH client portal allows you to manage multiple vessels, routes, and schedules from a single dashboard.',
            // TODO: Confirm with Tripket — vessel and route management in the partner portal.
          },
          {
            q: 'Can I update schedules in real time?',
            a:
              'Yes. You can update departure schedules, seat availability, and fares in real time through the client management portal.',
            // TODO: Confirm with Tripket — real-time schedule editing by partners.
          },
        ],
      },
      {
        title: 'Data & Reporting',
        items: [
          {
            q: 'Can I filter or customize the data displayed?',
            a:
              'Yes. You can apply filters based on date, schedule, and route to narrow down the information presented and focus on the data most relevant to your analysis.',
            // TODO: Confirm with Tripket — partner dashboard filtering.
          },
          {
            q: 'Is there a way to export the data?',
            a:
              'Yes. The dashboard supports exporting data in Excel format. You can also export the customer manifest and print data directly from the dashboard.',
            // TODO: Confirm with Tripket — partner data export formats.
          },
          {
            q: 'How can I generate reports based on dashboard data?',
            a:
              'Use the date filters to narrow your data to a specific time range, then extract and analyze it to generate comprehensive reports or summaries.',
            // TODO: Confirm with Tripket — partner reporting capability.
          },
          {
            q: 'Can I view historical data or trends?',
            a:
              'Yes. The dashboard provides the capability to view historical data and track trends over time across sales, bookings, customer behavior, and other relevant metrics.',
            // TODO: Confirm with Tripket — historical data available to partners.
          },
        ],
      },
      {
        title: 'Support & Security',
        items: [
          {
            q: 'What support is available for shipping line clients?',
            a:
              'We provide dedicated account management, technical support, and onboarding assistance for all our shipping line partners. Our support team is available to help with any inquiries or issues related to the dashboard.',
            // TODO: Confirm with Tripket — the partner support model.
          },
          {
            q: 'Are there security measures to protect dashboard data?',
            a:
              'Yes. User-level permissions are implemented to restrict dashboard access to authorized users only. Each user is assigned a specific permission level, ensuring they can only access data and actions relevant to their role.',
            // TODO: Confirm with Tripket — partner permission levels and data controls.
          },
          {
            q: 'What should I do if I notice discrepancies on the dashboard?',
            a:
              'First verify your internet connection is stable. If the issue persists, contact our technical support team who will help identify and rectify any data discrepancies.',
            // TODO: Confirm with Tripket — the partner escalation path.
          },
        ],
      },
      {
        title: 'Partnerships',
        items: [
          {
            q: 'How do I partner with Tripket PH?',
            a:
              'Visit our Partners page or contact us at support@tripketph.com to express your interest. Our team will walk you through the onboarding process for your shipping line.',
            // TODO: Confirm with Tripket — the partner onboarding process and contact route.
          },
          {
            q: 'What does it cost to list my shipping line?',
            a:
              'We offer flexible partnership arrangements. Contact our team to discuss a plan that fits your business size and booking volume.',
            // TODO: Confirm with Tripket — partnership pricing.
          },
        ],
      },
    ],
  },
]
