import test from 'node:test';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { createPreviewServer } from '../scripts/server.mjs';
import { renderDonate } from '../scripts/donate.mjs';
import { readFile } from 'node:fs/promises';

test('donation page delegates payment to the authorized hosted checkout without collecting sensitive data', async t => {
  const server = createPreviewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(base + '/donate.html');
  assert.equal(response.status, 200);
  const csp = response.headers.get('content-security-policy');
  assert.match(csp, /default-src 'none'/); assert.match(csp, /script-src 'self'/); assert.match(csp, /form-action 'none'/); assert.doesNotMatch(csp, /connect-src/);
  const html = await response.text();
  assert.match(html, /class="donation-method-choice" href="https:\/\/buy.stripe.com\/fZu9ANdgj8484zp1lX3Je00" target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(html, /<form\b|<iframe\b|type="(?:email|password)"/);
  assert.match(html, /Your choices here are not carried over/);
  assert.deepEqual([...new Set([...html.matchAll(/href="(https:[^"]+)"/g)].map(match => match[1]))], ['https://buy.stripe.com/fZu9ANdgj8484zp1lX3Je00', 'https://www.paypal.com/ncp/payment/PVJ5JKDKZW8VQ']);
  assert.match(html, /class="donation-method-choice donation-paypal" href="https:\/\/www.paypal.com\/ncp\/payment\/PVJ5JKDKZW8VQ" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /preference does not create a restricted donation/);
  assert.match(html, /No tax-deductibility claim is made/);
  assert.doesNotMatch(html, /IRS|501\(c\)/);
  assert.equal((await fetch(base + '/donate.html', { method: 'POST', body: 'simulated' })).status, 405);
  for (const asset of ['donate.css', 'donate.js', 'paypal-logo.svg', 'amex-logo.svg', 'link-logo.svg', 'visa-logo.svg', 'mastercard-logo.svg', 'discover-logo.svg']) assert.equal((await fetch(base + '/' + asset)).status, 200);
  const script = await readFile(new URL('../public/donate.js', import.meta.url), 'utf8');
  assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/);
});

test('donation renderer preserves the original site wrapper and emits approved giving content', async () => {
  const html = renderDonate();
  for (const text of ['Your Generosity', 'Their Hope', 'Our Shared Future', 'MY VOICE + YOUR VOICE = OUR VOICE', 'Support Our Mission', 'Other Ways to Support Our Mission', 'Corporate &amp; Institutional Giving', 'Your Trust Matters', 'mailto:support@ygvoice.org']) assert.ok(html.includes(text), text);
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
  assert.equal((html.match(/<img\b/g) || []).length, 7);
  assert.ok(html.includes('Compassion knows no borders. Through your generosity, we can advance human dignity, provide humanitarian assistance, protect animals, and safeguard our environment.'));
  assert.ok(html.includes('Together, we can transform kindness into meaningful action and build a future where every voice matters.'));
  assert.ok(html.includes('href="#support-mission"'));
  assert.ok(html.includes('<h1>Your Generosity<br>Their Hope<br>Our Shared Future</h1>'));
});

// Frozen approved payment box; the separate left column may be refined.
test('approved donation component remains byte-for-byte unchanged', () => {
  const html = renderDonate();
  const start = html.indexOf('<div class="donation-payment">');
  const end = html.indexOf('</div></div></section>', start) + 12;
  assert.equal(createHash('sha256').update(html.slice(start, end)).digest('hex'),
    '57f157fdac24e696339a785818240ec3e76395f678de07fd715a07c1ccf1eed5');
  assert.equal((html.match(/class="donation-method-choice(?: donation-paypal)?"/g) || []).length, 2);
  assert.equal((html.match(/class="payment-brand-logo/g) || []).length, 7); // row + six images
  assert.doesNotMatch(html, /Choose How You Give|Zelle|Card processing is not connected|Partnerships That Create Lasting Impact/);
  const closing = html.slice(html.indexOf('<section class="donation-trust'));
  assert.ok(closing.includes('Together, we can turn compassion into meaningful action.'));
  assert.doesNotMatch(closing, /<a\b|<button\b|<form\b/);
});

test('mission invitation contains only the approved causes and involvement link', () => {
  const html = renderDonate();
  const invitation = html.slice(html.indexOf('<div class="donation-invitation">'), html.indexOf('<div class="donation-payment">'));
  for (const text of ['Join us in the fight against:', 'Persecution &amp; Discrimination', 'Religious intolerance, violations of fundamental freedoms, and injustice…', 'Humanitarian Crises', 'Hunger, poverty, displacement, and lack of essential care…', 'Animal Cruelty &amp; Neglect', 'Abuse, abandonment, exploitation, and suffering…', 'Environmental Destruction', 'Deforestation, pollution, habitat loss, and threats to biodiversity…']) assert.ok(invitation.includes(text), text);
  assert.equal((invitation.match(/<svg\b/g) || []).length, 4);
  assert.ok(invitation.includes('href="get-involved.html">Take Action &amp; Get Involved &rarr;'));
  assert.doesNotMatch(invitation, /Make a difference today|Your generosity can bring hope|Contact Us for Giving Arrangements/);
});
