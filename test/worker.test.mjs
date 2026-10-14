import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { ContactLimits } from '../worker/index.mjs';
import { preparePages } from '../scripts/prepare-pages.mjs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('Worker restricts origins, handles preflight, and fails closed without secrets', async () => {
  const env = { CONTACT_SITE_ORIGIN: 'https://aelefteriadis.github.io' };
  const request = (origin, method = 'GET') => new Request('https://test.workers.dev/api/contact/status', { method, headers: { Origin: origin } });
  assert.equal((await worker.fetch(request('https://other.example'), env)).status, 403);
  assert.equal((await worker.fetch(request(env.CONTACT_SITE_ORIGIN, 'OPTIONS'), env)).status, 204);
  const result = await worker.fetch(request(env.CONTACT_SITE_ORIGIN), env);
  assert.equal(result.status, 503); assert.equal((await result.json()).available, false);
  assert.equal(result.headers.get('Access-Control-Allow-Origin'), env.CONTACT_SITE_ORIGIN);
});

test('persistent Worker limiter validates, routes both inboxes, rejects replay and provider errors', async () => {
  const data = new Map();
  const state = { blockConcurrencyWhile: fn => fn(), storage: { get: async key => structuredClone(data.get(key)), put: async (key, value) => data.set(key, structuredClone(value)), setAlarm: async () => {}, deleteAll: async () => data.clear() } };
  const env = { RESEND_API_KEY: 'simulated-test-key', CONTACT_MAIL_FROM: 'info@ygvoice.org' };
  const handler = new ContactLimits(state, env);
  const payload = { name: 'Test Person', email: 'test@example.org', subject: 'General Inquiries', message: 'This is a simulated inquiry.', consent: 'yes', website: '' };
  const post = body => handler.fetch(new Request('https://test.workers.dev/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
  const original = globalThis.fetch; const sent = [];
  globalThis.fetch = async (url, options) => { sent.push(JSON.parse(options.body)); return Response.json({ id: 'simulated-accepted' }); };
  try {
    assert.equal((await post({ ...payload, token: '__proto__' })).status, 400);
    for (const subject of ['General Inquiries', 'Donations & Financial Support']) {
      const status = await handler.fetch(new Request('https://test.workers.dev/api/contact/status'));
      const { token } = await status.json(); const record = data.get('window'); record.tokens[token] -= 1100;
      const response = await post({ ...payload, subject, token }); assert.equal(response.status, 200); assert.equal((await response.json()).accepted, true);
      assert.deepEqual(sent.at(-1).to, [subject.startsWith('Donations') ? 'support@ygvoice.org' : 'info@ygvoice.org']);
      assert.equal((await post({ ...payload, token })).status, 400);
    }
    assert.equal((await post(payload)).status, 429);
    await handler.alarm(); assert.equal(data.size, 0);
    const { token } = await (await handler.fetch(new Request('https://test.workers.dev/api/contact/status'))).json(); data.get('window').tokens[token] -= 1100;
    globalThis.fetch = async () => Response.json({ error: 'private details' }, { status: 403 });
    const response = await post({ ...payload, token }); assert.equal(response.status, 502); assert.ok(!(await response.text()).includes('private details'));
  } finally { globalThis.fetch = original; }
});

test('configured Pages artifact permits only exact public Worker origin; no credentials included', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'ygv-api-'));
  try {
    await preparePages(join(temp, 'pages'), 'https://contact.example.workers.dev');
    const html = await readFile(join(temp, 'pages/contact.html'), 'utf8');
    assert.match(html, /name="ygv-contact-api" content="https:\/\/contact.example.workers.dev"/);
    assert.match(html, /connect-src 'self' https:\/\/contact.example.workers.dev/);
    for (const origin of ['http://bad.workers.dev', 'https://bad.workers.dev/path', 'https://bad.example', 'https://x.workers.dev"']) await assert.rejects(() => preparePages(join(temp, 'invalid'), origin));
  } finally { await rm(temp, { recursive: true, force: true }); }
});

