import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { validateInquiry, recipientFor } from '../scripts/contact-delivery.mjs';

test('application retains every multi-select value and submits a valid inquiry only after service verification', async () => {
  const source = await readFile(new URL('../public/contact.js', import.meta.url), 'utf8');
  for (const scenario of ['country', 'manual', 'failure']) {
    const accepted = scenario !== 'failure';
    let callback, payload, resets = 0;
    const submit = { disabled: true }, status = {}, result = {};
    const values = [['name', 'Application Test'], ['email', 'test@example.org'], ['phone', '555 0100'], ['dialCode', '+1'], ['dialCountry', 'Canada'], ['location', scenario === 'manual' ? 'Other' : 'Canada'], ['locationOther', 'Test location'], ['causes', 'Animal Welfare'], ['causes', 'Human Rights & Dignity'], ['interests', 'Volunteering'], ['interests', 'Sharing Ideas'], ['other', 'Test idea'], ['message', 'Application message'], ['consent', 'yes'], ['website', '']];
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
    assert.match(payload.message, /Volunteering, Sharing Ideas/);
    assert.match(payload.message, /Phone Number: \+1 555 0100/);
    assert.ok(payload.message.includes('Country / Location: ' + (scenario === 'manual' ? 'Test location' : 'Canada')));
    assert.match(payload.message, /Other: Test idea/);
    assert.equal(payload.token, 'verified');
    assert.equal(resets, accepted ? 1 : 0);
    assert.equal(result.className, accepted ? 'contact-success' : 'contact-error');
    assert.match(result.textContent, accepted ? /application has been submitted successfully/ : /Unable to send/);
  }
});


test('country picker contains 195 alphabetized countries followed by Other, with a separate manual input', async () => {
  const { renderApplication } = await import('../scripts/application.mjs');
  const html = renderApplication();
  const countryMarkup = html.slice(html.indexOf('id="application-country-options"'), html.indexOf('<div class="country-manual"'));
  const options = [...countryMarkup.matchAll(/data-country="([^"]+)"/g)].map(match => match[1]);
  assert.equal(options.length, 196);
  assert.equal(new Set(options).size, 196);
  assert.equal(options.at(-1), 'Other');
  assert.deepEqual(options.slice(0, -1), [...options.slice(0, -1)].sort(new Intl.Collator('en').compare));
  for (const country of ['Afghanistan', 'Canada', 'Palestine', 'Vatican City (Holy See)', 'Zimbabwe']) assert.ok(options.includes(country));
  assert.match(html, /role="combobox"[^>]*aria-controls="application-country-options"/);
  assert.match(html, /name="locationOther"[^>]*disabled/);
});


test('application uses exact cause headings, approved opportunity order, verified dial data, and a 1000-character optional message', async () => {
  const { renderApplication } = await import('../scripts/application.mjs');
  const html = renderApplication();
  const causes = [...html.matchAll(/name="causes" value="([^"]+)"/g)].map(match => match[1]);
  const page = await readFile(new URL('../public/purposes.html', import.meta.url), 'utf8');
  const headings = [...page.matchAll(/<h3>([^<]+)<\/h3>/g)].map(match => match[1].replaceAll('&amp;', '&'));
  assert.deepEqual(causes, headings);
  const opportunities = [...html.matchAll(/name="interests" value="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(opportunities, ['Volunteering', 'Sharing Ideas', 'Contributing Skills & Experience', 'Community Outreach', 'Project Participation', 'Collaboration & Partnerships', 'One-Time Donations', 'Monthly Donations', 'Project Sponsorship', 'In-Kind Donations', 'Other']);
  assert.match(html, /<legend[^>]*>Opportunities to Make a Difference<\/legend>/);
  const message = html.match(/<textarea id="application-message"[^>]*>/)[0];
  assert.match(message, /maxlength="1000"/);
  assert.doesNotMatch(message, /required/);
  assert.match(html, /id="application-message-count"/);
  const dialing = JSON.parse(await readFile(new URL('../content/dialing-codes.json', import.meta.url), 'utf8'));
  assert.equal(dialing.length, 195);
  assert.equal(new Set(dialing.map(item => item.country)).size, 195);
  for (const [country, code] of [['United States', '+1'], ['United Kingdom', '+44'], ['Greece', '+30'], ['Palestine', '+970'], ['Vatican City (Holy See)', '+39']]) assert.equal(dialing.find(item => item.country === country).code, code);
  for (const item of dialing) {
    assert.match(item.iso, /^[A-Z]{2}$/);
    assert.match(item.code, /^\+[1-9]\d{0,2}$/);
    assert.equal([...item.flag].length, 2);
  }
});
