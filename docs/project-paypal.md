# Voices for Dignity — PayPal Orders API

The existing `ygvoice-contact` Worker uses its encrypted `PAYPAL_CLIENT_ID` and
`PAYPAL_CLIENT_SECRET` secrets. Neither value belongs in GitHub or browser code.
`PAYPAL_CHECKOUT_ENABLED="true"` is a non-secret Wrangler variable. Set it false to
turn off both new orders and capture (do not interrupt in-flight donations).
This implementation uses PayPal's **live** `https://api-m.paypal.com` API only.
The credentials must belong to the organization's intended PayPal Business app.

No new Durable Object binding or migration is needed: CONTACT_LIMITS stores
separate `paypal-ip:` and `paypal-order:` objects, isolated from contact and Stripe.
Deploy the Worker code with Wrangler from `worker/`; the Pages workflow deploys
only the frontend. A Pages deployment alone does not update the Worker.

## Flow

- `GET /api/projects/dignity/paypal/status`: verifies configured secrets, activation
  flag, binding, and OAuth authentication. Returns only `{available: boolean}`.
  OAuth success is readiness, not proof that an order or payment will succeed.
- `POST .../orders`: accepts integer `amountCents` ($1–$10,000 USD) and UUID
  `requestId`. Worker fixes USD, project identifiers, return/cancel destinations,
  shipping preference, and CAPTURE intent; ignores client overrides.
- Donor approves at PayPal's exact `https://www.paypal.com/checkoutnow` destination.
- PayPal returns `token` (order ID) and the server-generated `paypal_return` nonce.
  Frontend removes these parameters from the address bar and requests capture.
- `POST .../capture`: accepts `orderId` and `nonce`. Validates the persisted order,
  nonce, 24-hour expiry, and capture attempt limit. Uses a persistent idempotency
  key. Success requires the correct order, project, completed capture, exact
  expected amount, and USD currency. Repeated successful captures return the
  stored outcome without contacting PayPal again.

Rate limits, HMAC-hashed Cloudflare client addresses, bounded input, exact Origin
allowlist/CORS, provider timeouts and sanitized error responses remain in force.
No PayPal SDK, secret, access token, or client credential is sent to the browser.
Existing Stripe request construction and general Donate links are unchanged.

## Operations and verification

Before public use, confirm the deployed production version includes this code,
CONTACT_LIMITS remains bound, and the two PayPal secrets are present in that same
version. Confirm the live app belongs to the intended recipient Business account
and can create/capture Orders v2 payments. Account verification/restrictions and
receipt configuration are controlled in PayPal, not by this code.

Automated tests use simulated PayPal responses. They do not prove live merchant
permissions, receipt delivery, completed payments, or successful deployment.
No real payment was made during implementation. An end-to-end live payment test
requires an authorized donor transaction; do not claim it occurred from OAuth
readiness, mocked responses, or an approval redirect alone.

If capture fails or its response is lost, the page does not claim success and asks
the donor to contact the organization before paying again. Check the PayPal
Dashboard's order/capture record before advising a retry. No webhook or automatic
accounting/fulfillment is added by this integration.
