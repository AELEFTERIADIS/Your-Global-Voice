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
