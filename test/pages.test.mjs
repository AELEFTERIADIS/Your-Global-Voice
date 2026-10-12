import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, access, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { preparePages, pagesFiles, assets } from '../scripts/prepare-pages.mjs';

test('Pages artifact preserves all eight pages, excludes private files, and works under a project path', async (t) => {
  const temp = await mkdtemp(join(tmpdir(), 'ygv-pages-test-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const destination = join(temp, 'Your-Global-Voice');
  await preparePages(destination);
  assert.deepEqual((await readdir(destination)).sort(), [...pagesFiles, ...assets, '.nojekyll'].sort());
  for (const file of pagesFiles) {
    const html = await readFile(join(destination, file), 'utf8');
    const source = await readFile(new URL(`../public/${file}`, import.meta.url), 'utf8');
    assert.match(html, /http-equiv="Content-Security-Policy"/);
    assert.equal(html.replace(/\n  <meta http-equiv="Content-Security-Policy" content="[^"]+">/, '').replace(/\n  <meta name="ygv-hosting" content="static">/, ''), source);
    for (const [, target] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(#|mailto:|https:)/.test(target)) continue;
      assert.ok(!target.startsWith('/'));
      assert.equal(new URL(target, `https://example.github.io/Your-Global-Voice/${file}`).pathname, `/Your-Global-Voice/${target}`);
      await access(new URL(target, pathToFileURL(join(destination, file))));
    }
  }
  assert.match(await readFile(join(destination, 'contact.html'), 'utf8'), /name="ygv-hosting" content="static"/);
  assert.match(await readFile(join(destination, 'contact.js'), 'utf8'), /ygv-hosting/);
  for (const asset of assets) assert.deepEqual(await readFile(join(destination, asset)), await readFile(new URL(`../public/${asset}`, import.meta.url)));
});

test('Pages preparation refuses to overwrite existing work', async (t) => {
  const temp = await mkdtemp(join(tmpdir(), 'ygv-pages-existing-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  await assert.rejects(() => preparePages(temp), { code: 'EEXIST' });
  assert.deepEqual(await readdir(temp), []);
});

test('publication guard accepts only the project URL and approved custom domain roots', async () => {
  const { validatePagesUrl } = await import('../scripts/validate-pages-url.mjs');
  for (const value of ['https://aelefteriadis.github.io/Your-Global-Voice', 'https://aelefteriadis.github.io/Your-Global-Voice/', 'https://ygvoice.org', 'https://ygvoice.org/', 'https://www.ygvoice.org', 'https://www.ygvoice.org/', 'http://ygvoice.org', 'http://ygvoice.org/', 'http://www.ygvoice.org', 'http://www.ygvoice.org/']) assert.ok(validatePagesUrl(value));
  for (const value of ['http://ygvoice.org/unapproved/', 'http://www.ygvoice.org:8080/', 'http://ygvoice.org.evil.example/', 'ftp://ygvoice.org/', 'https://ygvoice.org/unapproved/', 'https://ygvoice.org.evil.example/', 'https://ygvoice.org/?redirect=evil', 'https://ygvoice.org/#anchor', 'https://ygvoice.org:8443/', 'https://user:password@www.ygvoice.org/', 'http://aelefteriadis.github.io/Your-Global-Voice/', 'https://aelefteriadis.github.io/another-site/', 'https://aelefteriadis.github.io.evil.example/Your-Global-Voice/', 'https://user:password@aelefteriadis.github.io/Your-Global-Voice/']) assert.throws(() => validatePagesUrl(value));
});

test('repository root opens the real public homepage rather than README', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /http-equiv="refresh" content="0; url=public\/index.html"/);
  assert.match(html, /href="public\/index.html"/);
  await access(new URL('../public/index.html', import.meta.url));
});

test('Pages source switch updates only build_type and refuses custom domains', async () => {
  const { configurePagesSource } = await import('../scripts/configure-pages-source.mjs');
  const original = { html_url: 'https://aelefteriadis.github.io/Your-Global-Voice/', cname: null, build_type: 'legacy' };
  const calls = [];
  let reads = 0;
  const request = async (url, options) => {
    calls.push({ url, options });
    if (options.method === 'PUT') return { ok: true };
    reads++;
    return { ok: true, json: async () => ({ ...original, build_type: reads === 1 ? 'legacy' : 'workflow' }) };
  };
  await configurePagesSource({ repository: 'AELEFTERIADIS/Your-Global-Voice', token: 'test-only', request });
  const update = calls.find(c => c.options.method === 'PUT');
  assert.deepEqual(JSON.parse(update.options.body), { build_type: 'workflow' });
  for (const settings of [{ ...original, html_url: 'https://ygvoice.org/', cname: 'ygvoice.org' }, { ...original, cname: 'ygvoice.org' }]) {
    let writes = 0;
    await assert.rejects(() => configurePagesSource({ repository: 'AELEFTERIADIS/Your-Global-Voice', token: 'test-only', request: async (url, options) => { if (options.method === 'PUT') writes++; return { ok: true, json: async () => settings }; } }));
    assert.equal(writes, 0);
  }
  await assert.rejects(() => configurePagesSource({ repository: 'AELEFTERIADIS/Your-Global-Voice', token: 'test-only', request: async (url, options) => options.method === 'PUT' ? { ok: false, status: 403 } : { ok: true, json: async () => original } }), /Source to GitHub Actions/);
});
