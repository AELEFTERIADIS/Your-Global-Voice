import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const script = await readFile(new URL('../public/projects.js', import.meta.url), 'utf8');
async function setup(available, options = {}) {
 const listeners = {}, customListeners = {}, buttonListeners = {};
 let choice = '25';
 const card = { disabled: true, addEventListener: (name, fn) => buttonListeners[name] = fn };
 const custom = { value: '', disabled: true, checkValidity: () => true, addEventListener: (name, fn) => customListeners[name] = fn };
 const summary = {}, status = {}, sent = [], destinations = [];
 const giving = { addEventListener: (name, fn) => listeners[name] = fn, querySelector: selector => ({ '.project-custom': custom, '.project-giving-summary': summary, '.project-payment-pending button': card, '#dignity-payment-status': status }[selector] || { value: choice }) };
 const context = { document: { querySelectorAll: selector => selector === '.project-giving' ? [giving] : [], querySelector: () => ({ content: options.missingEndpoint ? '' : 'https://ygvoice-contact.andyelft.workers.dev' }) }, window: { matchMedia: () => ({ matches: false }), location: { assign: url => destinations.push(url) } }, Intl, URL, AbortSignal, crypto, fetch: async (url, requestOptions) => {
  if (url.endsWith('/status')) {
   if (options.networkError) throw new Error('Network error');
   if (options.invalidJSON) return new Response('<html>Error</html>');
   return Response.json(options.invalidShape ? {} : { available }, { status: options.httpStatus || 200 });
  }
  sent.push(JSON.parse(requestOptions.body)); return Response.json({ url: 'https://checkout.stripe.com/c/pay/cs_test_simulated' });
 } };
 vm.runInNewContext(script, context);
 await new Promise(resolve => setImmediate(resolve));
 return { card, custom, sent, destinations, status, select(value) { choice = value; listeners.change(); }, enter(value) { custom.value = value; customListeners.input(); }, click: () => buttonListeners.click() };
}
test('Card enables after availability, submits exact cents, and rejects invalid custom amounts', async () => {
 const ui = await setup(true); assert.equal(ui.card.disabled, false);
 for (const [amount, cents] of [['25',2500], ['50',5000], ['100',10000], ['250',25000]]) { ui.select(amount); assert.equal(ui.card.disabled, false); await ui.click(); assert.equal(ui.sent.at(-1).amountCents, cents); }
 ui.select('custom'); assert.equal(ui.custom.disabled, false); assert.equal(ui.card.disabled, true);
 for (const value of ['0.99', '10000.01', '1.001', '']) { ui.enter(value); assert.equal(ui.card.disabled, true); }
 for (const [value, cents] of [['1',100], ['123.45',12345], ['10000',1000000]]) { ui.enter(value); assert.equal(ui.card.disabled, false); await ui.click(); assert.equal(ui.sent.at(-1).amountCents, cents); }
 assert.equal(ui.destinations.length, 7);
});
test('Card stays disabled and cannot submit when service is unavailable', async () => {
 const ui = await setup(false); assert.equal(ui.card.disabled, true); ui.select('100'); await ui.click(); assert.equal(ui.sent.length, 0);
});

test('availability failures are explicit and never enable payment submission', async () => {
 for (const [options, message] of [
  [{ missingEndpoint: true }, /connection is not configured/],
  [{ networkError: true }, /Unable to connect/],
  [{ httpStatus: 403 }, /HTTP 403/],
  [{ httpStatus: 404 }, /HTTP 404/],
  [{ httpStatus: 503 }, /HTTP 503/],
  [{ invalidJSON: true }, /invalid response/],
  [{ invalidShape: true }, /invalid response/],
  [{}, /not enabled on the payment service/]
 ]) {
  const ui = await setup(false, options);
  assert.equal(ui.card.disabled, true); assert.match(ui.status.textContent, message);
  await ui.click(); assert.equal(ui.sent.length, 0);
 }
});
