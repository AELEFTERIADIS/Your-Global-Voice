import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderContact } from '../scripts/contact.mjs';
import { categories, recipientFor, validateInquiry, providerTransport, successMessage } from '../scripts/contact-delivery.mjs';
import { createPreviewServer } from '../scripts/server.mjs';
const config = JSON.parse(await readFile(new URL('../content/contact.json', import.meta.url), 'utf8'));
const valid = { name: 'Test Person', email: 'test@example.org', subject: categories[0], message: 'A test message containing enough information.', consent: 'yes', website: '' };
async function fixture(t, options = {}) {
  let time = 100000;
  const server = createPreviewServer({ ...options, now: () => time });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, advance: (ms = 1100) => { time += ms; },
    token: async () => (await (await fetch(base + '/api/contact/status')).json()).token,
    post: (data, origin = base, headers = {}) => fetch(base + '/api/contact', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) }) };
}

test('approved contact details, form categories, icons, and address copying are rendered', () => {
  const html = renderContact(config);
  for (const value of ['mailto:info@ygvoice.org', 'mailto:support@ygvoice.org', 'https://wa.me/16316379508', '+1 (631) 637-9508', '957 Broadway Avenue', 'Holbrook, NY 11741', 'United States of America', 'copy-address', 'Connect With Us Worldwide']) assert.ok(html.includes(value));
  for (const category of categories) assert.ok(html.includes(category.replaceAll('&', '&amp;')));
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /type="submit" disabled/);
  assert.doesNotMatch(html, /href="tel:/);
  assert.throws(() => renderContact({ ...config, whatsappNumber: 'invalid' }));
  assert.throws(() => renderContact({ ...config, emails: [{ label: 'Unsafe', address: 'person@example.org\r\nBcc:other@example.org' }] }));
  assert.ok(renderContact({ ...config, mailingAddress: ['<script>'] }).includes('&lt;script&gt;'));
});

test('server validation rejects invalid input and routes every category correctly', () => {
  assert.equal(validateInquiry(valid), null);
  for (const data of [null, {}, { ...valid, name: '  ' }, { ...valid, name: 'Name\r\nBcc:test' }, { ...valid, email: 'bad' }, { ...valid, email: 'a@b.org\r\n' }, { ...valid, subject: 'Unknown' }, { ...valid, message: 'short' }, { ...valid, message: 'a'.repeat(5001) }, { ...valid, consent: '' }]) assert.ok(validateInquiry(data));
  for (const category of categories) assert.equal(recipientFor(category), category === 'Donations & Financial Support' ? 'support@ygvoice.org' : 'info@ygvoice.org');
});

test('unconfigured delivery is unavailable; Contact assets and isolated CSP work', async (t) => {
  const f = await fixture(t, { send: null });
  assert.equal((await fetch(f.base + '/api/contact/status')).status, 503);
  assert.equal((await f.post(valid)).status, 503);
  const page = await fetch(f.base + '/contact.html');
  assert.match(page.headers.get('content-security-policy'), /script-src 'self'; connect-src 'self'; form-action 'self'/);
  assert.match((await fetch(f.base + '/about.html')).headers.get('content-security-policy'), /form-action 'none'/);
  for (const asset of ['contact.css', 'contact.js']) assert.equal((await fetch(f.base + '/' + asset)).status, 200);
});

test('accepted provider result alone produces exact success; tokens cannot be replayed', async (t) => {
  const sent = [];
  const f = await fixture(t, { send: async data => { sent.push(data); return 'provider-id'; } });
  for (const subject of categories) {
    const token = await f.token(); f.advance();
    // Advance the anti-spam rate window halfway through this exhaustive routing test.
    if (sent.length === 4) f.advance(15 * 60 * 1000 + 1);
    const activeToken = sent.length === 4 ? await f.token() : token;
    if (sent.length === 4) f.advance();
    const response = await f.post({ ...valid, subject, token: activeToken });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { message: successMessage, accepted: true });
  }
  assert.equal(sent.length, 8);
  assert.equal((await f.post({ ...valid, token: sent.at(-1).token })).status, 400);
});

