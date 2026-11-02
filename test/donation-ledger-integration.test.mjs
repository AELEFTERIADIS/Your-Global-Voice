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

test('checkout retry recovers the approval URL without creating a second provider object', async () => {
 const f=fixture();
 try {
  for (const provider of ['stripe','paypal']) {
   const input={provider,designationId:'voices-for-dignity',amountCents:100,requestId:crypto.randomUUID()};
   const first=await createTestCheckout(f.env,input,'https://test.workers.dev/return',f.send);
   const again=await createTestCheckout(f.env,input,'https://test.workers.dev/return',f.send);
   assert.deepEqual(again,first);
   assert.equal(f.calls.filter(c=>c.options.method==='POST' && c.url.endsWith(provider==='stripe'?'/checkout/sessions':'/checkout/orders')).length,1);
  }
  assert.equal(f.sql.prepare('SELECT count(*) n FROM donations').get().n,2);
 } finally { f.sql.close(); }
});

test('completed reconciliation returns persisted attribution and duplicate-prevention evidence', async () => {
 const f=fixture();
 try {
  for (const provider of ['stripe','paypal']) {
   const c=await createTestCheckout(f.env,{provider,designationId:'voices-for-dignity',amountCents:123,requestId:crypto.randomUUID()},'https://test.workers.dev/return',f.send);
   const pending=await reconcileTestDonation(f.env,c.donationId,f.send);
   assert.equal(pending.paymentVerified,false);
   if (provider==='stripe') f.paid(true);
   else { f.objects.get(c.checkoutReference).status='APPROVED'; await captureTestPayPal(f.env,c.donationId,f.send); }
   const result=await reconcileTestDonation(f.env,c.donationId,f.send);
   assert.equal(result.paymentVerified,true);
   assert.equal(result.testMode,true);
   assert.equal(result.provider,provider);
   assert.equal(result.checkoutReference,c.checkoutReference);
   assert.equal(result.amountCents,123);
   assert.equal(result.currency,'USD');
   assert.deepEqual(result.attribution,{designationId:'voices-for-dignity',kind:'project',causeId:'human-rights-dignity',projectId:'voices-for-dignity'});
   assert.equal(result.donationCount,1);
   assert.equal(result.eventCount,1);
   assert.deepEqual(await reconcileTestDonation(f.env,c.donationId,f.send),result);
  }
 } finally { f.sql.close(); }
});

test('PayPal capture rejects a cancelled ledger record before contacting the provider', async () => {
 const f=fixture();
 try {
  const c=await createTestCheckout(f.env,{provider:'paypal',designationId:'animal-welfare',amountCents:100,requestId:crypto.randomUUID()},'https://test.workers.dev/return',f.send);
  f.objects.get(c.checkoutReference).status='APPROVED';
  f.sql.prepare("UPDATE donations SET status='cancelled' WHERE id=?").run(c.donationId);
  const before=f.calls.length;
  await assert.rejects(captureTestPayPal(f.env,c.donationId,f.send));
  assert.equal(f.calls.length,before);
 } finally { f.sql.close(); }
});

test('provider success followed by reference-write failure recovers with the same idempotency key', async () => {
 for (const provider of ['stripe','paypal']) {
  const f=fixture();
  try {
   const prepare=f.env.DONATION_DB.prepare, cached=new Map(), keys=[];
   let fail=true;
   f.env.DONATION_DB.prepare=query=>{
    const statement=prepare(query);
    if(!query.startsWith('UPDATE donations SET checkout_reference'))return statement;
    return {bind(...values){const bound=statement.bind(...values);return {...bound,async run(){if(fail){fail=false;throw Error('Reference write failed');}return bound.run();}};}};
   };
   const send=async(url,options={})=>{
    if(options.method==='POST' && (url.endsWith('/checkout/sessions') || url.endsWith('/checkout/orders'))) {
     const key=options.headers['Idempotency-Key'] || options.headers['PayPal-Request-Id'];
     assert(key);keys.push(key);
     if(!cached.has(key))cached.set(key,f.send(url,options));
     return (await cached.get(key)).clone();
    }
    return f.send(url,options);
   };
   const input={provider,designationId:'voices-for-dignity',amountCents:100,requestId:crypto.randomUUID()};
   await assert.rejects(createTestCheckout(f.env,input,'https://test.workers.dev/return',send),/Reference write failed/);
   const recovered=await createTestCheckout(f.env,input,'https://test.workers.dev/return',send);
   assert.equal(keys.length,2);assert.equal(keys[0],keys[1]);
   assert.equal(f.objects.size,1);
   assert.equal(f.sql.prepare('SELECT count(*) n FROM donations').get().n,1);
   assert.equal(f.sql.prepare('SELECT checkout_reference FROM donations').get().checkout_reference,recovered.checkoutReference);
  } finally { f.sql.close(); }
 }
});

