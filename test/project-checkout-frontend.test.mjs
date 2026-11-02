import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const script = await readFile(new URL('../public/projects.js', import.meta.url), 'utf8');
async function setup(available) {
 const listeners = {}, customListeners = {}, buttonListeners = {};
 let choice = '25';
 const card = { disabled: true, addEventListener: (name, fn) => buttonListeners[name] = fn };
 const custom = { value: '', disabled: true, checkValidity: () => true, addEventListener: (name, fn) => customListeners[name] = fn };
 const summary = {}, status = {}, sent = [], destinations = [];
 const giving = { addEventListener: (name, fn) => listeners[name] = fn, querySelector: selector => ({ '.project-custom': custom, '.project-giving-summary': summary, '.project-payment-pending button': card, '#dignity-payment-status': status }[selector] || { value: choice }) };
 const context = { document: { querySelectorAll: selector => selector === '.project-giving' ? [giving] : [], querySelector: () => ({ content: 'https://ygvoice-contact.andyelft.workers.dev' }) }, window: { matchMedia: () => ({ matches: false }), location: { assign: url => destinations.push(url) } }, Intl, URL, AbortSignal, crypto, fetch: async (url, options) => {
  if (url.endsWith('/status')) return Response.json({ available });
  sent.push(JSON.parse(options.body)); return Response.json({ url: 'https://checkout.stripe.com/c/pay/cs_test_simulated' });
 } };
 vm.runInNewContext(script, context);
 await new Promise(resolve => setImmediate(resolve));
 return { card, custom, sent, destinations, select(value) { choice = value; listeners.change(); }, enter(value) { custom.value = value; customListeners.input(); }, click: () => buttonListeners.click() };
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
