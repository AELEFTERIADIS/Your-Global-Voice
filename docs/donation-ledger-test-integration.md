# Isolated donation attribution integration — test only

Target Worker: `ygvoice-donations-test`.
Target D1: `ygvoice-donations-test`, ID `32afbb53-9d54-45be-9a70-64c7d5832a9d`.
Binding: `DONATION_DB`, in `worker/wrangler.ledger-test.toml` only.
The migration has already been applied according to the organization; do not
reapply it. Remote table contents and existing Worker settings must be inspected
before deploying. This environment could not access Cloudflare to do that.

The Production Worker entry point, Wrangler config, payment adapters, secrets,
frontend and checkout URLs are unchanged. The website does not call this test
service. No remote Worker or D1 changes were executed by the implementation.

## Test environment prerequisites

Reuse the encrypted secrets already configured on the existing test Worker.
Do not rotate them or copy them into source code:

- `DONATION_TEST_ADMIN_TOKEN`: a cryptographically random token of at least 32
  characters, held by the tester and never published.
- `TEST_STRIPE_SECRET_KEY`: a Stripe **test-mode** secret/restricted key permitted
  to create/read Checkout Sessions and their inline Prices/Products. Live-prefixed
  keys are rejected before any provider request.
- `TEST_PAYPAL_CLIENT_ID` and `TEST_PAYPAL_CLIENT_SECRET`: a matching PayPal
  **Sandbox** REST-app pair. This adapter calls only api-m.sandbox.paypal.com;
  it never uses production PayPal credentials or endpoints.

DONATION_TEST_MODE is true only in the separate test config. Do not add these
bindings or flags to production. Cloudflare remains the secret store.

## Deployment and remote verification (not performed here)

From the repository root, after the remote test configuration has been reviewed:

```
npx wrangler deploy --config worker/wrangler.ledger-test.toml --keep-vars
```

This command targets the existing **test** Worker. It uploads the test entry point
and DONATION_DB binding, not worker/index.mjs. It does not apply migrations.
Use the returned URL for testing; do not invent a URL or connect the public site.

## Authenticated test API

All POST requests require JSON and `Authorization: Bearer <test admin token>`.
No CORS access is granted to website visitors. Never put the token in a URL.

`POST /test/donations` accepts:

```json
{"provider":"stripe","designationId":"voices-for-dignity","amountCents":2500,"requestId":"00000000-0000-4000-8000-000000000001"}
```

Use a new UUID for each new gift, and provider `paypal` for Sandbox. All six
registered designations are supported. Do not send separate cause/project fields:
those relationships are derived from the validated registry. Response contains
`donationId`, `checkoutReference` and `approvalURL` while approval is available.
A retry fetches the original provider checkout to recover its approval URL;
it never intentionally creates a second donation or provider object. Completed
or expired sessions do not receive a new checkout URL.

The pending D1 row exists before the provider call. Stripe Session/PaymentIntent
metadata includes donation_id, designation_id, and applicable cause_id/project_id.
PayPal custom_id carries the permanent donation UUID and reference_id carries its
immutable designation. The ledger resolves that designation to its parent cause.
Provider idempotency uses the permanent donation ID, allowing retry after a
provider-success/DB-write failure without intentionally creating another object.

Open only the returned test approval URL and use provider test payment details.
For PayPal, use a Sandbox buyer different from the merchant, then call
`POST /test/paypal/capture` with `{"donationId":"<UUID>"}`. It checks attribution
before capture, uses a stable capture idempotency key and reconciles afterward.
The return page is informational; it never proves payment success.

`POST /test/reconcile` with `{"donationId":"<UUID>"}` fetches provider state with
server-held credentials. It checks the stored reference, exact amount/currency,
server-owned designation, Stripe test mode, and completed payment/capture. Pending
or unapproved payments stay pending. Mismatches fail closed. A D1 transaction
inserts a unique reconciliation event and updates status together. Duplicate
reconciliation does not add another event or gift.

