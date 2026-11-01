import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { preparePages } from '../scripts/prepare-pages.mjs';

test('Projects hero displays the exact latest approved artwork without HTML lettering overlays', async () => {
  const html = await readFile(new URL('../public/projects.html', import.meta.url), 'utf8');
  const hero = html.match(/<section class="page-intro projects-hero">([\s\S]*?)<\/section>/)[1];
  assert.equal((hero.match(/<h1\b/g) || []).length, 1);
  assert.match(hero, /<h1 class="projects-hero-title">Our Projects<\/h1>/);
  assert.doesNotMatch(hero, /projects-artwork|<ul|<li/);
  assert.match(hero, /src="2E318DBA-71A7-4D42-9FC2-5E723868F9CC.png" width="1672" height="941"/);
  const image = await readFile(new URL('../public/2E318DBA-71A7-4D42-9FC2-5E723868F9CC.png', import.meta.url));
  assert.equal(createHash('sha256').update(image).digest('hex'), '4d131e62d2ff1a73e6bd778645bafef052d5b24eb05f8d2197bc4eb337f7061b');
  const css = await readFile(new URL('../public/styles.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /projects-artwork|projects-text-backdrop/);
});

test('Pages artifact includes the unmodified latest Projects hero and no previous text backdrop', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'ygv-projects-image-'));
  try {
    await preparePages(join(temp, 'pages'));
    const file = '2E318DBA-71A7-4D42-9FC2-5E723868F9CC.png';
    assert.ok((await readFile(join(temp, 'pages', file))).equals(await readFile(new URL('../public/' + file, import.meta.url))));
    await assert.rejects(readFile(join(temp, 'pages/projects-text-backdrop.svg')), { code: 'ENOENT' });
  } finally { await rm(temp, { recursive: true, force: true }); }
});
