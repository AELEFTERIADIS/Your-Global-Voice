import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewServer } from '../scripts/server.mjs';
import { renderDonate } from '../scripts/donate.mjs';
import { readFile } from 'node:fs/promises';

test('donation preparation remains unable to collect payment or accept sensitive donor data', async t => {
  const server = createPreviewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(base + '/donate.html');
  assert.equal(response.status, 200);
  const csp = response.headers.get('content-security-policy');
  assert.match(csp, /default-src 'none'/); assert.match(csp, /script-src 'self'/); assert.match(csp, /form-action 'none'/); assert.doesNotMatch(csp, /connect-src/);
  const html = await response.text();
  assert.match(html, /class="button donation-secure" type="button" disabled/);
  assert.doesNotMatch(html, /<form\b|<iframe\b|type="(?:email|password)"|href="https?:/);
  assert.match(html, /Selections below are for preparation only/);
  assert.match(html, /preference does not create a restricted donation/);
  assert.match(html, /No tax-deductibility claim is made/);
  assert.doesNotMatch(html, /IRS|501\(c\)/);
  assert.equal((await fetch(base + '/donate.html', { method: 'POST', body: 'simulated' })).status, 405);
  for (const asset of ['donate.css', 'donate.js']) assert.equal((await fetch(base + '/' + asset)).status, 200);
  const script = await readFile(new URL('../public/donate.js', import.meta.url), 'utf8');
  assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/);
});

test('donation renderer preserves the original site wrapper and emits approved giving content', async () => {
  const html = renderDonate();
  for (const text of ['Your Generosity', 'Their Hope', 'Our Shared Future', 'Every gift matters. Every voice counts.', 'Support Our Mission', 'Choose How You Give', 'Partnerships That Create Lasting Impact', 'Your Trust Matters', 'mailto:support@ygvoice.org']) assert.ok(html.includes(text), text);
  for (const amount of [10, 25, 50, 100, 250]) assert.ok(html.includes(`name="giving-amount" value="${amount}"`));
  assert.ok(html.includes('value="custom"')); assert.ok(html.includes('One-Time Donation')); assert.ok(html.includes('Monthly Donation'));
  assert.equal((html.match(/href="purposes.html"/g) || []).length, 4);
  assert.doesNotMatch(html, /<header\b|<footer\b/);
});

test('donation hero image is locally served with correct media type and descriptive alternative text', async t => {
  const server = createPreviewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(base + '/donation-globe.webp');
  assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'image/webp');
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF'); assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  const html = renderDonate();
  assert.match(html, /class="donation-hero-image" src="donation-globe.webp" width="1122" height="1402" alt="Hands with diverse skin tones gently holding a globe"/);
  assert.equal((html.match(/<img\b/g) || []).length, 1);
  assert.ok(html.includes('<h1>Your Generosity<br>Their Hope<br>Our Shared Future</h1>'));
});
