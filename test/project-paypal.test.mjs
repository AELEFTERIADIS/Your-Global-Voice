import test from 'node:test';
import assert from 'node:assert/strict';
import { paypalRequest, paypalDurable, paypalApprovalURL } from '../worker/project-paypal.mjs';
const nonceId = '00000000-0000-4000-8000-000000000001';
const route = '/api/projects/dignity/paypal';
function request(path, body, origin = 'https://ygvoice.org') { return new Request('https://worker.example' + route + path, { method: body ? 'POST' : 'GET', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' }, ...(body ? { body: JSON.stringify(body) } : {}) }); }
function storage() { const map = new Map(); return { map, get: async key => structuredClone(map.get(key)), put: async (key,value) => map.set(key, structuredClone(value)), setAlarm: async () => {} }; }
function fixture() {
 const records = new Map(), calls = [];
 const env = { PAYPAL_CHECKOUT_ENABLED: 'true', PAYPAL_CLIENT_ID: crypto.randomUUID(), PAYPAL_CLIENT_SECRET: 'simulated-secret', CONTACT_SITE_ORIGINS: 'https://ygvoice.org,https://www.ygvoice.org,https://aelefteriadis.github.io' };
 let capturedAmount = '25.00', captureStatus = 'COMPLETED', currency = 'USD', failed = false, approval = 'https://www.paypal.com/checkoutnow?token=TESTORDER12345';
 const transport = async (url, options) => {
  calls.push({url,options});
  if (failed) return Response.json({ secret: 'private provider error' }, { status: 401 });
  if (url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'simulated-access-token', expires_in: 300 });
  if (url.endsWith('/v2/checkout/orders')) return Response.json({ id: 'TESTORDER12345', links: [{rel:'payer-action',href:approval}] });
  assert.match(url, /\/TESTORDER12345\/capture$/);
  return Response.json({ id:'TESTORDER12345', status:captureStatus, purchase_units:[{ reference_id:'voices-for-dignity', payments:{ captures:[{status:captureStatus, amount:{value:capturedAmount,currency_code:currency}}] } }] });
 };
 env.CONTACT_LIMITS = { idFromName: name => name, get: name => ({ fetch: req => { if (!records.has(name)) records.set(name,storage()); return paypalDurable(req,env,records.get(name),transport); } }) };
 return {env,transport,calls,records, amount: value => capturedAmount=value, status: value => captureStatus=value, currency: value => currency=value, fail: () => failed=true, approval: value=>approval=value};
}
test('PayPal readiness verifies credentials, exact CORS and explicit enable flag', async () => {
 const f=fixture();
 assert.equal((await paypalRequest(request('/status',null,'https://evil.example'), f.env,f.transport)).status,403);
 const result=await paypalRequest(request('/status'),f.env,f.transport);assert.equal(result.headers.get('Access-Control-Allow-Origin'),'https://ygvoice.org');assert.equal((await result.json()).available,true);
 for(const key of ['PAYPAL_CLIENT_ID','PAYPAL_CLIENT_SECRET','PAYPAL_CHECKOUT_ENABLED']) {const result=await paypalRequest(request('/status'),{...f.env,[key]:''},f.transport);assert.equal((await result.json()).available,false);}
 const broken=fixture();broken.fail();assert.equal((await (await paypalRequest(request('/status'),broken.env,broken.transport)).json()).available,false);
});
test('PayPal creates exact amounts and project identifiers without trusting client currency or return URLs',async()=>{
 for (const cents of [100,2500,5000,10000,25000,12345,1000000]) {
 const f=fixture();const response=await paypalRequest(request('/orders',{amountCents:cents,requestId:nonceId,currency:'eur',return_url:'https://evil.example'}),f.env,f.transport);
 assert.equal(response.status,200);const result=await response.json();assert.equal(result.url,'https://www.paypal.com/checkoutnow?token=TESTORDER12345');assert(!JSON.stringify(result).includes('secret'));
 const call=f.calls.find(c=>c.url.endsWith('/v2/checkout/orders'));const data=JSON.parse(call.options.body);
 assert.equal(data.purchase_units[0].amount.value,(cents/100).toFixed(2));assert.equal(data.purchase_units[0].amount.currency_code,'USD');assert.equal(data.purchase_units[0].custom_id,'voices-for-dignity');assert.match(data.payment_source.paypal.experience_context.return_url,/^https:\/\/ygvoice.org\/projects.html\?paypal_return=/);
 assert.equal(call.options.headers['PayPal-Request-Id'],nonceId);
 }
});
test('capture requires server-bound approval and validates completion, exact USD amount and replay',async()=>{
 const f=fixture();await paypalRequest(request('/orders',{amountCents:2500,requestId:nonceId}),f.env,f.transport);
 const order=await f.records.get('paypal-order:TESTORDER12345').get('paypal-order');
 const capture=nonce=>paypalRequest(request('/capture',{orderId:'TESTORDER12345',nonce}),f.env,f.transport);
 assert.equal((await capture(nonceId)).status,403);
 f.amount('24.99');assert.equal((await capture(order.nonce)).status,502);
 f.amount('25.00');f.currency('EUR');assert.equal((await capture(order.nonce)).status,502);
 f.currency('USD');f.status('PENDING');assert.equal((await capture(order.nonce)).status,502);
 f.status('COMPLETED');const success=await capture(order.nonce);assert.equal((await success.json()).completed,true);
 const count=f.calls.length;assert.equal((await (await capture(order.nonce)).json()).completed,true);assert.equal(f.calls.length,count);
 const captures=f.calls.filter(c=>c.url.endsWith('/capture'));assert.equal(new Set(captures.map(c=>c.options.headers['PayPal-Request-Id'])).size,1);
});
test('invalid payloads, unsafe URLs, expiry, rate limits and provider errors fail closed',async()=>{
 const f=fixture();for(const value of [99,1000001,1.01,'2500',null]) assert.equal((await paypalRequest(request('/orders',{amountCents:value,requestId:nonceId}),f.env,f.transport)).status,400);
 assert.equal((await paypalRequest(request('/orders',{amountCents:2500,requestId:nonceId,padding:'x'.repeat(1200)}),f.env,f.transport)).status,400);
 for(const url of ['https://evil.example/checkoutnow','https://www.paypal.com.evil.example/checkoutnow','http://www.paypal.com/checkoutnow','https://www.paypal.com/unrelated'])assert.throws(()=>paypalApprovalURL(url));
 const broken=fixture();broken.fail();const error=await paypalRequest(request('/orders',{amountCents:2500,requestId:nonceId}),broken.env,broken.transport);assert.equal(error.status,502);assert(!JSON.stringify(await error.json()).includes('private provider error'));
 const badLink=fixture();badLink.approval('https://evil.example/checkoutnow?token=TESTORDER12345');assert.equal((await paypalRequest(request('/orders',{amountCents:2500,requestId:nonceId}),badLink.env,badLink.transport)).status,502);
 const good=fixture();await paypalRequest(request('/orders',{amountCents:2500,requestId:nonceId}),good.env,good.transport);
 const store=good.records.get('paypal-order:TESTORDER12345'),order=await store.get('paypal-order');order.expires=0;await store.put('paypal-order',order);assert.equal((await paypalRequest(request('/capture',{orderId:order.orderId,nonce:order.nonce}),good.env,good.transport)).status,403);
 for(let i=0;i<4;i++)await paypalRequest(request('/orders',{amountCents:2500,requestId:nonceId}),good.env,good.transport);
 assert.equal((await paypalRequest(request('/orders',{amountCents:2500,requestId:nonceId}),good.env,good.transport)).status,429);
});

test('readiness identifies missing configuration and sanitized authentication failures', async () => {
 for (const key of ['PAYPAL_CHECKOUT_ENABLED','PAYPAL_CLIENT_ID','PAYPAL_CLIENT_SECRET','CONTACT_LIMITS']) {
  const f=fixture(); const result=await paypalRequest(request('/status'),{...f.env,[key]:''},f.transport);
  assert.deepEqual(await result.json(),{available:false,reason:'configuration_incomplete',missing:[key]});assert.equal(f.calls.length,0);
 }
 for(const [code,reason] of [[401,'paypal_credentials_rejected'],[403,'paypal_access_denied'],[503,'paypal_service_unavailable'],[400,'paypal_authentication_failed']]) {
  const f=fixture();const result=await paypalRequest(request('/status'),f.env,async()=>Response.json({error:'private provider details',access_token:'do-not-return'}, {status:code}));
  assert.deepEqual(await result.json(),{available:false,reason});
 }
 const malformed=fixture();assert.deepEqual(await (await paypalRequest(request('/status'),malformed.env,async()=>new Response('not JSON'))).json(),{available:false,reason:'paypal_invalid_response'});
 const network=fixture();assert.deepEqual(await (await paypalRequest(request('/status'),network.env,async()=>{throw new Error('private connection details');})).json(),{available:false,reason:'paypal_unreachable'});
});
