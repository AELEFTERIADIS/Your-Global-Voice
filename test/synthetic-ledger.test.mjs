import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import handler from '../worker/ledger-test.mjs';
import {verifySyntheticLedger} from '../worker/synthetic-ledger-test.mjs';
import {reconcileTestDonation} from '../worker/donation-test-service.mjs';
const migration=await readFile(new URL('../worker/migrations/0001_donation_ledger.sql',import.meta.url),'utf8');
function fixture() {
 const sql=new DatabaseSync(':memory:'); sql.exec(migration); let fail=false;
 const db={prepare(query){return {bind(...args){return {run:async()=>({meta:{changes:Number(sql.prepare(query).run(...args).changes)}}),first:async()=>sql.prepare(query).get(...args)||null};}};},async batch(items){sql.exec('BEGIN');try{for(const item of items){await item.run();if(fail)throw Error('injected failure');}sql.exec('COMMIT');}catch(e){sql.exec('ROLLBACK');throw e;}}};
 return {sql,env:{DONATION_TEST_MODE:'true',DONATION_DB:db,DONATION_TEST_ADMIN_TOKEN:'x'.repeat(48)},fail(v){fail=v;}};
}
const body={runId:'00000000-0000-4000-8000-000000000001'};
function request(env, data=body, auth=true, method='POST') {return handler.fetch(new Request('https://test.workers.dev/test/ledger/verify',{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+env.DONATION_TEST_ADMIN_TOKEN}:{})},...(method==='POST'?{body:JSON.stringify(data)}:{})}),env);}
test('authenticated synthetic D1 verification, retries and provider isolation',async()=>{
 const f=fixture(), original=globalThis.fetch;globalThis.fetch=()=>{throw Error('Network forbidden');};
 try {
  const response=await request(f.env);assert.equal(response.status,200);const result=await response.json();
  assert.equal(result.synthetic,true);assert.equal(result.paymentVerified,false);
  assert.deepEqual(result.records.map(r=>r.attribution.causeId),['human-rights-dignity','animal-welfare']);
  for(const record of result.records){assert.equal(record.status,'completed');assert.equal(record.donationCount,1);assert.equal(record.eventCount,1);await assert.rejects(reconcileTestDonation(f.env,record.donationId),/Synthetic/);}
  assert.deepEqual(await (await request(f.env)).json(),result);
  assert.equal(f.sql.prepare('SELECT count(*) n FROM donations').get().n,2);
  assert.equal(f.sql.prepare('SELECT count(*) n FROM donation_events').get().n,2);
 }finally{globalThis.fetch=original;f.sql.close();}
});
test('guards fail before writes and no arbitrary record selection is accepted',async()=>{
 const f=fixture();try{
  assert.equal((await request(f.env,body,false)).status,403);
  assert.equal((await request({...f.env,DONATION_TEST_MODE:'false'})).status,503);
  assert.equal((await request({...f.env,DONATION_TEST_ADMIN_TOKEN:'short'})).status,503);
  assert.equal((await request(f.env,body,true,'GET')).status,404);
  for(const data of [{},{runId:'invalid'},{...body,donationId:crypto.randomUUID()},{...body,designationId:'general-support'}])assert.equal((await request(f.env,data)).status,400);
  await assert.rejects(verifySyntheticLedger({...f.env,DONATION_TEST_MODE:'false'},body));
  assert.equal(f.sql.prepare('SELECT count(*) n FROM donations').get().n,0);
 }finally{f.sql.close();}
});
test('synthetic reconciliation transaction rolls back and retries recover',async()=>{
 const f=fixture();try{
  f.fail(true);await assert.rejects(verifySyntheticLedger(f.env,body));
  assert.equal(f.sql.prepare('SELECT count(*) n FROM donation_events').get().n,0);
  assert.equal(f.sql.prepare('SELECT status FROM donations').get().status,'pending');
  f.fail(false);await verifySyntheticLedger(f.env,body);
  assert.equal(f.sql.prepare("SELECT count(*) n FROM donations WHERE status='completed'").get().n,2);
  assert.equal(f.sql.prepare('SELECT count(*) n FROM donation_events').get().n,2);
 }finally{f.sql.close();}
});
