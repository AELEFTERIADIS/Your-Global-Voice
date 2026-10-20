import test from 'node:test';
import { readFile, access } from 'node:fs/promises';
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
    assert.equal((html.match(/<img\b/g) ?? []).length, route === '/donate' ? 8 : route === '/mission' ? 7 : route === '/about' ? 5 : 1);
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
    assert.match(html, /Where Every Voice Matters/);
    assert.ok(html.includes(`href="${route === "/" ? "index" : route.slice(1)}.html" aria-current="page"`));
    assert.doesNotMatch(html, /<iframe\b/);
    if (!['/contact', '/donate', '/about'].includes(route)) assert.doesNotMatch(html, /<script\b/);
    if (route === '/about') {
      assert.match(response.headers.get('content-security-policy'), /script-src 'self'/);
      assert.match(html, /<script src="about.js" defer><\/script>/);
      assert.match(html, /aria-expanded="false" aria-controls="about-who-expanded"/);
      assert.match(html, /id="about-who-expanded" hidden><p>We stand for human rights, dignity, and freedom/);
      const script = await fetch(base + '/about.js');
      assert.equal(script.status, 200);
      assert.match(script.headers.get('content-type'), /javascript/);
    }
    if (route !== '/contact') assert.doesNotMatch(html, /<form\b/);
    for (const destination of routes) assert.ok(html.includes(`href="${destination === "/" ? "index" : destination.slice(1)}.html"`));
    if (route === '/mission') {
      assert.match(html, /Be Part of Our Mission/);
      assert.doesNotMatch(html, /mission-details|mission-read-more|mission-read-less|Read More|Read Less/);
      assert.match(html, /class="mission-sections"/);
      assert.match(html, /href="purposes\.html">Explore Our Causes/);
      assert.match(html, /href="projects\.html">See Our Projects/);
      assert.doesNotMatch(html, /class="purpose-grid"|Explore our areas of focus\./);
    }
    if (['/', '/purposes'].includes(route)) {
      for (const [title, text] of expected) {
        assert.ok(html.includes(`<h3>${title}</h3>`), title);
        assert.ok(html.includes(`<p>${text}</p>`), title);
      }
    }
    if (route === '/donate') {
      assert.match(html, /Choose Your Payment Method/);
      for (const option of ['Credit or Debit Card', 'PayPal', 'Bank Transfers', 'Donations by Check', 'In-Kind Contributions', 'Corporate &amp; Institutional Giving']) assert.ok(html.includes(option));
      assert.match(html, /href="https:\/\/buy.stripe.com\/fZu9ANdgj8484zp1lX3Je00"/);
      assert.doesNotMatch(html, /<form\b/);
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

test('complete draft links, mobile navigation, and donation guidance', async (t) => {
  const server = createPreviewServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const route of ['/', '/about', '/mission', '/purposes', '/projects', '/get-involved', '/donate', '/contact']) {
    const html = await (await fetch(base + route)).text();
    assert.match(html, /<details class="mobile-menu"><summary>Menu/);
    assert.match(html, /<meta name="description"/);
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      if (/^(mailto:|https:)/.test(href)) {
        assert.ok(['/contact', '/donate'].includes(route));
        continue;
      }
      if (href.startsWith('#')) {
        assert.ok(html.includes(`id="${href.slice(1)}"`));
      } else {
        assert.equal((await fetch(new URL(href, base + route))).status, 200, `${route}: ${href}`);
      }
    }
    if (route === '/donate') {
      for (const text of ['Make checks payable', 'clothing', 'essential goods', 'international', 'Your choices here are not carried over']) assert.ok(html.includes(text), text);
      assert.match(html, /Other Ways to Support Our Mission/);
      assert.doesNotMatch(html, /tel:|<form\b|<iframe\b/);
      assert.match(html, /mailto:support@ygvoice.org/);
    }
  }
});

test('every generated page link resolves to an existing sibling file', async () => {
  const files = ['index', 'about', 'mission', 'purposes', 'projects', 'get-involved', 'donate', 'contact'];
  for (const name of files) {
    const page = new URL(`../public/${name}.html`, import.meta.url);
    const html = await readFile(page, 'utf8');
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      if (/^(#|mailto:|https:)/.test(href)) continue;
      assert.ok(!href.startsWith('/'), `${name}: root-relative link ${href}`);
      const target = new URL(href, page);
      assert.equal(new URL('.', target).href, new URL('.', page).href);
      await access(target);
    }
    const anchoredLinks = [...html.matchAll(/href="donate.html#donation-payment"/g)];
    assert.equal(anchoredLinks.length, name === 'mission' ? 1 : 0);
    if (name === 'mission') assert.match(html, /class="mission-box mission-invitation mission-support"[\s\S]*?href="donate.html#donation-payment">Donate Now/);
    for (const destination of files) {
      assert.ok(html.includes(`href="${destination}.html"`));
    }
  }
});


test('every page declares an existing PNG favicon for local and server previews', async (t) => {
  const server = createPreviewServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const name of ['index', 'about', 'mission', 'purposes', 'projects', 'get-involved', 'donate', 'contact']) {
    const local = new URL(`../public/${name}.html`, import.meta.url);
    const html = await readFile(local, 'utf8');
    const icon = html.match(/<link rel="icon" type="image\/png" href="([^"]+)">/);
    assert.ok(icon, name);
    await access(new URL(icon[1], local));
    const response = await fetch(new URL(icon[1], `${base}/${name}.html`));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.deepEqual(new Uint8Array((await response.arrayBuffer()).slice(0, 8)), new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]));
  }
});