test('Worker rejects honeypots, missing consent, oversized bodies and expired tokens', async () => {
  const data = new Map(); const state = { blockConcurrencyWhile: fn => fn(), storage: { get: async key => structuredClone(data.get(key)), put: async (key, value) => data.set(key, structuredClone(value)), setAlarm: async () => {} } };
  const handler = new ContactLimits(state, { RESEND_API_KEY: 'simulated-test-key', CONTACT_MAIL_FROM: 'info@ygvoice.org' });
  const base = { name: 'Test Person', email: 'test@example.org', subject: 'General Inquiries', message: 'This is only a test inquiry.', consent: 'yes', website: '' };
  const { token } = await (await handler.fetch(new Request('https://test.workers.dev/api/contact/status'))).json();
  data.get('window').tokens[token] -= 1100;
  const post = body => handler.fetch(new Request('https://test.workers.dev/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
  assert.equal((await post({ ...base, token, website: 'spam' })).status, 400);
  assert.equal((await post({ ...base, token, consent: '' })).status, 400);
  assert.equal((await post({ ...base, token, message: 'x'.repeat(33000) })).status, 413);
  data.get('window').tokens[token] -= 900000;
  assert.equal((await post({ ...base, token })).status, 400);
});

test('Pages workflow connects the confirmed production Worker and isolates its permission to Contact', async () => {
  const workflow = await readFile(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  const origin = workflow.match(/^\s+CONTACT_API_ORIGIN: (https:\/\/\S+)$/m)?.[1];
  assert.equal(origin, 'https://ygvoice-contact.andyelft.workers.dev');
  const temp = await mkdtemp(join(tmpdir(), 'ygv-production-contact-'));
  try {
    await preparePages(join(temp, 'pages'), origin);
    const contact = await readFile(join(temp, 'pages/contact.html'), 'utf8');
    assert.ok(contact.includes(`name="ygv-contact-api" content="${origin}"`));
    assert.ok(contact.includes(`connect-src 'self' ${origin}`));
    const { pagesFiles } = await import('../scripts/prepare-pages.mjs');
    for (const file of pagesFiles.filter(file => file !== 'contact.html')) {
      assert.ok(!(await readFile(join(temp, 'pages', file), 'utf8')).includes(origin));
    }
  } finally { await rm(temp, { recursive: true, force: true }); }
});

test('all three configured website origins receive exact CORS headers for initialization, preflight and submission', async () => {
  const config = await readFile(new URL('../worker/wrangler.toml', import.meta.url), 'utf8');
  const origins = config.match(/^CONTACT_SITE_ORIGINS = "([^"]+)"$/m)[1];
  const expected = ['https://aelefteriadis.github.io', 'https://ygvoice.org', 'https://www.ygvoice.org'];
  assert.deepEqual(origins.split(','), expected);
  let forwarded = 0;
  const env = { CONTACT_SITE_ORIGINS: origins, RESEND_API_KEY: 'simulated-only', CONTACT_MAIL_FROM: 'info@ygvoice.org', CONTACT_LIMITS: { idFromName: name => name, get: () => ({ fetch: async request => { forwarded++; return Response.json(request.method === 'POST' ? { accepted: true } : { available: true, token: 'simulated-only' }); } }) } };
  for (const origin of expected) {
    for (const method of ['GET', 'OPTIONS', 'POST']) {
      const path = method === 'GET' ? '/api/contact/status' : '/api/contact';
      const response = await worker.fetch(new Request('https://test.workers.dev' + path, { method, headers: { Origin: origin, 'CF-Connecting-IP': '192.0.2.1', 'Content-Type': 'application/json' }, ...(method === 'POST' ? { body: '{}' } : {}) }), env);
      assert.equal(response.status, method === 'OPTIONS' ? 204 : 200);
      assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
      assert.equal(response.headers.get('Vary'), 'Origin');
      if (method === 'OPTIONS') assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'Content-Type');
    }
  }
  assert.equal(forwarded, 6);
  for (const origin of ['https://other.example', 'http://ygvoice.org', 'https://ygvoice.org.evil.example', 'null', 'https://ygvoice.org:8443']) {
    const response = await worker.fetch(new Request('https://test.workers.dev/api/contact/status', { headers: { Origin: origin } }), env);
    assert.equal(response.status, 403); assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  }
  assert.equal((await worker.fetch(new Request('https://test.workers.dev/api/contact/status'), env)).status, 403);
});

test('approved origins can read initialization errors without bypassing verification', async () => {
  const origins = ['https://aelefteriadis.github.io', 'https://ygvoice.org', 'https://www.ygvoice.org'];
  for (const origin of origins) {
    const base = { CONTACT_SITE_ORIGINS: origins.join(','), RESEND_API_KEY: 'simulated-only', CONTACT_MAIL_FROM: 'info@ygvoice.org' };
    let forwarded = false;
    const cases = [
      { status: 403, ip: false, env: { ...base, CONTACT_LIMITS: { idFromName: () => { forwarded = true; throw new Error('Must not forward without trusted IP'); } } } },
      { status: 503, ip: true, env: { ...base, RESEND_API_KEY: '' } },
      { status: 502, ip: true, env: { ...base, CONTACT_LIMITS: { idFromName: () => { throw new Error('Simulated unavailable binding'); } } } },
      { status: 429, ip: true, env: { ...base, CONTACT_LIMITS: { idFromName: name => name, get: () => ({ fetch: async () => Response.json({ message: 'Please wait.' }, { status: 429 }) }) } } }
    ];
    for (const scenario of cases) {
      const response = await worker.fetch(new Request('https://test.workers.dev/api/contact/status', { headers: { Origin: origin, ...(scenario.ip ? { 'CF-Connecting-IP': '192.0.2.1' } : {}) } }), scenario.env);
      assert.equal(response.status, scenario.status);
      assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
      assert.equal(response.headers.get('Vary'), 'Origin');
      assert.equal(response.headers.get('Cache-Control'), 'no-store');
      const body = await response.json();
      assert.notEqual(body.available, true); assert.equal(body.token, undefined);
    }
    assert.equal(forwarded, false);
  }
});
