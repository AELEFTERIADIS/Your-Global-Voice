import { createPendingDonation, attachCheckoutReference } from './donation-ledger.mjs';
import { resolveDesignation } from './donation-registry.mjs';

const causes = ['human-rights-dignity', 'animal-welfare'];
function check(value) { if (!value) throw new Error('Synthetic ledger verification failed.'); }

// Explicit synthetic completion only; this is never evidence of a provider payment.
async function complete(db, record) {
  check(record.checkout_reference === 'cs_synthetic_' + record.id.replaceAll('-', ''));
  const now = new Date().toISOString();
  await db.batch([
    db.prepare("INSERT INTO donation_events (donation_id,provider,provider_event_id,event_type,occurred_at,received_at) VALUES (?, 'stripe', ?, 'synthetic.reconciled.completed', ?, ?) ON CONFLICT(provider,provider_event_id) DO NOTHING")
      .bind(record.id, 'synthetic:' + record.id, now, now),
    db.prepare("UPDATE donations SET status = 'completed' WHERE id = ? AND checkout_reference = ? AND status IN ('pending','completed')")
      .bind(record.id, record.checkout_reference)
  ]);
}

export async function verifySyntheticLedger(env, input) {
  if (env.DONATION_TEST_MODE !== 'true' || !env.DONATION_DB) throw new Error('Test ledger required.');
  if (!input || Object.keys(input).length !== 1 || typeof input.runId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input.runId)) throw new Error('A runId UUID is required.');
  const db = env.DONATION_DB, records = [];
  for (const [index, designationId] of causes.entries()) {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ygvoice:synthetic-ledger:' + input.runId.toLowerCase() + ':' + designationId)));
    const hex = Array.from(digest.slice(0,16), byte => byte.toString(16).padStart(2,'0')).join('');
    const requestId = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    // The existing schema accepts only stripe/paypal. Synthetic Stripe-shaped rows
    // are unambiguously marked by checkout_reference and synthetic event type.
    const body = {designationId, provider:'stripe', amountCents:100 + index, requestId};
    const record = await createPendingDonation(db, body);
    const reference = 'cs_synthetic_' + record.id.replaceAll('-', '');
    check(!record.checkout_reference || record.checkout_reference === reference);
    check((await createPendingDonation(db, body)).id === record.id);
    let rejected = false;
    try { await createPendingDonation(db, {...body, designationId:causes[1-index]}); } catch { rejected = true; }
    check(rejected);
    if (!record.checkout_reference) await attachCheckoutReference(db, record.id, reference);
    const before = await db.prepare('SELECT * FROM donations WHERE id = ?').bind(record.id).first();
    check(before.designation_id === designationId && before.amount_cents === body.amountCents && before.currency === 'USD');
    check(['pending','completed'].includes(before.status));
    await complete(db, before);
    await complete(db, before);
    const after = await db.prepare('SELECT * FROM donations WHERE id = ?').bind(record.id).first();
    const count = await db.prepare('SELECT count(*) AS n FROM donations WHERE request_id = ?').bind(requestId).first();
    const events = await db.prepare('SELECT count(*) AS n FROM donation_events WHERE donation_id = ?').bind(record.id).first();
    const event = await db.prepare('SELECT * FROM donation_events WHERE donation_id = ?').bind(record.id).first();
    check(after.status === 'completed' && count.n === 1 && events.n === 1 && event.event_type === 'synthetic.reconciled.completed');
    records.push({donationId:record.id, attribution:resolveDesignation(after.designation_id), amountCents:after.amount_cents, status:after.status, donationCount:count.n, eventCount:events.n});
  }
  return {synthetic:true, paymentVerified:false, runId:input.runId.toLowerCase(), checks:{attribution:true, duplicatePrevention:true, syntheticReconciliation:true}, records};
}
