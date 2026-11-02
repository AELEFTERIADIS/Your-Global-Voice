# Synthetic test ledger verification

`POST /test/ledger/verify` exists only in `worker/ledger-test.mjs`. It requires
`DONATION_TEST_MODE=true`, the existing D1 binding, and the existing test admin
Bearer token (at least 32 characters). Send JSON containing only a `runId` UUID.
Never put the token in a URL or commit it. No additional secrets are required.

Example request body:

```json
{"runId":"00000000-0000-4000-8000-000000000001"}
```

The fixed causes are `human-rights-dignity` (100 synthetic cents) and
`animal-welfare` (101 synthetic cents). Request IDs are deterministically
namespaced by runId and cause. Reuse a runId to retry the same verification;
a new runId intentionally creates two more records in the test database.

The harness uses the existing donation ledger SQL and D1 binding. It checks
persisted attribution and amount, identical-request deduplication, rejection of
a conflicting cause for the same request ID, synthetic completion, and repeated
completion producing one event per donation. Event insertion and status update
use a transactional D1 batch. A failure may leave pending rows or one completed
cause; retrying the same runId recovers without intentionally duplicating rows.

No network/provider APIs are called. The existing schema only accepts stripe or
paypal provider values, so these synthetic rows use `provider=stripe`, with
`cs_synthetic_` checkout references and `synthetic.reconciled.completed` events.
They must be excluded from payment reports; completed here means only synthetic
ledger completion. The response explicitly includes `synthetic=true` and
`paymentVerified=false`. Provider reconciliation rejects these references before
network access. This does not verify Stripe/PayPal settlement or provider adapters.

Rows and append-only events are retained for inspection; there is no cleanup
endpoint. The harness accepts no arbitrary SQL, donation IDs, provider data,
amounts, or cause choices. Never bind this test Worker to a production database.
No migration, production entry point/configuration, or frontend changes are
required. The endpoint is unavailable remotely until a separately authorized
test Worker deployment; this change does not deploy it.

Local verification:

```bash
node test/synthetic-ledger.test.mjs
node test/donation-ledger-integration.test.mjs
node test/donation-foundation.test.mjs
npm run build
```
