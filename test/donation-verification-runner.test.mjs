import test from 'node:test';
import assert from 'node:assert/strict';
import {testCases,ledgerSQL,verifyLedgerRows} from '../scripts/verify-donation-payments.mjs';
import {resolveDesignation} from '../worker/donation-registry.mjs';

const run='00000000-0000-4000-8000-000000000001';
function evidence() {
 const cases=testCases(run),checkouts=new Map();
 const rows=cases.map((input,index)=>{
  const id=crypto.randomUUID(),ref=input.provider==='stripe'?'cs_test_'+index:'TESTORDER'+String(index).padStart(8,'0');
  checkouts.set(input.requestId,{donationId:id,checkoutReference:ref});
  const a=resolveDesignation(input.designationId);
  return {id,request_id:input.requestId,provider:input.provider,designation_id:input.designationId,
   amount_cents:input.amountCents,currency:'USD',status:'completed',checkout_reference:ref,
   kind:a.kind,cause_id:a.kind==='project'?a.causeId:null,
   donation_count:1,reference_count:1,event_count:1,completion_count:1};
 });
 return {cases,checkouts,rows};
}
test('remote verification resumes twelve isolated requests across all designations and both providers',()=>{
 const f=evidence();
 assert.equal(f.cases.length,12);
 assert.equal(new Set(f.cases.map(c=>c.requestId)).size,12);
 assert.deepEqual(testCases(run.toUpperCase()),f.cases);
 assert.notDeepEqual(testCases('00000000-0000-4000-8000-000000000002'),f.cases);
 const result=verifyLedgerRows(f.rows,f.cases,f.checkouts);
 assert.equal(result.length,12);
 assert.equal(result.filter(r=>r.attribution.projectId==='voices-for-dignity').length,2);
 assert(result.filter(r=>r.attribution.projectId).every(r=>r.attribution.causeId==='human-rights-dignity'));
});
test('remote verification refuses missing, duplicated, synthetic, misattributed and unconfirmed evidence',()=>{
 const f=evidence();
 assert.throws(()=>verifyLedgerRows(f.rows.slice(1),f.cases,f.checkouts));
 assert.throws(()=>verifyLedgerRows([...f.rows,f.rows[0]],f.cases,f.checkouts));
 for(const changes of [{status:'pending'},{amount_cents:999},{currency:'EUR'},
  {designation_id:'animal-welfare'},{cause_id:'animal-welfare'},{provider:'paypal'},
  {donation_count:2},{reference_count:2},{event_count:2},{completion_count:0},
  {checkout_reference:'cs_synthetic_fake'},{checkout_reference:'cs_live_fake'}]) {
  const rows=structuredClone(f.rows);Object.assign(rows[0],changes);
  assert.throws(()=>verifyLedgerRows(rows,f.cases,f.checkouts));
 }
});
test('D1 verification uses only SELECT with validated request UUIDs',()=>{
 const sql=ledgerSQL(testCases(run));
 assert.match(sql,/^SELECT /);
 assert.doesNotMatch(sql,/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\b/i);
 assert.throws(()=>testCases("x'); DROP TABLE donations; --"));
 assert.throws(()=>ledgerSQL([{requestId:"x'); DROP TABLE donations; --"}]));
});
