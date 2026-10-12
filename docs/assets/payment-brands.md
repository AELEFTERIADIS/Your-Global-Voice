# Payment-brand row provenance and verification limits

Displayed: Visa, Mastercard, American Express, Discover, Link by Stripe, PayPal.

Visa, Mastercard and Discover assets are copied unchanged from PayPal's official
SDK logo repository, `cdn/2.3.7/{visa,mastercard,discover}.svg`, commit
`4c39c1ec50b15dde3af99b524fb24ec8aa9fa11b`. American Express comes from the
same source/version. Its Apache 2.0 license is in `paypal-logo-LICENSE.txt`.
PayPal and Stripe Link provenance/licenses are in their adjacent asset documents.
All original colors and aspect ratios are retained.

Stripe's official SDK documentation identifies Visa, Mastercard, American Express
and Discover as card-network types:
https://github.com/stripe/stripe-ios/blob/5861c96e6954c3fe3f76ee4ec67e278c91df3a9f/StripePayments/StripePayments/Source/API%20Bindings/Models/STPCardBrand.swift
This confirms SDK compatibility, not account-specific eligibility or settlement.

The organization reports a working Stripe card checkout, American Express and
Link appearing there, and a working separate PayPal checkout. It explicitly
requested the three additional standard card-network logos. The live Payment
Link and Stripe documentation website remain inaccessible through this
execution environment's proxy. No independent audit of enabled account methods,
country/currency restrictions, or brand-blocking rules has been performed.
Final account-specific acceptance should be checked in the Stripe account or
confirmed by Stripe support. No payments or card-number tests were performed.
Apple Pay and Google Pay are not displayed without confirmation.
