# Central donation registry and permanent cause hierarchy

The centralized ledger uses one stable designation ID per gift. It supports
direct cause donations and individual project donations in the same donations
table, with one permanent parent cause for each project. Separate payment
accounts or ledgers per cause/project are not needed.

## Four approved causes

| Cause | Direct donation designation | Individually designated projects |
| --- | --- | --- |
| Human Rights & Dignity | `human-rights-dignity` | Voices for Dignity: `voices-for-dignity` |
| Humanitarian Assistance and Relief | `humanitarian-assistance` | None registered yet |
| Animal Welfare | `animal-welfare` | None registered yet |
| Environmental Conservation and Sustainability | `environmental-conservation` | None registered yet |

Voices for Dignity is the only currently registered project. No new projects or
relationships are invented for the other causes. `general-support` remains an
independent existing designation for unrestricted/general giving; it is not a
fifth cause and historical general gifts are not reassigned to causes.

`worker/donation-registry.mjs` exports:

- `donationCauses`: an immutable grouped view of the four cause designations,
  each with its own ID/name and an immutable `projects` array. Project entries
  retain their individual IDs and permanent `causeId`.
- `generalSupportDesignation`: the existing general-support designation.
- `donationRegistry`: the compatible flat list, with all six IDs, names and their
  order preserved. Existing test run UUIDs, request IDs and amounts do not change.
- `resolveDesignation(id)`: server-owned attribution. A direct cause gift returns
  that cause's ID and `projectId=null`; a project gift returns its own designation
  and project ID plus its permanent parent cause. General gifts have no cause.

Client input supplies one `designationId`, never a separate parent cause. Both
test payment providers already accept the four direct cause IDs through the
existing centralized API. Choosing a project does not collapse the designation
into its cause or create a second donation row for the cause.

## Permanent identities and preserved records

Registry validation requires exactly the four approved cause roots, rejects
unparented projects and projects under non-causes, and preserves established
designation identities and parent relationships. `validateRegistry(candidate,
previousRegistry)` additionally protects every designation in a supplied prior
registry when checking additions. Keep the published identity history when
registering future projects; never reuse an old ID for a different purpose.

`worker/migrations/0001_donation_ledger.sql` remains unchanged. It already stores
normalized designation relationships, prevents identity/parent updates, preserves
donation identities, enforces unique request/provider references and keeps events
append-only. The existing `designation_id` foreign key preserves project identity
on historical donations without duplicating parent data on every gift.

`0002_permanent_donation_designations.sql` is an additive migration containing
only two guards: prevent deletion/recreation of registered designations (even
unused projects), and reject insertion of a fifth cause root. It does not rewrite,
rename, backfill, delete or reassign any existing designation, donation or event.
Future projects can still be inserted beneath an approved cause; once inserted,
their parent cannot be changed. The migration is supplied for separate review
and application to the intended database; it has not been applied remotely by
this change. Never rerun the initial schema migration on an existing database.

Before creating a pending donation, the ledger compares the source registry's
kind/parent with the stored D1 designation. A mismatch fails before any insert
or provider request. Repeated identical request IDs still recover the existing
donation; changed amounts, providers or designations under the same request ID
are rejected. Existing checkout references and completed events stay attached to
their original donations.

## Payment architecture and current scope

The public production Worker continues using its existing project Stripe and
PayPal adapters and Durable Object protections. They do not import the central
registry/ledger; their paths, provider configuration, checkout metadata, secrets,
frontend and Wrangler configuration are unchanged. The existing general hosted
donation flow is also unchanged. This registry change does not enable new live
checkout buttons, move historic provider payments into D1 or activate production
ledger writes.

The separate `ygvoice-donations-test` Worker uses the existing centralized D1
binding, Stripe test checkout, PayPal Sandbox and authenticated reconciliation.
Its provider adapters derive attribution from the selected designation; they
require verified provider completion before marking a gift completed. See
[test integration and diagnostics](donation-ledger-test-integration.md) and
[synthetic verification](synthetic-ledger-verification.md).

For reporting, keep direct cause gifts and project gifts distinguishable. A
cause's combined total includes its direct gifts plus its child project gifts,
counting each donation once. General gifts remain separate. Pending rows do not
represent received payments. Exclude `cs_synthetic_` references and
`synthetic.reconciled.completed` events from provider-payment totals. Refund/net
accounting and production webhook rollout remain separate work.

## Validation

Local tests exercise the real schema and additive migration with SQLite through
a D1-compatible adapter. They cover all four direct cause designations and
Voices for Dignity on both simulated providers, immutable parents, rejection of
extra cause roots, preservation of historical completed rows/events, mismatched
registry rejection, idempotency, provider-reference isolation and unchanged test
run identities. No live payment, remote migration or deployment is performed.
