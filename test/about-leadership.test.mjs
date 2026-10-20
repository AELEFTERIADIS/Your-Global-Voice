import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('About leadership preserves the approved introduction, profile order, and honest placeholders before the final callout', async () => {
  const html = await readFile(new URL('../public/about.html', import.meta.url), 'utf8');
  const section = html.match(/<section class="about-leadership"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  assert.ok(html.indexOf('about-foundation') < html.indexOf(section));
  assert.ok(html.indexOf(section) < html.indexOf('Discover what guides us.'));
  assert.ok(section.includes('At Your Global Voice, our leadership is guided by a shared belief that every life deserves dignity, compassion, and care. United by a commitment to serving others, we work toward a world where human rights are respected, communities in need are supported, vulnerable animals are protected, and our environment is preserved for future generations.'));
  const profiles = [...section.matchAll(/<article\b[\s\S]*?<\/article>/g)].map(match => match[0]);
  assert.equal(profiles.length, 3);
  for (const [index, [name, position]] of [['Andreas Elefteriadis', 'President'], ['Lewis', 'Vice President'], ['Robert', 'Secretary &amp; Treasurer']].entries()) {
    assert.ok(profiles[index].includes(`>${name}</h3>`));
    assert.ok(profiles[index].includes(`>${position}</p>`));
    assert.ok(profiles[index].includes('Portrait forthcoming'));
    assert.ok(profiles[index].includes('Biography forthcoming.'));
    assert.doesNotMatch(profiles[index], /<img\b/);
  }
});
