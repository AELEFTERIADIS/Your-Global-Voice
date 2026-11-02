# Voices for Dignity — Stripe Checkout Sessions

Project payments remain OFF by default. No secret or activation flag is committed.
PayPal remains disabled. General Donate page checkout links are unchanged.

## Cloudflare configuration (existing ygvoice-contact Worker)

1. Add `STRIPE_SECRET_KEY` as an encrypted Worker secret, initially using a Stripe
   **test-mode** key from the organization's Stripe account. Never put this key in
   GitHub files, Pages variables, browser code, or chat. The key must be permitted
   to create Checkout Sessions and inline Prices/Products.
2. In a non-production/test Worker deployment, set the non-secret variable
   `STRIPE_CHECKOUT_ENABLED=true` to test. An unset/false value keeps the Card
   button disabled, even when a secret is present. Do not enable the production
   flag before verifying test-mode checkout.
3. Verify preset amounts and custom values ($1, $123.45, $10,000), USD currency,
   project metadata, cancellation and failures against Stripe test mode. Check
   `project=voices-for-dignity` on both the Session and PaymentIntent. Confirm the
   receiving account and receipt settings. Use only Stripe test payment details.
4. After verification, configure a live key securely and explicitly enable the
   production flag. Confirm a live Session opens with the expected amount/account
   without making a real payment. Disable the flag immediately if checks fail.

Existing CONTACT_SITE_ORIGIN(S) allowlist and CONTACT_LIMITS Durable Object binding
are reused. No new binding or migration is required. Contact email delivery does
not depend on Stripe configuration. GitHub Pages supplies the existing public
Worker origin and narrowly permits its API via Projects' CSP.

## Behavior and safeguards

`GET /api/projects/dignity/checkout/status` returns availability, never secrets.
`POST /api/projects/dignity/checkout` accepts integer `amountCents` from 100 through
1,000,000 plus a UUID requestId. Amounts, fixed USD currency, project name/metadata,
and return URLs are set/validated server-side. No Payment Link parameters are used.
The exact integer cents are sent to Stripe's Checkout Sessions API as an inline
Price. Only Stripe-hosted `https://checkout.stripe.com` destinations are accepted.

Origin checks, trusted Cloudflare client-IP HMAC hashes, persistent per-IP limits
(5 attempts/15 minutes), bounded JSON input, provider timeouts and idempotency keys
protect session creation. CORS is never wildcard. Returned provider errors are
sanitized. No card data is collected by this website. Rate limiting reduces abuse;
origin validation is not authentication and does not stop all non-browser clients.

Success and cancellation both return to projects.html without claiming payment
success. No fulfillment, receipt or donation accounting is performed by this code.
Stripe Dashboard is the payment record. Automated verified payment reporting would
require a separately implemented, signature-verified webhook; a redirect is never
proof of payment. No webhook or payment-success message is enabled here.

Automated tests mock Stripe: they prove request construction, exact amounts,
metadata, validation and failure handling, not live credentials or delivery.
