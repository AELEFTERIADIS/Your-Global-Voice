import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFile} from 'node:fs/promises';
import {donationRegistry} from '../worker/donation-registry.mjs';
import {createTestCheckout,reconcileTestDonation,captureTestPayPal} from '../worker/donation-test-service.mjs';
import handler from '../worker/ledger-test.mjs';
const migration=await readFile(new URL('../worker/migrations/0001_donation_ledger.sql',import.meta.url),'utf8');
function fixture(){
 const sql=new DatabaseSync(':memory:');sql.exec(migration);let failBatch=false;
 function prepare(query){return {bind(...values){return {query,values,run:async()=>({meta:{changes:Number(sql.prepare(query).run(...values).changes)}}),first:async()=>sql.prepare(query).get(...values)||null};}};}
 const db={prepare,batch:async items=>{sql.exec('BEGIN');try{const results=[];for(const item of items){results.push(await item.run());if(failBatch)throw new Error('Simulated database failure');}sql.exec('COMMIT');return results;}catch(error){sql.exec('ROLLBACK');throw error;}}};
 const env={DONATION_TEST_MODE:'true',DONATION_DB:db,TEST_STRIPE_SECRET_KEY:'sk_test_simulated',TEST_PAYPAL_CLIENT_ID:'sandbox-simulated',TEST_PAYPAL_CLIENT_SECRET:'simulated-secret',DONATION_TEST_ADMIN_TOKEN:'x'.repeat(48)};
 const objects=new Map(), calls=[];let count=0, mismatch=false, paid=false;
 const send=async(url,options={})=>{calls.push({url,options});assert(!url.includes('api-m.paypal.com'));if(url.endsWith('/oauth2/token'))return Response.json({access_token:'simulated'});
 if(options.method==='POST' && url.endsWith('/checkout/sessions')){const p=new URLSearchParams(options.body),metadata=Object.fromEntries([...p].filter(([k])=>k.startsWith('metadata[')).map(([k,v])=>[k.slice(9,-1),v]));const id='cs_test_'+(++count);objects.set(id,{id,metadata,amount_total:Number(p.get('line_items[0][price_data][unit_amount]')),currency:'usd',livemode:false,url:'https://checkout.stripe.com/c/pay/'+id});return Response.json(objects.get(id));}
 if(options.method==='POST' && url.endsWith('/checkout/orders')){const body=JSON.parse(options.body),id='TESTORDER'+String(++count).padStart(8,'0');objects.set(id,{id,purchase_units:body.purchase_units,status:'CREATED',links:[{rel:'payer-action',href:'https://www.sandbox.paypal.com/checkoutnow?token='+id}]});return Response.json(objects.get(id));}
 const id=url.split('/').at(-1)==='capture'?url.split('/').at(-2):url.split('/').at(-1);const object=structuredClone(objects.get(id));assert(object);
 if(id.startsWith('cs_')){object.payment_status=paid?'paid':'unpaid';object.status=paid?'complete':'open';if(mismatch)object.metadata.designation_id='wrong';return Response.json(object);}
 if(url.endsWith('/capture')){object.status='COMPLETED';object.purchase_units[0].payments={captures:[{status:'COMPLETED',amount:object.purchase_units[0].amount}]};objects.set(id,object);}
 if(mismatch)object.purchase_units[0].custom_id='wrong';return Response.json(object);
 };
 return {env,sql,send,calls,objects,paid:value=>paid=value,mismatch:value=>mismatch=value,failBatch:value=>failBatch=value};
}
test('every cause/project and general gift retains attribution through both provider integrations and reconciliation',async()=>{
 const f=fixture();try{for(const provider of ['stripe','paypal'])for(const entry of donationRegistry){
 const body={provider,designationId:entry.id,amountCents:12345,requestId:crypto.randomUUID()};
 const checkout=await createTestCheckout(f.env,body,'https://test.workers.dev/return',f.send);const repeat=await createTestCheckout(f.env,body,'https://test.workers.dev/return',f.send);assert.equal(repeat.donationId,checkout.donationId);
 let result=await reconcileTestDonation(f.env,checkout.donationId,f.send);assert.equal(result.status,'pending');
 f.mismatch(true);await assert.rejects(reconcileTestDonation(f.env,checkout.donationId,f.send));f.mismatch(false);
 if(provider==='stripe'){f.paid(true);result=await reconcileTestDonation(f.env,checkout.donationId,f.send);f.paid(false);}else{f.objects.get(checkout.checkoutReference).status='APPROVED';result=await captureTestPayPal(f.env,checkout.donationId,f.send);}
 assert.equal(result.status,'completed');const row=f.sql.prepare('SELECT * FROM donations WHERE id=?').get(checkout.donationId);assert.equal(row.designation_id,entry.id);assert.equal(row.amount_cents,12345);assert.equal(row.currency,'USD');
 if(provider==='stripe')f.paid(true);await reconcileTestDonation(f.env,checkout.donationId,f.send);f.paid(false);
 assert.equal(f.sql.prepare('SELECT count(*) n FROM donation_events WHERE donation_id=?').get(checkout.donationId).n,1);
 }assert.equal(f.sql.prepare("SELECT count(*) n FROM donations WHERE status='completed'").get().n,12);
 }finally{f.sql.close();}
});
test('transaction failure rolls back events and state, and retries recover without duplicate completion',async()=>{
 const f=fixture();try{const c=await createTestCheckout(f.env,{provider:'stripe',designationId:'voices-for-dignity',amountCents:2500,requestId:crypto.randomUUID()},'https://test.workers.dev/return',f.send);f.paid(true);f.failBatch(true);await assert.rejects(reconcileTestDonation(f.env,c.donationId,f.send));assert.equal(f.sql.prepare('SELECT count(*) n FROM donation_events').get().n,0);assert.equal(f.sql.prepare('SELECT status FROM donations').get().status,'pending');f.failBatch(false);await reconcileTestDonation(f.env,c.donationId,f.send);assert.equal(f.sql.prepare('SELECT status FROM donations').get().status,'completed');}finally{f.sql.close();}
});
test('test-only service refuses live Stripe keys, unknown attribution and unauthenticated requests',async()=>{
 const f=fixture();try{const body={provider:'stripe',designationId:'general-support',amountCents:100,requestId:crypto.randomUUID()};for(const env of [{...f.env,DONATION_TEST_MODE:'false'},{...f.env,TEST_STRIPE_SECRET_KEY:'sk_live_not-a-real-key'}])await assert.rejects(createTestCheckout(env,body,'https://test.workers.dev/return',f.send));await assert.rejects(createTestCheckout(f.env,{...body,designationId:'unknown'},'https://test.workers.dev/return',f.send));assert.equal(f.calls.length,0);const response=await handler.fetch(new Request('https://test.workers.dev/test/donations',{method:'POST'}),f.env);assert.equal(response.status,403);}finally{f.sql.close();}
});
