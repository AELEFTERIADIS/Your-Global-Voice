import { resolveDesignation } from './donation-registry.mjs';
const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
function database(db) { if (!db || typeof db.prepare !== 'function') throw new Error('Donation ledger is not configured.'); return db; }
// Internal foundation API only. No HTTP endpoint or payment provider calls.
export async function createPendingDonation(db, input) {
  database(db);
  if (!input || Object.keys(input).some(key => !['designationId', 'provider', 'amountCents', 'requestId'].includes(key))) throw new TypeError('Invalid donation fields.');
  const designation = resolveDesignation(input.designationId);
  if (!['stripe', 'paypal'].includes(input.provider) || !uuid(input.requestId) || !Number.isSafeInteger(input.amountCents) || input.amountCents < 100 || input.amountCents > 1000000) throw new TypeError('Invalid one-time USD donation.');
  // Fail before inserts/provider calls if a source edit disagrees with the
  // permanent database hierarchy. Existing donation attribution stays intact.
  const registered = await db.prepare('SELECT id, kind, cause_id FROM donation_designations WHERE id = ?').bind(designation.designationId).first();
  if(!registered || registered.kind!==designation.kind || (registered.cause_id || null)!==(designation.kind==='project'?designation.causeId:null))throw new Error('Donation designation does not match the permanent ledger registry.');
  const requestId = input.requestId.toLowerCase();
  await db.prepare("INSERT INTO donations (id, request_id, designation_id, provider, amount_cents, currency, status, created_at) VALUES (?, ?, ?, ?, ?, 'USD', 'pending', ?) ON CONFLICT(request_id) DO NOTHING")
    .bind(crypto.randomUUID(), requestId, designation.designationId, input.provider, input.amountCents, new Date().toISOString()).run();
  const row = await db.prepare('SELECT * FROM donations WHERE request_id = ?').bind(requestId).first();
  if (!row || row.designation_id !== designation.designationId || row.provider !== input.provider || row.amount_cents !== input.amountCents) throw new Error('Donation request conflicts with an existing record.');
  return Object.freeze({ ...row, attribution: designation });
}
export async function attachCheckoutReference(db, donationId, reference) {
  database(db);
  if (!uuid(donationId) || typeof reference !== 'string' || reference.length > 255) throw new TypeError('Invalid checkout reference.');
  const row = await db.prepare('SELECT * FROM donations WHERE id = ?').bind(donationId).first();
  if (!row || !(row.provider === 'stripe' ? /^cs_[A-Za-z0-9_]+$/.test(reference) : /^[A-Z0-9]{10,32}$/.test(reference))) throw new TypeError('Invalid checkout reference.');
  const result = await db.prepare("UPDATE donations SET checkout_reference = ? WHERE id = ? AND status = 'pending' AND (checkout_reference IS NULL OR checkout_reference = ?)").bind(reference, donationId, reference).run();
  if (result.meta.changes !== 1) throw new Error('Checkout reference cannot be replaced.');
}
