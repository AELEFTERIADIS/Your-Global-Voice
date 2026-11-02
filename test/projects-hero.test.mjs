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

test('Projects approach replaces placeholders with one left-aligned section title and the latest sunset artwork', async () => {
  const html = await readFile(new URL('../public/projects.html', import.meta.url), 'utf8');
  assert.match(html, /<h2 id="projects-approach-heading">Our Approach to Making a Difference<\/h2>/);
  assert.match(html, /src="DE95C446-F64B-4963-923B-8703F03269C5.png" width="1774" height="887"/);
  assert.doesNotMatch(html, /Future initiatives will be guided|Project information will be added|No projects are listed|Where our purposes can lead|What future project updates will include|Stay connected to our direction/);
  const sections = [...html.matchAll(/<section\b/g)];
  assert.equal(sections.length, 3);
});

test('Voices for Dignity retains approved paragraphs and cannot initiate a payment', async () => {
  const html = await readFile(new URL('../public/projects.html', import.meta.url), 'utf8');
  const paragraphs = JSON.parse(await readFile(new URL('../content/project-dignity.json', import.meta.url), 'utf8'));
  const project = html.match(/<section class="project-initiatives"[\s\S]*?<\/section>/)[0];
  for (const paragraph of paragraphs) assert.ok(project.includes('<p>' + paragraph + '</p>'));
  const amounts = [...project.matchAll(/name="dignity-amount" value="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(amounts, ['25', '50', '100', '250', 'custom']);
  assert.equal((project.match(/<button type="button" disabled>/g) || []).length, 2);
  assert.doesNotMatch(project, /https?:|<form\b|action=|buy\.stripe|paypal\.com/);
  assert.match(project, /href="contact.html#message-heading">Send Us a Message/);
  const { renderDignityProject } = await import('../scripts/project-dignity.mjs');
  assert.throws(() => renderDignityProject(), /Approved Voices for Dignity text is required/);
});

test('Projects deployment permits local scripts and scoped API connectivity', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'ygv-project-giving-'));
  try {
    await preparePages(join(temp, 'pages'));
    const html = await readFile(join(temp, 'pages/projects.html'), 'utf8');
    assert.match(html, /script-src 'self'/);
    assert.match(html, /connect-src 'self'/);
    for (const asset of ['projects.css', 'projects.js']) assert.equal(await readFile(join(temp, 'pages', asset), 'utf8'), await readFile(new URL('../public/' + asset, import.meta.url), 'utf8'));
  } finally { await rm(temp, { recursive: true, force: true }); }
});

test('Voices for Dignity keeps its approved paragraphs in an accessible desktop-open responsive disclosure', async () => {
  const html = await readFile(new URL('../public/projects.html', import.meta.url), 'utf8');
  const paragraphs = JSON.parse(await readFile(new URL('../content/project-dignity.json', import.meta.url), 'utf8'));
  const details = html.match(/<details class="project-read-more" open>([\s\S]*?)<\/details>/)[1];
  assert.ok(!details.includes(paragraphs[0]));
  assert.ok(details.includes('<p>' + paragraphs[1] + '</p>'));
  assert.ok(details.includes('<p>' + paragraphs[2] + '</p>'));
  assert.match(details, /project-read-more-label">Read More/);
  assert.match(details, /project-read-less-label">Read Less/);
  assert.match(html, /<\/details>\n<p class="project-dignity-slogan">Together, We Can Make Every Voice Count<\/p>\n<div class="project-contact">/);
});


test('Voices for Dignity has the approved gold label above its title and a separate slogan before the contact box', async () => {
  const html = await readFile(new URL('../public/projects.html', import.meta.url), 'utf8');
  assert.match(html, /<p class="eyebrow project-purpose-label">HUMAN RIGHTS &amp; DIGNITY PROJECT<\/p><h3 id="project-dignity-heading"><svg class="project-scales-icon"[\s\S]*?<span>Voices for Dignity<\/span>/);
  assert.match(html, /<\/details>\n<p class="project-dignity-slogan">Together, We Can Make Every Voice Count<\/p>\n<div class="project-contact">/);
});
