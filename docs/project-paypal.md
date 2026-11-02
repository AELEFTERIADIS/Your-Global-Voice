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

## Readiness diagnostics

The allowed-origin status response includes safe reason codes when unavailable:

- `configuration_incomplete`: `missing` lists variable/binding names only. Set
  PAYPAL_CHECKOUT_ENABLED to the exact string `true`, configure any listed secret
  in the active Production version, or restore the CONTACT_LIMITS binding.
- `paypal_credentials_rejected`: Live OAuth returned HTTP 401. Verify the two
  encrypted credentials are a matching pair from the same **Live** REST app.
- `paypal_access_denied`: Live OAuth returned HTTP 403. Review app/account access
  restrictions in PayPal; do not change credentials blindly.
- `paypal_service_unavailable`: PayPal OAuth returned a server error; check PayPal
  availability and retry before modifying account settings.
- `paypal_authentication_failed`: another non-success OAuth HTTP response; inspect
  the matching request in PayPal's developer tools/support for its exact reason.
- `paypal_invalid_response`: OAuth returned malformed JSON or an invalid token
  response. Investigate the provider response without publishing its contents.
- `paypal_unreachable`: OAuth could not complete (for example network/timeout).
  Check Worker-to-PayPal connectivity and runtime errors.

No secret values, OAuth tokens, raw provider errors or exception text are returned.
Redeploy the Worker to obtain these diagnostics; the frontend is unchanged.
