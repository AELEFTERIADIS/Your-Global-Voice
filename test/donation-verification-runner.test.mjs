import test from 'node:test';
import assert from 'node:assert/strict';
import {testCases,ledgerSQL,verifyLedgerRows,openCheckout,waitForStripe,loadProgress,saveProgress,resolveApprovalURL,printCheckoutLink} from '../scripts/verify-donation-payments.mjs';
import {mkdtemp,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
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
 const legacy=['general-support','human-rights-dignity','humanitarian-assistance','animal-welfare','environmental-conservation','voices-for-dignity'];
 assert.deepEqual(f.cases.map(c=>[c.provider,c.designationId,c.amountCents]),['stripe','paypal'].flatMap(provider=>legacy.map((id,index)=>[provider,id,100+index])));
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

test('Stripe explicitly opens Google Chrome on Mac without a shell or default-browser fallback',()=>{
 const calls=[];
 openCheckout('https://checkout.stripe.com/c/pay/cs_test_example','stripe','darwin',(...args)=>calls.push(args));
 assert.deepEqual(calls,[['open',['-a','Google Chrome','https://checkout.stripe.com/c/pay/cs_test_example'],{stdio:'ignore'}]]);
 for(const url of ['https://evil.example','https://checkout.stripe.com.evil.example','https://user@checkout.stripe.com','http://checkout.stripe.com'])assert.throws(()=>openCheckout(url,'stripe','darwin',()=>assert.fail('unsafe open')));
 const paypalCalls=[];
 openCheckout('https://www.sandbox.paypal.com/checkoutnow?token=TEST','paypal','darwin',(...args)=>paypalCalls.push(args));
 assert.deepEqual(paypalCalls,[['open',['https://www.sandbox.paypal.com/checkoutnow?token=TEST'],{stdio:'ignore'}]]);
 let attempts=0;
 assert.throws(()=>openCheckout('https://checkout.stripe.com/c/pay/cs_test_example','stripe','darwin',()=>{attempts++;throw Error('Chrome missing');}),/Chrome missing/);
 assert.equal(attempts,1);
 assert.throws(()=>openCheckout('https://www.paypal.com/checkoutnow','paypal','darwin',()=>assert.fail('live PayPal')));
});

test('Stripe polls automatically until completed, with no interactive approval',async()=>{
 let count=0,clock=0;
 const result=await waitForStripe(async(path,body)=>{
  assert.equal(path,'/test/reconcile');assert.equal(body.donationId,'existing-id');
  return {status:++count<3?'pending':'completed'};
 },'existing-id',{interval:10,timeout:100,now:()=>clock,sleep:async ms=>clock+=ms});
 assert.equal(result.status,'completed');assert.equal(count,3);assert.equal(clock,20);
 let slept=false;
 await waitForStripe(async()=>({status:'completed'}),'existing-id',{sleep:async()=>slept=true});
 assert.equal(slept,false);
});

test('Stripe polling stops on timeout, provider errors, unexpected state and cancellation',async()=>{
 let clock=0;
 await assert.rejects(waitForStripe(async()=>({status:'pending'}),'id',{interval:10,timeout:20,now:()=>clock,sleep:async ms=>clock+=ms}),/same run UUID/);
 await assert.rejects(waitForStripe(async()=>{throw Error('HTTP 403');},'id'),/403/);
 await assert.rejects(waitForStripe(async()=>({status:'failed'}),'id'),/no success/);
 const controller=new AbortController();controller.abort();
 await assert.rejects(waitForStripe(()=>assert.fail('aborted request'),'id',{signal:controller.signal}));
});

test('progress saves and resumes the original run and approval URLs without credentials',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'donation-progress-'));
 const path=join(dir,'cache',run+'.json');
 try {
  const progress=await loadProgress(path,run);
  assert.equal(progress.runId,run);
  const request=testCases(run)[0];
  progress.checkouts[request.requestId]={donationId:crypto.randomUUID(),checkoutReference:'cs_test_existing',approvalURL:'https://checkout.stripe.com/c/pay/existing'};
  await saveProgress(path,progress);
  assert.deepEqual(await loadProgress(path,run),progress);
  assert.equal((await stat(path)).mode&0o777,0o600);
  await assert.rejects(loadProgress(path,'00000000-0000-4000-8000-000000000002'),/Invalid saved/);
 } finally {await rm(dir,{recursive:true,force:true});}
});

test('complete Stripe session URL and fragment reach Chrome and clickable terminal output intact',async()=>{
 const url='https://checkout.stripe.com/c/pay/cs_test_existing#fidkdWxOYHwnPyd1blpxYHZxWjA0%2Babc';
 const checkout={donationId:crypto.randomUUID(),checkoutReference:'cs_test_existing',approvalURL:url};
 assert.equal(await resolveApprovalURL(checkout,'stripe',()=>assert.fail('already have URL')),url);
 const calls=[];
 openCheckout(url,'stripe','darwin',(...args)=>calls.push(args));
 assert.equal(calls[0][1][2],url);
 let tty='',plain='';
 printCheckoutLink(url,'stripe',{isTTY:true,write:value=>tty+=value});
 printCheckoutLink(url,'stripe',{isTTY:false,write:value=>plain+=value});
 assert(tty.includes('\x1b]8;;'+url+'\x1b\\'));
 assert(plain.includes('\n'+url+'\n'));
 assert(!plain.includes('\x1b'));
});

test('older deployed API missing URL recovers the same session without changing request identity',async()=>{
 const checkout={donationId:crypto.randomUUID(),checkoutReference:'cs_test_existing'};
 const before=structuredClone(checkout);
 let prompts=0;
 const url=await resolveApprovalURL(checkout,'stripe',async message=>{
  prompts++;assert(message.includes(checkout.checkoutReference));
  return ' https://checkout.stripe.com/c/pay/cs_test_existing#full-fragment ';
 });
 assert.equal(url,'https://checkout.stripe.com/c/pay/cs_test_existing#full-fragment');
 assert.deepEqual(checkout,before);assert.equal(prompts,1);
 await assert.rejects(resolveApprovalURL(checkout,'stripe',async()=>''),/same run UUID/);
 for(const approvalURL of ['cs_test_existing','https://dashboard.stripe.com/test/payments/existing','https://checkout.stripe.com/c/pay/cs_test_other','https://checkout.stripe.com/','https://checkout.stripe.com/c/pay/cs_test_existing\n#broken']) {
  await assert.rejects(resolveApprovalURL({...checkout,approvalURL},'stripe',()=>assert.fail('do not replace session')));
 }
 assert.equal(await resolveApprovalURL({checkoutReference:'TESTORDER12345',approvalURL:'https://www.sandbox.paypal.com/checkoutnow?token=TESTORDER12345'},'paypal',()=>assert.fail()),'https://www.sandbox.paypal.com/checkoutnow?token=TESTORDER12345');
});