After provider verification, reconciliation rereads the persisted D1 row and
requires one donation and one matching completion event. Its response includes
`testMode`, `paymentVerified`, provider/reference, exact cents/currency, resolved
cause/project attribution and donation/event counts. Pending payments explicitly
return `paymentVerified=false`. These richer responses and approval recovery
require the updated test adapter; committing them does not deploy that adapter.
PayPal capture rejects cancelled or other nonpayable ledger states before making
any provider request, and rejects a completed-ledger/provider-state conflict.

This is authenticated polling reconciliation for one-time test completion, not
webhook verification, refunds, accounting exports or a production payment rollout.
Events record the time completion was observed; they do not claim an exact
provider settlement timestamp. Do not sum pending rows or double-count projects
when rolling their donations into cause totals.

## Verified locally versus remaining checks

Automated integration tests execute the real SQL migration in SQLite through a
D1-compatible adapter, with simulated provider APIs. They cover all designations
on both providers, exact cents and attribution, mismatches, duplicate requests,
duplicate events, pending/completed state, transactional rollback/recovery and
rejection of live Stripe keys/unauthenticated access. Existing production tests
also remain in the suite.

Remote D1 binding/deployment, actual Stripe test-mode checkout, PayPal Sandbox
approval/capture and remote D1 reconciliation remain to be verified when
Cloudflare/provider access and the separate test secrets are available.

## Mac verification using existing access, without deployment

The runner below also supports the already deployed API's minimal status
responses: it independently reads remote D1 to verify persisted evidence.
Run from a current checkout of `main`, with Node 24 and existing Wrangler
Cloudflare authentication. It reads the existing raw admin token from
`~/.ygvoice-donation-test-token`; no token is printed or passed on the command
line. Provider credentials remain in the deployed test Worker. Do not use a
production config or apply migrations.

```bash
git pull --ff-only
DONATION_VERIFICATION_RUN_ID="$(uuidgen)"
printf 'Keep this run UUID for retries: %s\n' "$DONATION_VERIFICATION_RUN_ID"
npx --yes --package=wrangler@4 -- node scripts/verify-donation-payments.mjs "$DONATION_VERIFICATION_RUN_ID"
```

The fixed targets are `https://ygvoice-donations-test.andyelft.workers.dev` and
the existing `ygvoice-donations-test` D1 binding. Before creating any checkout,
the runner confirms remote D1 read access. It creates twelve test donations:
all six registered designations on each provider, USD 1.00–1.05 per donation.
Each request ID is deterministic for the run UUID/provider/designation, so reuse
the **same run UUID** after interruptions to avoid another set of test gifts.

For each pending gift, the runner automatically opens its validated checkout URL
in the browser (or prints the URL if the browser cannot open). Stripe requires a
test card (`4242 4242 4242 4242`, future expiry, valid test CVC). After browser
payment, the runner detects completion by authenticated reconciliation every
three seconds; no terminal approval is needed. Polling stops after 15 minutes
or on an API error. Ctrl+C stops the runner; reuse the same UUID to resume.
PayPal requires a Sandbox buyer different from the Sandbox merchant; after
browser approval, press Enter to capture and verify. The runner repeats capture and
reconciliation, and checks that an altered attribution with the same request ID
is rejected. It never calls a production payment endpoint, creates secrets,
changes provider settings, migrates D1 or deploys a Worker.

If an earlier run lost its approval URL on the older deployed adapter, recover
that existing session/order in the provider's test dashboard rather than creating
a new run. Checkout IDs and approval URLs are now saved under
`~/.ygvoice-donation-verification/<run-uuid>.json` with private file permissions;
the admin token and provider credentials are never saved there. Existing D1
progress remains authoritative: saved references must match it, and completed
gifts are reverified without reopening a checkout. Existing run UUIDs and their
request IDs are unchanged. A return URL alone is not payment confirmation. Any missing access,
403, provider error, still-pending payment, mismatched attribution, duplicate
donation/reference/event or synthetic row stops verification without claiming
success. A successful final JSON report contains twelve completed provider-backed
D1 records with correct attribution, one donation and one completion event each.
The runner retains test records and does not delete ledger events.

No actual Stripe test checkout, Sandbox payment or remote D1 result has been
confirmed by the cloud session. Those confirmations require running this command
on the Mac with its existing access and completing the test approvals.

