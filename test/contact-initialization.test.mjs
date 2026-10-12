import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
const source = await readFile(new URL('../public/contact.js', import.meta.url), 'utf8');
async function initialize({ hostname = 'aelefteriadis.github.io', api, code = 200, body = { available: true, token: 'simulated-token', message: 'Ready' }, fails = false } = {}) {
  const submit = { disabled: true }; const status = { textContent: '' }; const calls = [];
  const form = { querySelector: () => submit, addEventListener: () => {} };
  runInNewContext(source, {
    document: { querySelector: selector => selector === '.contact-form' ? form : selector === '#contact-status' ? status : selector.includes('ygv-contact-api') ? (api ? { content: api } : null) : null },
    location: { hostname, protocol: 'https:' }, AbortSignal,
    fetch: async url => { calls.push(url); if (fails) throw new Error('simulated private detail'); return { ok: code >= 200 && code < 300, status: code, json: async () => body }; }
  });
  await new Promise(resolve => setImmediate(resolve));
  return { submit, status, calls };
}

test('Pages source Contact initializes the confirmed endpoint without build metadata', async () => {
  const result = await initialize();
  assert.deepEqual(result.calls, ['https://ygvoice-contact.andyelft.workers.dev/api/contact/status']);
  assert.equal(result.submit.disabled, false);
});
test('artifact metadata takes precedence while local preview retains its existing endpoint', async () => {
  assert.deepEqual((await initialize({ api: 'https://configured.example.workers.dev' })).calls, ['https://configured.example.workers.dev/api/contact/status']);
  assert.deepEqual((await initialize({ hostname: 'localhost' })).calls, ['api/contact/status']);
});
test('initialization distinguishes service failures and never enables sending without a valid token', async () => {
  for (const [code, message] of [[403, 'authorize'], [429, '15 minutes'], [503, 'not configured'], [502, 'initialize']]) {
    const result = await initialize({ code, body: { available: false } });
    assert.equal(result.submit.disabled, true); assert.ok(result.status.textContent.includes(message));
  }
  for (const options of [{ fails: true }, { body: { available: true } }, { body: { available: true, token: {} } }]) {
    const result = await initialize(options); assert.equal(result.submit.disabled, true); assert.match(result.status.textContent, /Unable to connect/); assert.doesNotMatch(result.status.textContent, /private detail/);
  }
});

test('exact green confirmation appears only after server acceptance; errors retain the form', async () => {
  const confirmation = 'Thank you for contacting Your Global Voice. Your message has been sent successfully. We will respond as soon as possible.';
  for (const scenario of ['accepted', 'rejected', 'unacknowledged', 'network-error']) {
    let callback; let resets = 0;
    const submit = { disabled: true }; const status = { textContent: '' }; const result = { textContent: '', className: '' };
    const form = { querySelector: () => submit, addEventListener: (event, fn) => { callback = fn; }, reportValidity: () => true, setAttribute: () => {}, removeAttribute: () => {}, reset: () => { resets++; } };
    runInNewContext(source, {
      document: { querySelector: selector => selector === '.contact-form' ? form : selector === '#contact-status' ? status : selector === '#contact-result' ? result : null },
      location: { hostname: 'aelefteriadis.github.io', protocol: 'https:' }, AbortSignal,
      FormData: class { *[Symbol.iterator]() { yield ['message', 'Simulated only']; } },
      fetch: async (url, options) => {
        if (!options.method) return { ok: true, status: 200, json: async () => ({ available: true, token: 'simulated-token', message: 'Ready' }) };
        assert.equal(result.className, ''); assert.notEqual(result.textContent, confirmation);
        if (scenario === 'network-error') throw new Error('private details');
        return { ok: scenario !== 'rejected', json: async () => ({ accepted: scenario === 'accepted', message: scenario === 'accepted' ? confirmation : 'Your message could not be confirmed as received.' }) };
      }
    });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(result.textContent, '');
    await callback({ preventDefault() {} });
    if (scenario === 'accepted') { assert.equal(result.textContent, confirmation); assert.equal(result.className, 'contact-success'); assert.equal(resets, 1); }
    else { assert.match(result.textContent, /could not be confirmed/); assert.equal(result.className, 'contact-error'); assert.equal(resets, 0); }
  }
});
