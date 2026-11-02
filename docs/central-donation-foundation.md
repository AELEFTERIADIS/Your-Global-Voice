# Central one-time donation foundation (not activated)

This foundation adds server-owned designation validation and a permanent D1 schema
and data-access module. Existing checkout endpoints, provider requests, secrets,
Wrangler settings, interfaces and deployment workflows are unchanged. Neither
payment adapter imports these modules yet. No D1 database is created, no migration
is applied, and no production ledger writes occur in this phase.

## Designations

`worker/donation-registry.mjs` contains general support, the four existing causes,
and the only existing project: Voices for Dignity, under Human Rights & Dignity.
Project/cause attribution is derived server-side from one stable designation ID;
client-supplied cause IDs, status, currency and other extra fields are rejected.
These IDs support reporting; they do not declare legally restricted gift terms.

## D1 schema and internal API

`worker/migrations/0001_donation_ledger.sql` creates:
- `donation_designations`: normalized general/cause/project registry with validated
  parent links. Identity and parent attribution cannot be changed after creation.
- `donations`: permanent UUID, unique normalized request ID, designation, Stripe or
  PayPal provider, exact integer USD cents ($1–$10,000), pending status, optional
  unique checkout reference and UTC creation timestamp.
- `donation_events`: append-only, deduplicated provider-event identifiers reserved
  for future verified reconciliation. There is no current writer or HTTP route.

`createPendingDonation(db, input)` accepts designationId, provider, amountCents and
requestId. Repeated identical requests return the original record; different
values under the same ID are rejected. `attachCheckoutReference` associates a
provider session/order without marking the gift completed, and prevents replacing
or sharing checkout references. The ledger is not an expiring Durable Object.
No donor PII, card data, secrets, OAuth tokens or raw provider payloads are stored.

A checkout/order is not a completed donation. The foundation deliberately has no
API to mark donations paid. Future signature-verified webhooks and transactional
reconciliation must implement completion, refunds and financial reporting. Do not
calculate contribution totals from pending rows or double-count project gifts
when aggregating their parent cause. Fees/net amounts and recurring gifts are
outside this first phase.

## Later activation — separate reviewed step

1. Create a D1 database in the intended Cloudflare account and approve its region,
   retention/access and backup/export procedures. No database ID is invented here.
2. Add a `DONATION_DB` D1 binding and migrations directory only after those details
   exist. Apply the migration to a test database, then verify constraints and
   recovery before any remote production migration.
3. Integrate adapters with pending ledger creation and durable provider-reference
   recovery. Handle provider-success/DB-failure cases explicitly; external API and
   D1 writes cannot form one distributed transaction.
4. Add verified Stripe/PayPal webhooks, event deduplication, atomic state updates,
   refund reconciliation and an authenticated reporting path. Never expose D1 or
   write endpoints directly to visitors, or treat browser return URLs as proof.
5. Verify in provider test environments, then approve production activation while
   retaining existing checkout flows until the migration is validated.

Tests execute the actual migration using SQLite and the internal API through a
D1-compatible prepared-statement adapter. They verify data constraints, registry
consistency, idempotency and reference isolation. Remote Cloudflare D1 deployment
and live provider-to-ledger reconciliation are not verified or enabled.