test('Stripe and PayPal mismatched completion details never mark a pending gift completed', async () => {
 const f=fixture();
 try {
  const stripe=await createTestCheckout(f.env,{provider:'stripe',designationId:'voices-for-dignity',amountCents:100,requestId:crypto.randomUUID()},'https://test.workers.dev/return',f.send);
  f.paid(true);
  for (const change of [r=>r.livemode=true,r=>r.amount_total++,r=>r.currency='eur',r=>r.metadata.cause_id='animal-welfare',r=>r.metadata.project_id='wrong']) {
   const send=async(...args)=>{const r=await f.send(...args);const data=await r.json();change(data);return Response.json(data);};
   await assert.rejects(reconcileTestDonation(f.env,stripe.donationId,send));
  }
  const paypal=await createTestCheckout(f.env,{provider:'paypal',designationId:'animal-welfare',amountCents:100,requestId:crypto.randomUUID()},'https://test.workers.dev/return',f.send);
  const order=f.objects.get(paypal.checkoutReference);
  order.status='COMPLETED';order.purchase_units[0].payments={captures:[{status:'PENDING',amount:order.purchase_units[0].amount}]};
  await assert.rejects(reconcileTestDonation(f.env,paypal.donationId,f.send),/capture mismatch/);
  assert.equal(f.sql.prepare("SELECT count(*) n FROM donations WHERE status='completed'").get().n,0);
  assert.equal(f.sql.prepare('SELECT count(*) n FROM donation_events').get().n,0);
 } finally { f.sql.close(); }
});

test('authentication is exact and GET is rejected only after valid authorization', async () => {
 const f=fixture();
 try {
  const url='https://test.workers.dev/test/ledger/verify';
  for(const value of ['Bearer $DONATION_TEST_ADMIN_TOKEN','Bearer undefined','bearer '+f.env.DONATION_TEST_ADMIN_TOKEN,'Bearer Bearer '+f.env.DONATION_TEST_ADMIN_TOKEN]) {
   assert.equal((await handler.fetch(new Request(url,{method:'POST',headers:{Authorization:value,'Content-Type':'application/json'},body:'{}'}),f.env)).status,403);
  }
  assert.equal((await handler.fetch(new Request(url,{headers:{Authorization:'Bearer '+f.env.DONATION_TEST_ADMIN_TOKEN}}),f.env)).status,404);
  assert.equal(f.sql.prepare('SELECT count(*) n FROM donations').get().n,0);
 } finally { f.sql.close(); }
});

test('authenticated PayPal errors distinguish OAuth and order creation without exposing secrets or changing completed Stripe records',async()=>{
 const f=fixture(),original=globalThis.fetch;
 try {
  const stripe=await createTestCheckout(f.env,{provider:'stripe',designationId:'voices-for-dignity',amountCents:105,requestId:crypto.randomUUID()},'https://test.workers.dev/return',f.send);
  f.paid(true);await reconcileTestDonation(f.env,stripe.donationId,f.send);
  const completed=f.sql.prepare('SELECT * FROM donations WHERE id=?').get(stripe.donationId);
  const events=f.sql.prepare('SELECT * FROM donation_events').all();
  const input={provider:'paypal',designationId:'general-support',amountCents:100,requestId:crypto.randomUUID()};
  const accessToken='access-token-never-expose',debugId='a1b2c3d4e5f67';
  for(const stage of ['paypal_oauth','paypal_order_create']) {
   const calls=[];
   globalThis.fetch=async(url)=>{
    assert.equal(new URL(url).origin,'https://api-m.sandbox.paypal.com');calls.push(new URL(url).pathname);
    if(stage==='paypal_order_create' && url.endsWith('/oauth2/token'))return Response.json({access_token:accessToken});
    return Response.json({error:stage==='paypal_oauth'?'invalid_client':undefined,name:stage==='paypal_order_create'?'UNPROCESSABLE_ENTITY':undefined,debug_id:debugId,
     error_description:f.env.TEST_PAYPAL_CLIENT_SECRET,message:f.env.TEST_PAYPAL_CLIENT_ID,
     access_token:accessToken,Authorization:'Basic '+btoa(f.env.TEST_PAYPAL_CLIENT_ID+':'+f.env.TEST_PAYPAL_CLIENT_SECRET),
     details:[{issue:'PAYEE_ACCOUNT_RESTRICTED',description:accessToken},{issue:accessToken}],links:[{href:'https://example.invalid/'+f.env.DONATION_TEST_ADMIN_TOKEN}]},{status:stage==='paypal_oauth'?401:422});
   };
   const response=await handler.fetch(new Request('https://test.workers.dev/test/donations',{method:'POST',headers:{Authorization:'Bearer '+f.env.DONATION_TEST_ADMIN_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(input)}),f.env);
   assert.equal(response.status,400);
   const result=await response.json();
   assert.deepEqual(result.diagnostic,{provider:'paypal_sandbox',stage,status:stage==='paypal_oauth'?401:422,reason:'provider_http_error',errorName:stage==='paypal_oauth'?'invalid_client':'UNPROCESSABLE_ENTITY',debugId,issues:['PAYEE_ACCOUNT_RESTRICTED']});
   assert.equal(calls.length,stage==='paypal_oauth'?1:2);
   const text=JSON.stringify(result);
   for(const secret of [f.env.TEST_PAYPAL_CLIENT_ID,f.env.TEST_PAYPAL_CLIENT_SECRET,f.env.DONATION_TEST_ADMIN_TOKEN,accessToken,btoa(f.env.TEST_PAYPAL_CLIENT_ID+':'+f.env.TEST_PAYPAL_CLIENT_SECRET)])assert(!text.includes(secret));
   assert.deepEqual(f.sql.prepare('SELECT * FROM donations WHERE id=?').get(stripe.donationId),completed);
   assert.deepEqual(f.sql.prepare('SELECT * FROM donation_events').all(),events);
   assert.equal(f.sql.prepare('SELECT count(*) n FROM donations WHERE request_id=?').get(input.requestId).n,1);
  }
  const unauthorized=await handler.fetch(new Request('https://test.workers.dev/test/donations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}),f.env);
  assert.equal(unauthorized.status,403);assert.equal((await unauthorized.json()).diagnostic,undefined);
 } finally {globalThis.fetch=original;f.sql.close();}
});

