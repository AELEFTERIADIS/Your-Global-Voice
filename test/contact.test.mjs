import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderContact, contactEndpoint } from '../scripts/contact.mjs';
import { createPreviewServer } from '../scripts/server.mjs';
const config = JSON.parse(await readFile(new URL('../content/contact.json', import.meta.url), 'utf8'));

test('approved contact details and unavailable delivery are accurately rendered', () => {
  const html = renderContact(config);
  for (const value of ['mailto:info@ygvoice.org', 'mailto:support@ygvoice.org', 'https://wa.me/16316379508', '957 Broadway Avenue', 'Holbrook, NY 11741', 'USA']) assert.ok(html.includes(value));
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /nothing is transmitted/);
  assert.match(html, /type="submit" disabled/);
  assert.doesNotMatch(html, /action=|<script/);
  assert.equal(contactEndpoint(config), null);
});

test('configured form uses validated HTTPS endpoint and escapes contact data', () => {
  const html = renderContact({ ...config, formEndpoint: 'https://example.org/form?id=1&mode=contact', mailingAddress: ['<script>'] });
  assert.ok(html.includes('action="https://example.org/form?id=1&amp;mode=contact"'));
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /type="submit" disabled/);
  for (const formEndpoint of ['http://example.org', 'javascript:alert(1)', 'https://user:password@example.org', 'https://example.org/#fragment']) assert.throws(() => contactEndpoint({ formEndpoint }));
  assert.throws(() => renderContact({ ...config, whatsappNumber: 'invalid' }));
  assert.throws(() => renderContact({ ...config, emails: [{ label: 'Unsafe', address: 'person@example.org\r\nBcc:other@example.org' }] }));
});

test('Contact assets load and unconfigured form cannot post data to preview server', async (t) => {
  const server = createPreviewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(base + '/contact.html');
  assert.match(page.headers.get('content-security-policy'), /form-action 'none'/);
  assert.match(await page.text(), /href="contact.css"/);
  const css = await fetch(base + '/contact.css');
  assert.equal(css.status, 200);
  assert.match(css.headers.get('content-type'), /text\/css/);
  assert.equal((await fetch(base + '/contact.html', { method: 'POST', body: 'message=test' })).status, 405);
});
