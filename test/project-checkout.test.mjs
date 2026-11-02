import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.mjs';
import { createProjectSession } from '../worker/project-checkout.mjs';
const env = { STRIPE_CHECKOUT_ENABLED: 'true', STRIPE_SECRET_KEY: 'simulated-test-secret', CONTACT_SITE_ORIGIN: 'https://ygvoice.org' };
const req = (amountCents, extra = {}) => new Request('https://worker.example/api/projects/dignity/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://ygvoice.org' }, body: JSON.stringify({ amountCents, requestId: '00000000-0000-4000-8000-000000000001', ...extra }) });
function storage() { const map = new Map(); return { get: async k => map.get(k), put: async (k,v) => map.set(k,v), setAlarm: async () => {} }; }
test('project checkout fails closed and restricts origins', async () => {
 const status = origin => new Request('https://worker.example/api/projects/dignity/checkout/status', { headers: { Origin: origin } });
 assert.equal((await worker.fetch(status('https://evil.example'), env)).status, 403);
 assert.equal((await worker.fetch(status('https://ygvoice.org'), {})).status, 403);
 assert.equal((await (await worker.fetch(status('https://ygvoice.org'), { ...env, STRIPE_CHECKOUT_ENABLED: 'false' })).json()).available, false);
 assert.equal((await worker.fetch(req(2500), { ...env, STRIPE_SECRET_KEY: '' })).status, 503);
 assert.equal((await (await worker.fetch(status('https://ygvoice.org'), env)).json()).available, true);
});
test('exact cents, fixed currency/project, idempotency and trusted return URLs', async () => {
 for (const cents of [100, 2500, 5000, 10000, 25000, 12345, 1000000]) {
 const result = await createProjectSession(req(cents, { currency: 'eur', project: 'other', success_url: 'https://evil.example' }), env, storage(), async (url, options) => {
 assert.equal(url, 'https://api.stripe.com/v1/checkout/sessions');
 const data = new URLSearchParams(options.body);
 assert.equal(data.get('line_items[0][price_data][unit_amount]'), String(cents));
 assert.equal(data.get('line_items[0][price_data][currency]'), 'usd');
 assert.equal(data.get('metadata[project]'), 'voices-for-dignity');
 assert.equal(data.get('payment_intent_data[metadata][project]'), 'voices-for-dignity');
 assert.equal(data.get('success_url'), 'https://ygvoice.org/projects.html');
 assert.match(options.headers['Idempotency-Key'], /^voices-for-dignity:/);
 return Response.json({ id: 'cs_test_mock', url: 'https://checkout.stripe.com/c/pay/cs_test_mock' });
 }); assert.equal(result.status, 200); assert(!JSON.stringify(await result.json()).includes(env.STRIPE_SECRET_KEY));
 }
});
test('rejects invalid amounts, oversized bodies, provider errors, unsafe redirects and rate abuse', async () => {
 const never = () => { throw new Error('Must not call provider'); };
 for (const amount of [99, 1000001, 1.5, '2500', null, -100]) assert.equal((await createProjectSession(req(amount), env, storage(), never)).status, 400);
 assert.equal((await createProjectSession(req(2500, { padding: 'x'.repeat(2000) }), env, storage(), never)).status, 413);
 for (const response of [Response.json({ error: 'secret provider detail' }, { status: 500 }), Response.json({ id: 'cs_test_mock', url: 'https://evil.example' })]) {
 const result = await createProjectSession(req(2500), env, storage(), async () => response); assert.equal(result.status, 502); assert(!JSON.stringify(await result.json()).includes('secret provider detail'));
 }
 const store = storage(); for (let i=0;i<5;i++) await createProjectSession(req(0), env, store, never);
 assert.equal((await createProjectSession(req(2500), env, store, never)).status, 429);
});
