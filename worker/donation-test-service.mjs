import { resolveDesignation } from './donation-registry.mjs';
import { createPendingDonation, attachCheckoutReference } from './donation-ledger.mjs';
const stripe = 'https://api.stripe.com/v1/checkout/sessions';
const paypal = 'https://api-m.sandbox.paypal.com';
async function jsonResponse(response) { if (!response.ok) throw new Error('Test provider request failed.'); return response.json(); }
async function paypalToken(env, send) {
 return (await jsonResponse(await send(paypal + '/v1/oauth2/token', { method:'POST', headers:{ Authorization:'Basic '+btoa(env.TEST_PAYPAL_CLIENT_ID+':'+env.TEST_PAYPAL_CLIENT_SECRET), 'Content-Type':'application/x-www-form-urlencoded' }, body:'grant_type=client_credentials', signal:AbortSignal.timeout(10000) }))).access_token;
}
function configured(env, provider) {
 if (env.DONATION_TEST_MODE !== 'true' || !env.DONATION_DB) throw new Error('Test ledger is not configured.');
 if (provider === 'stripe' ? !/^(sk|rk)_test_/.test(env.TEST_STRIPE_SECRET_KEY || '') : !env.TEST_PAYPAL_CLIENT_ID || !env.TEST_PAYPAL_CLIENT_SECRET) throw new Error('Test provider credentials are required.');
}
// Isolated test adapter: never called by the Production Worker or website.
export async function createTestCheckout(env, input, returnURL, send = fetch) {
 configured(env,input?.provider);
 const donation=await createPendingDonation(env.DONATION_DB,input);
 if(donation.checkout_reference) return {donationId:donation.id,checkoutReference:donation.checkout_reference};
 let reference, approvalURL;
 if(input.provider==='stripe') {
  const params=new URLSearchParams({mode:'payment','line_items[0][quantity]':'1','line_items[0][price_data][currency]':'usd','line_items[0][price_data][unit_amount]':String(donation.amount_cents),'line_items[0][price_data][product_data][name]':'Test donation: '+donation.designation_id,success_url:returnURL,cancel_url:returnURL});
  for(const [key,value] of Object.entries({donation_id:donation.id,designation_id:donation.designation_id,cause_id:donation.attribution.causeId,project_id:donation.attribution.projectId}))if(value) { params.set(`metadata[${key}]`,value);params.set(`payment_intent_data[metadata][${key}]`,value); }
  const result=await jsonResponse(await send(stripe,{method:'POST',headers:{Authorization:'Bearer '+env.TEST_STRIPE_SECRET_KEY,'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':'ledger-test:'+donation.id},body:params.toString(),signal:AbortSignal.timeout(15000)}));
  if(result.livemode!==false || !/^cs_test_/.test(result.id || ''))throw new Error('A test-mode Stripe Session is required.');
  reference=result.id; approvalURL=result.url;
  if(new URL(approvalURL).origin!=='https://checkout.stripe.com')throw new Error('Invalid test checkout destination.');
 } else {
  const token=await paypalToken(env,send);
  const result=await jsonResponse(await send(paypal+'/v2/checkout/orders',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','PayPal-Request-Id':donation.id},body:JSON.stringify({intent:'CAPTURE',purchase_units:[{reference_id:donation.designation_id,custom_id:donation.id,amount:{currency_code:'USD',value:(donation.amount_cents/100).toFixed(2)}}],payment_source:{paypal:{experience_context:{return_url:returnURL,cancel_url:returnURL,user_action:'PAY_NOW',shipping_preference:'NO_SHIPPING'}}}}),signal:AbortSignal.timeout(15000)}));
  reference=result.id; approvalURL=result.links?.find(link=>['payer-action','approve'].includes(link.rel))?.href;
  if(new URL(approvalURL).origin!=='https://www.sandbox.paypal.com' || !['/checkoutnow','/checkoutnow/'].includes(new URL(approvalURL).pathname))throw new Error('Invalid Sandbox checkout destination.');
 }
 // If persistence fails, retry this request ID: provider idempotency recovers the same object.
 await attachCheckoutReference(env.DONATION_DB,donation.id,reference);
 return {donationId:donation.id,checkoutReference:reference,approvalURL};
}
export async function reconcileTestDonation(env, donationId, send = fetch) {
 if(typeof donationId!=='string' || !/^[a-f0-9-]{36}$/i.test(donationId))throw new Error('Invalid donation ID.');
 if(env.DONATION_TEST_MODE!=='true' || !env.DONATION_DB)throw new Error('Test ledger is not configured.');
 const record=await env.DONATION_DB.prepare('SELECT * FROM donations WHERE id = ?').bind(donationId).first();
 if(record?.checkout_reference?.startsWith('cs_synthetic_'))throw new Error('Synthetic records cannot use provider reconciliation.');
 if(!record?.checkout_reference)throw new Error('Donation checkout not found.');
 configured(env,record.provider);
 const attribution=resolveDesignation(record.designation_id);
 if(!['pending','completed'].includes(record.status))throw new Error('Donation requires manual reconciliation.');
 let completed=false;
 if(record.provider==='stripe') {
  const result=await jsonResponse(await send(stripe+'/'+encodeURIComponent(record.checkout_reference),{headers:{Authorization:'Bearer '+env.TEST_STRIPE_SECRET_KEY},signal:AbortSignal.timeout(15000)}));
  if(result.id!==record.checkout_reference || result.livemode!==false || result.amount_total!==record.amount_cents || result.currency!=='usd' || result.metadata?.donation_id!==record.id || result.metadata?.designation_id!==record.designation_id || (result.metadata?.cause_id || null)!==attribution.causeId || (result.metadata?.project_id || null)!==attribution.projectId)throw new Error('Stripe attribution or amount mismatch.');
  completed=result.payment_status==='paid' && result.status==='complete';
 } else {
  const token=await paypalToken(env,send);
  const result=await jsonResponse(await send(paypal+'/v2/checkout/orders/'+encodeURIComponent(record.checkout_reference),{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)}));
  const unit=result.purchase_units?.[0],captures=unit?.payments?.captures;
  if(result.id!==record.checkout_reference || result.purchase_units?.length!==1 || unit.reference_id!==record.designation_id || unit.custom_id!==record.id || unit.amount?.currency_code!=='USD' || unit.amount.value!==(record.amount_cents/100).toFixed(2))throw new Error('PayPal attribution or amount mismatch.');
  completed=result.status==='COMPLETED';
  if(completed && (captures?.length!==1 || captures[0].status!=='COMPLETED' || captures[0].amount?.currency_code!=='USD' || captures[0].amount.value!==unit.amount.value))throw new Error('PayPal capture mismatch.');
 }
 if(!completed) { if(record.status==='completed')throw new Error('Provider state conflicts with completed ledger record.');return {donationId:record.id,status:'pending'}; }
 const now=new Date().toISOString(),eventId='reconcile:'+record.checkout_reference+':completed';
 // D1 batch is transactional. Event deduplication and state update succeed or roll back together.
 await env.DONATION_DB.batch([
  env.DONATION_DB.prepare("INSERT INTO donation_events (donation_id,provider,provider_event_id,event_type,occurred_at,received_at) VALUES (?, ?, ?, 'reconciled.completed', ?, ?) ON CONFLICT(provider,provider_event_id) DO NOTHING").bind(record.id,record.provider,eventId,now,now),
  env.DONATION_DB.prepare("UPDATE donations SET status = 'completed' WHERE id = ? AND status IN ('pending','completed')").bind(record.id)
 ]);
 return {donationId:record.id,status:'completed'};
}

export async function captureTestPayPal(env, donationId, send = fetch) {
 configured(env,'paypal');
 if(typeof donationId!=='string' || !/^[a-f0-9-]{36}$/i.test(donationId))throw new Error('Invalid donation ID.');
 const record=await env.DONATION_DB.prepare('SELECT * FROM donations WHERE id = ?').bind(donationId).first();
 if(!record || record.provider!=='paypal' || !record.checkout_reference)throw new Error('PayPal test order not found.');
 const token=await paypalToken(env,send),url=paypal+'/v2/checkout/orders/'+encodeURIComponent(record.checkout_reference);
 const order=await jsonResponse(await send(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)}));
 const unit=order.purchase_units?.[0];
 if(order.id!==record.checkout_reference || order.purchase_units?.length!==1 || unit.custom_id!==record.id || unit.reference_id!==record.designation_id || unit.amount?.currency_code!=='USD' || unit.amount.value!==(record.amount_cents/100).toFixed(2))throw new Error('Sandbox order attribution mismatch.');
 if(order.status!=='COMPLETED') {
  if(order.status!=='APPROVED')throw new Error('Sandbox buyer approval is required.');
  await jsonResponse(await send(url+'/capture',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','PayPal-Request-Id':'cap-'+record.id.replaceAll('-','')},body:'{}',signal:AbortSignal.timeout(15000)}));
 }
 return reconcileTestDonation(env,donationId,send);
}
