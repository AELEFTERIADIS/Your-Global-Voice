# Donation payment-choice implementation

The payment-choice area preserves the organization-provided hosted URLs exactly:

- Card checkout: https://buy.stripe.com/fZu9ANdgj8484zp1lX3Je00
- PayPal checkout: https://www.paypal.com/ncp/payment/PVJ5JKDKZW8VQ

The site continues to use hosted checkout navigation only. No payment
sessions are created, no amount/frequency URL parameters were added, and
credentials remain unchanged. Amount and frequency selectors describe the visitor's intended gift;
**neither selection is transferred to either checkout**. The nearby accessible
notice explicitly instructs donors to confirm the amount and available frequency
at checkout. No success, receipt, charge, or subscription is claimed on this page.

Live checkout and provider documentation requests were blocked by the execution
environment's proxy. The supported amount-entry mode, available recurring
options, currencies, and accepted card brands for these particular links could
not be verified. Arbitrary URL parameters were deliberately not added. A future
integration must establish a documented provider-supported mechanism for the
actual account configuration before sending amount or recurring selections.

The Credit or Debit Card choice uses the existing Stripe link without displaying
Stripe as the donor-facing method label. Visa, Mastercard, and Discover logos remain omitted until account-specific
acceptance is confirmed. American Express is now displayed following the
organization’s confirmation that it appears in the live Stripe checkout. The
PayPal choice uses the genuine local PayPal wordmark; source and license are in
`docs/assets/paypal-logo.md` and `paypal-logo-LICENSE.txt`.

Both links open a separate tab with `rel="noopener noreferrer"`; no payment is
made by the website or by tests. Local and Pages artifact tests verify controls,
validation, image loading, keyboard access, responsive layout, and exact URLs.
Browser navigation tests intercept provider pages and cannot prove live account
availability, successful payment processing, or receipt delivery. Those remain
live checks for the organization; do not initiate real payments during testing.
