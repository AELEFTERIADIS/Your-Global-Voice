import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { preparePages } from '../scripts/prepare-pages.mjs';

test('Projects hero uses one real heading, live motto and four cause labels over the unchanged approved image', async () => {
  const html = await readFile(new URL('../public/projects.html', import.meta.url), 'utf8');
  const hero = html.match(/<section class="page-intro projects-hero">([\s\S]*?)<\/section>/)[1];
  assert.equal((hero.match(/<h1\b/g) || []).length, 1);
  assert.match(hero, /<h1 class="projects-artwork-heading">Our Projects<\/h1>/);
  assert.match(hero, /<p class="projects-artwork-motto">Every Action Matters, Every Life Deserves Dignity<\/p>/);
  assert.equal((hero.match(/<li\b/g) || []).length, 4);
  for (const text of ['Human Rights<br>&amp; Dignity', 'Humanitarian<br>Aid', 'Animal<br>Welfare', 'Nature &amp;<br>Environment']) assert.ok(hero.includes(text));
  const image = await readFile(new URL('../public/C4112960-9D5E-444E-92F1-4F3CE664A3D6.png', import.meta.url));
  assert.equal(createHash('sha256').update(image).digest('hex'), '8703712565c85ceea604501fcce127a26b273212b650f42f0b963fd60eead40d');
});

test('Projects lettering backdrop is local, self-contained and included unchanged in the Pages artifact', async () => {
  const svg = await readFile(new URL('../public/projects-text-backdrop.svg', import.meta.url), 'utf8');
  assert.match(svg, /viewBox="0 0 869 440"/);
  assert.doesNotMatch(svg, /<script|<image|https?:\/\/(?!www\.w3\.org)/);
  const temp = await mkdtemp(join(tmpdir(), 'ygv-projects-text-'));
  try {
    await preparePages(join(temp, 'pages'));
    assert.equal(await readFile(join(temp, 'pages/projects-text-backdrop.svg'), 'utf8'), svg);
  } finally { await rm(temp, { recursive: true, force: true }); }
});
