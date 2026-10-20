import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('About final callout preserves the approved wording and ordered message/mission destinations without arrows', async () => {
  const html = await readFile(new URL('../public/about.html', import.meta.url), 'utf8');
  const section = html.match(/<section class="callout about-final-callout"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  const heading = section.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)[1].replace(/<[^>]+>/g, '');
  assert.equal(heading, 'One World | One Shared Purpose');
  assert.ok(section.includes('Discover the mission that guides us, the values that unite us, and how together we can make a lasting difference in the world.'));
  assert.deepEqual([...section.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map(([, href, label]) => [href, label]), [
    ['contact.html', 'Send a Message'],
    ['mission.html', 'Explore Our Mission'],
  ]);
  assert.doesNotMatch(section, /&rarr;|→/);
});
