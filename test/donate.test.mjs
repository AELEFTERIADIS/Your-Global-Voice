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
  assert.match(html, /No tax-deductibility claim is made/);
  assert.doesNotMatch(html, /IRS|501\(c\)/);
  assert.equal((await fetch(base + '/donate.html', { method: 'POST', body: 'simulated' })).status, 405);
  for (const asset of ['donate.css', 'donate.js', 'paypal-logo.svg', 'amex-logo.svg', 'link-logo.svg', 'visa-logo.svg', 'mastercard-logo.svg', 'discover-logo.svg']) assert.equal((await fetch(base + '/' + asset)).status, 200);
  const script = await readFile(new URL('../public/donate.js', import.meta.url), 'utf8');
  assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/);
});

test('donation renderer preserves the original site wrapper and emits approved giving content', async () => {
  const html = renderDonate();
  for (const text of ['Your Generosity', 'Their Hope', 'Our Shared Future', 'My Voice + Your Voice = Our Voice', 'Every Gift Brings Hope', 'Other Ways to Support Our Mission', 'Corporate &amp; Institutional Giving', 'Your Trust Matters', 'mailto:support@ygvoice.org']) assert.ok(html.includes(text), text);
  for (const amount of [10, 25, 50, 100, 250]) assert.ok(html.includes(`name="giving-amount" value="${amount}"`));
  assert.ok(html.includes('value="custom"')); assert.ok(html.includes('One-Time Donation')); assert.ok(html.includes('Monthly Donation'));
  assert.equal((html.match(/href="purposes.html"/g) || []).length, 0);
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
  assert.doesNotMatch(html, /Compassion knows no borders|<p class="lead">/);
  assert.ok(html.includes('<h1>Your Generosity<br>Their Hope<br><span class="donation-headline-last">Our Shared Future</span></h1><p class="donation-motto">My Voice + Your Voice = Our Voice</p>'));
  assert.doesNotMatch(html, /Explore ways to give|href="#giving-hope"|donation-hero-divider|✦/);
  assert.ok(html.includes('<h1>Your Generosity<br>Their Hope<br><span class="donation-headline-last">Our Shared Future</span></h1>'));
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
  assert.ok(closing.includes('<p>For more information or general inquiries, please <a class="donation-trust-contact" href="contact.html">Contact Us</a></p>'));
  assert.doesNotMatch(closing, /<button\b|<form\b/);
});

test('Donate contains only the four requested sections in order', () => {
  const html = renderDonate();
  const labels = [...html.matchAll(/<section[^>]*>/g)].map(match => match[0]);
  assert.equal(labels.length, 4);
  assert.ok(labels[0].includes('donation-intro'));
  assert.ok(labels[1].includes('aria-labelledby="giving-hope"'));
  assert.ok(labels[2].includes('aria-labelledby="giving-heading"'));
  assert.ok(labels[3].includes('aria-labelledby="trust-heading"'));
  assert.doesNotMatch(html, /donation-invitation|donation-mission|Four Purposes\. A Shared Commitment|Explore this purpose|Take Action &amp; Get Involved/);
});

test('donation section includes the exact approved message beside the original checkout component', () => {
  const html = renderDonate();
  assert.ok(html.includes('<h2>Be a Voice for Change</h2>'));
  assert.ok(html.replace(/<[^>]*>/g, '').includes('Join our organization, Your Global Voice, to fight against persecution and discrimination in all forms, respond to humanitarian crises, protect animals from cruelty, abuse, and neglect, and defend our environment from destruction across the globe.'));
  assert.ok(html.includes('Take action today and help us build a better world for all.'));
  assert.ok(html.indexOf('class="donation-message"') < html.indexOf('class="donation-payment"'));
});

test('left message preserves four exact paragraphs and the sole approved bold emphasis', () => {
  const html = renderDonate();
  const body = html.slice(html.indexOf('<div class="donation-message-body">'), html.indexOf('<div class="donation-payment">'));
  const paragraphs = [...body.matchAll(/<p class="donation-message-paragraph">([\s\S]*?)<\/p>/g)].map(match => match[1].replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]*>/g, ''));
  assert.deepEqual(paragraphs, ["Join our organization, Your Global Voice, to fight against persecution and discrimination in all forms, respond to humanitarian crises, protect animals from cruelty, abuse, and neglect, and defend our environment from destruction across the globe.", "Around the world, countless individuals, communities, animals, and our environment need compassion, protection, and support.", "Your generosity can bring hope and make a meaningful difference.", "Take action today and help us build a better world for all."]);
  assert.deepEqual([...body.matchAll(/data-icon="([^"]+)"/g)].map(match => match[1]), ['globe-2', 'heart-handshake', 'hand-heart', 'sprout']);
  assert.equal((body.match(/<strong>/g) || []).length, 1);
  assert.ok(body.includes('<strong>Your Global Voice</strong>'));
  assert.equal((body.match(/aria-hidden="true" focusable="false"/g) || []).length, 4);
});
