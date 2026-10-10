import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewServer } from '../scripts/server.mjs';

test('homepage, assets, and preview security boundaries', async (t) => {
  const server = createPreviewServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  const home = await fetch(base);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-type'), /text\/html/);
  assert.match(home.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
  const html = await home.text();
  assert.match(html, /<title>Your Global Voice, Inc\.<\/title>/);
  assert.match(html, /<main id="main"/);
  assert.match(html, /href="#main"/);
  assert.doesNotMatch(html, /<script\b|<form\b/);

  const css = await fetch(`${base}/styles.css`);
  assert.equal(css.status, 200);
  assert.match(css.headers.get('content-type'), /text\/css/);
  assert.ok((await css.text()).length > 0);

  const head = await fetch(base, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');

  for (const path of ['/README.md', '/.git/config', '/package.json', '/%2e%2e/README.md', '/missing']) {
    assert.equal((await fetch(`${base}${path}`)).status, 404);
  }
  const post = await fetch(base, { method: 'POST' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
});

test('all pages share working navigation and preserve the approved purposes', async (t) => {
  const server = createPreviewServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  // Independent reference: changes to the content file must not silently rewrite official wording.
  const expected = [
    ['Religious, Racial, and Ethnic Persecution and Discrimination', 'To provide charitable assistance, support, and advocacy for individuals and communities who face persecution or discrimination based on religion, race, ethnicity, nationality, or national origin, and to help address the consequences of such persecution or discrimination.'],
    ['Humanitarian Assistance and Relief', 'To provide charitable humanitarian assistance and relief to individuals and communities in need through the provision of food, clothing, housing assistance, essential supplies, and emergency assistance.'],
    ['Animal Welfare Assistance', 'To provide charitable financial assistance and support for the care and well-being of animals.'],
    ['Environmental Conservation and Sustainability', 'To conduct and support charitable environmental conservation and sustainability initiatives, including the preservation and restoration of forests, the planting of trees, the protection of natural resources, and environmental improvement initiatives.'],
  ];
  const routes = ['/', '/about', '/mission', '/purposes', '/projects', '/get-involved', '/donate', '/contact'];
  for (const route of routes) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.equal((html.match(/<img\b/g) ?? []).length, 1);
    assert.match(html, /class="header-logo"[^>]*alt="Your Global Voice official logo"/);
    const logoPath = html.match(/class="header-logo" src="([^"]+)"/)[1];
    const logo = await fetch(new URL(logoPath, response.url));
    assert.equal(logo.status, 200);
    assert.equal(logo.headers.get('content-type'), 'image/png');
    assert.match(response.headers.get('content-security-policy'), /img-src 'self'/);
    assert.deepEqual(new Uint8Array((await logo.arrayBuffer()).slice(0, 8)), new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]));
    assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
    assert.match(html, /<link rel="stylesheet" href="styles\.css">/);
    const stylesheet = await fetch(new URL('styles.css', response.url));
    assert.equal(stylesheet.status, 200);
    assert.match(stylesheet.headers.get('content-type'), /text\/css/);
    assert.match(html, /MY VOICE \+ YOUR VOICE = OUR VOICE/);
    assert.ok(html.includes(`href="${route}" aria-current="page"`));
    assert.doesNotMatch(html, /<script\b|<form\b|<iframe\b/);
    for (const destination of routes) assert.ok(html.includes(`href="${destination}"`));
    if (['/', '/mission', '/purposes'].includes(route)) {
      for (const [title, text] of expected) {
        assert.ok(html.includes(`<h3>${title}</h3>`), title);
        assert.ok(html.includes(`<p>${text}</p>`), title);
      }
    }
    if (route === '/donate') {
      assert.match(html, /Donations are not yet available/);
      for (const option of ['Credit and debit card donations', 'PayPal', 'Zelle', 'Bank transfers', 'Checks', 'In-kind contributions']) assert.ok(html.includes(option));
      assert.doesNotMatch(html, /<input\b|<button\b|href="https?:/);
    }
  }
});

test('trailing-slash pages resolve the relative stylesheet', async (t) => {
  const server = createPreviewServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const page of ['about', 'mission', 'purposes', 'projects', 'get-involved', 'donate', 'contact']) {
    const redirect = await fetch(`${base}/${page}/?review=1`, { redirect: 'manual' });
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.get('location'), `/${page}?review=1`);
    const response = await fetch(`${base}/${page}/`);
    assert.equal(response.status, 200);
    const css = await fetch(new URL('styles.css', response.url));
    assert.equal(css.status, 200);
    assert.match(css.headers.get('content-type'), /text\/css/);
  }
});
