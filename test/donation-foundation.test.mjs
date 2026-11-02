import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { donationRegistry, resolveDesignation, validateRegistry } from '../worker/donation-registry.mjs';
import { createPendingDonation, attachCheckoutReference } from '../worker/donation-ledger.mjs';
const sql = await readFile(new URL('../worker/migrations/0001_donation_ledger.sql', import.meta.url), 'utf8');
function setup() {
 const sqlite = new DatabaseSync(':memory:'); sqlite.exec(sql);
 const db = { prepare: query => ({ bind: (...values) => ({ run: async () => ({ meta: { changes: Number(sqlite.prepare(query).run(...values).changes) } }), first: async () => sqlite.prepare(query).get(...values) || null }) }) };
 return { sqlite, db };
}
const input = overrides => ({ designationId:'voices-for-dignity', provider:'stripe', amountCents:2500, requestId:crypto.randomUUID(), ...overrides });
test('registry validates all four causes and existing project against real migration seeds', () => {
 const { sqlite }=setup();try {
 assert.equal(donationRegistry.filter(x=>x.kind==='cause').length,4);
 assert.equal(donationRegistry.filter(x=>x.kind==='project').length,1);
 assert.deepEqual(resolveDesignation('voices-for-dignity'),{designationId:'voices-for-dignity',kind:'project',causeId:'human-rights-dignity',projectId:'voices-for-dignity'});
 assert.equal(resolveDesignation('general-support').causeId,null);
 assert.throws(()=>resolveDesignation('__proto__'));
 for(const row of sqlite.prepare('SELECT * FROM donation_designations').all()) {
 const entry=donationRegistry.find(item=>item.id===row.id);assert.equal(entry.name,row.name);assert.equal(entry.kind,row.kind);assert.equal(entry.causeId || null,row.cause_id);
 }
 assert.throws(()=>validateRegistry([...donationRegistry, donationRegistry[0]]));
 assert.throws(()=>validateRegistry([...donationRegistry,{id:'bad-project',kind:'project',name:'Bad',causeId:'general-support'}]));
 assert.throws(()=>sqlite.prepare("INSERT INTO donation_designations VALUES ('bad', 'project', 'Bad', 'general-support')").run());
 } finally { sqlite.close(); }
});
test('D1-compatible ledger persists exact cents, immutable attribution and idempotent pending records', async () => {
 const { sqlite, db }=setup();try {
 for(const designation of donationRegistry) {
 const body=input({designationId:designation.id});const record=await createPendingDonation(db,body);
 assert.equal(record.amount_cents,2500);assert.equal(record.status,'pending');assert.equal(record.currency,'USD');assert.equal(record.designation_id,designation.id);
 assert.equal((await createPendingDonation(db,body)).id,record.id);
 await assert.rejects(createPendingDonation(db,{...body,amountCents:5000}),/conflicts/);
 await assert.rejects(createPendingDonation(db,{...body,provider:'paypal'}),/conflicts/);
 assert.throws(()=>sqlite.prepare('UPDATE donations SET amount_cents = 5000 WHERE id = ?').run(record.id));
 }
 assert.equal(sqlite.prepare('SELECT count(*) AS total FROM donations').get().total,6);
 for(const amount of [100,12345,1000000])assert.equal((await createPendingDonation(db,input({amountCents:amount}))).amount_cents,amount);
 for(const amount of [99,1000001,1.1,'2500',null])await assert.rejects(createPendingDonation(db,input({amountCents:amount})));
 await assert.rejects(createPendingDonation(db,input({designationId:'unknown'})));
 await assert.rejects(createPendingDonation(db,input({currency:'EUR'})));
 await assert.rejects(createPendingDonation(db,input({status:'completed'})));
 await assert.rejects(createPendingDonation(null,input()),/not configured/);
 } finally { sqlite.close(); }
});
test('checkout references cannot be reassigned, reused or treated as payment completion', async () => {
 const { sqlite, db }=setup();try {
 const a=await createPendingDonation(db,input()), b=await createPendingDonation(db,input());
 await attachCheckoutReference(db,a.id,'cs_test_example');await attachCheckoutReference(db,a.id,'cs_test_example');
 await assert.rejects(attachCheckoutReference(db,a.id,'cs_test_other'));
 await assert.rejects(attachCheckoutReference(db,b.id,'cs_test_example'));
 assert.equal(sqlite.prepare('SELECT status FROM donations WHERE id = ?').get(a.id).status,'pending');
 const p=await createPendingDonation(db,input({provider:'paypal'}));await attachCheckoutReference(db,p.id,'TESTORDER12345');
 await assert.rejects(attachCheckoutReference(db,p.id,'cs_test_bad'));
 assert.throws(()=>sqlite.prepare("INSERT INTO donations (id,request_id,designation_id,provider,amount_cents,currency,created_at) VALUES ('bad','bad','unknown','stripe',100,'USD','now')").run());
 const event=sqlite.prepare("INSERT INTO donation_events (donation_id,provider,provider_event_id,event_type,occurred_at,received_at) VALUES (?, ?, ?, 'test', 'now', 'now')");
 event.run(a.id,'stripe','evt_test');assert.throws(()=>event.run(a.id,'stripe','evt_test'));assert.throws(()=>event.run(a.id,'paypal','evt_other'));
 assert.throws(()=>sqlite.prepare("UPDATE donation_events SET event_type = 'changed'").run());
 assert.throws(()=>sqlite.prepare('DELETE FROM donation_events').run());
 } finally { sqlite.close(); }
});