test('spam, cross-origin, rate-limit, validation, and provider failure never report success', async (t) => {
  const f = await fixture(t, { send: async () => { throw new Error('private provider details'); } });
  const token = await f.token();
  assert.equal((await f.post({ ...valid, token }, 'https://other.example.org')).status, 403);
  assert.equal((await f.post({ ...valid, token }, f.base, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await f.post({ ...valid, token })).status, 400); // Too fast.
  f.advance();
  assert.equal((await f.post({ ...valid, token, website: 'spam' })).status, 400);
  assert.equal((await f.post({ ...valid, token, email: 'invalid' })).status, 400);
  const result = await f.post({ ...valid, token });
  assert.equal(result.status, 502);
  const body = await result.json(); assert.ok(!body.accepted); assert.ok(!body.message.includes('private provider'));
  assert.equal((await f.post({ ...valid, token })).status, 400);
  assert.equal((await f.post({ ...valid, token })).status, 429);
});

test('Resend payload contains full message and server-controlled routing; rejection throws', async () => {
  assert.equal(providerTransport({}), null);
  const sent = [];
  const send = providerTransport({ CONTACT_MAIL_API_KEY: 'test-only', CONTACT_MAIL_FROM: 'sender@example.org' }, async (url, request) => {
    assert.equal(url, 'https://api.resend.com/emails');
    sent.push(JSON.parse(request.body)); return { ok: true, json: async () => ({ id: 'accepted-id' }) };
  });
  for (const subject of categories) {
    assert.equal(await send({ ...valid, subject }), 'accepted-id');
    const mail = sent.at(-1);
    assert.deepEqual(mail.to, [recipientFor(subject)]);
    assert.equal(mail.reply_to, valid.email);
    for (const text of [valid.name, valid.email, subject, valid.message]) assert.ok(mail.text.includes(text));
  }
  const rejected = providerTransport({ CONTACT_MAIL_API_KEY: 'test-only', CONTACT_MAIL_FROM: 'sender@example.org' }, async () => ({ ok: false, json: async () => ({ id: 'not-accepted' }) }));
  await assert.rejects(() => rejected(valid));
});

test('oversized, malformed, expired, and unacknowledged submissions fail safely', async (t) => {
  const f = await fixture(t, { send: async () => undefined });
  let token = await f.token(); f.advance();
  assert.equal((await f.post({ ...valid, token, message: 'x'.repeat(33000) })).status, 413);
  const malformed = await fetch(f.base + '/api/contact', { method: 'POST', headers: { Origin: f.base, 'Content-Type': 'application/json' }, body: '{invalid' });
  assert.equal(malformed.status, 400);
  const unacknowledged = await f.post({ ...valid, token });
  assert.equal(unacknowledged.status, 502); assert.ok(!(await unacknowledged.json()).accepted);
  token = await f.token(); f.advance(15 * 60 * 1000 + 1);
  assert.equal((await f.post({ ...valid, token })).status, 400);
});


test('Contact source preserves the approved Google Maps address link through generation', async () => {
  const html = renderContact(config);
  const committed = await readFile(new URL('../public/contact.html', import.meta.url), 'utf8');
  const address = html.match(/<address id="mailing-address">[\s\S]*?<\/address>/)?.[0];
  assert.equal(committed.match(/<address id="mailing-address">[\s\S]*?<\/address>/)?.[0], address);
  assert.ok(address.includes('href="https://www.google.com/maps/search/?api=1&amp;query=957%20Broadway%20Avenue%2C%20Holbrook%2C%20NY%2011741"'));
  assert.match(address, /target="_blank" rel="noopener noreferrer"/);
  assert.ok(html.includes('id="copy-address"'));
});
