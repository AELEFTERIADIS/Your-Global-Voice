import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { validateInquiry, recipientFor } from '../scripts/contact-delivery.mjs';

test('application retains every multi-select value and submits a valid inquiry only after service verification', async () => {
  const source = await readFile(new URL('../public/contact.js', import.meta.url), 'utf8');
  for (const accepted of [true, false]) {
    let callback, payload, resets = 0;
    const submit = { disabled: true }, status = {}, result = {};
    const values = [['name', 'Application Test'], ['email', 'test@example.org'], ['phone', '+1 555 0100'], ['location', 'Test location'], ['causes', 'Animal Welfare'], ['causes', 'Human Rights & Dignity'], ['interests', 'Volunteering'], ['interests', 'Translation'], ['other', 'Test idea'], ['message', 'Application message'], ['consent', 'yes'], ['website', '']];
    const form = { hasAttribute: () => true, querySelector: () => submit, addEventListener: (_, fn) => { callback = fn; }, reportValidity: () => true, setAttribute() {}, removeAttribute() {}, reset() { resets++; } };
    runInNewContext(source, {
      document: { querySelector: s => s === '.contact-form' ? form : s === '#contact-status' ? status : s === '#contact-result' ? result : null },
      location: { hostname: 'ygvoice.org', protocol: 'https:' }, AbortSignal, setTimeout: fn => setTimeout(fn, 0),
      FormData: class {
        *[Symbol.iterator]() { yield* values; }
        get(name) { return values.find(([key]) => key === name)?.[1]; }
        getAll(name) { return values.filter(([key]) => key === name).map(([,value]) => value); }
      },
      fetch: async (url, options) => {
        assert.match(url, /^https:\/\/ygvoice-contact\.andyelft\.workers\.dev\/api\/contact/);
        if (!options.method) return { ok: true, json: async () => ({ available: true, token: 'verified' }) };
        payload = JSON.parse(options.body);
        return { ok: accepted, json: async () => ({ accepted, message: 'Unable to send application.' }) };
      }
    });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(submit.disabled, false);
    await callback({ preventDefault() {} });
    assert.equal(validateInquiry(payload), null);
    assert.equal(recipientFor(payload.subject), 'info@ygvoice.org');
    assert.match(payload.message, /Animal Welfare, Human Rights & Dignity/);
    assert.match(payload.message, /Volunteering, Translation/);
    assert.match(payload.message, /Phone Number: \+1 555 0100/);
    assert.match(payload.message, /Country \/ Location: Test location/);
    assert.match(payload.message, /Other: Test idea/);
    assert.equal(payload.token, 'verified');
    assert.equal(resets, accepted ? 1 : 0);
    assert.equal(result.className, accepted ? 'contact-success' : 'contact-error');
    assert.match(result.textContent, accepted ? /application has been submitted successfully/ : /Unable to send/);
  }
});
