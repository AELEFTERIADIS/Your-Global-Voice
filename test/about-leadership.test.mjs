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
  for (const [index, [name, position]] of [['Andreas Elefteriadis', 'Founder &amp; President'], ['Archimandrite Maximos Weimar', 'Vice President'], ['Robert Shillenn', 'Secretary &amp; Treasurer']].entries()) {
    assert.ok(profiles[index].includes(`>${name}</h3>`));
    assert.ok(profiles[index].includes(`>${position}</p>`));
    if (index === 0) {
      assert.match(profiles[index], /<img src="E7F71712-32D1-43FE-BA18-618193E48BA8.png"/);
      assert.match(profiles[index], /alt="Andreas Elefteriadis"/);
      assert.doesNotMatch(profiles[index], /Portrait forthcoming/);
    } else if (index === 2) {
      assert.match(profiles[index], /<img src="Elderly Cleric in Embroidered Hat.png"/);
      assert.match(profiles[index], /alt="Robert Shillenn"/);
      assert.doesNotMatch(profiles[index], /Portrait forthcoming/);
    } else {
      assert.match(profiles[index], /<img src="C877690E-4E12-4A62-BCE4-47A36456254D.png"/);
      assert.match(profiles[index], /alt="Archimandrite Maximos Weimar"/);
      assert.doesNotMatch(profiles[index], /Portrait forthcoming/);
    }
    if (index === 0) {
      assert.match(profiles[index], /aria-expanded="false" aria-controls="andreas-biography-expanded"/);
      assert.match(profiles[index], /id="andreas-biography-expanded" hidden/);
      assert.equal((profiles[index].match(/class="about-leadership-toggle"/g) || []).length, 1);
      const biography = [...profiles[index].matchAll(/<p class="about-leadership-biography">([\s\S]*?)<\/p>/g)].map(match => match[1].replace(/<button\b[\s\S]*?<\/button>/g, '').replace(/<[^>]+>/g, '').trim());
      assert.deepEqual(biography, [
  "Born in 1982, Andreas Elefteriadis has spent much of his life witnessing the struggles of people facing discrimination, persecution, and humanitarian crises. He has also been deeply affected by the cruelty and suffering of animals and the growing destruction of our planet.",
  "Throughout his life, Andreas has taken part in humanitarian efforts, supported animal welfare, and participated in activities to protect the environment. These experiences strengthened his belief that compassion alone is not enough — meaningful change begins when we choose to act.",
  "Driven by this belief, he founded Your Global Voice to stand against injustice, bring hope to those in need, protect vulnerable animals, and help preserve our planet for future generations.",
  "His vision is to build a world where kindness becomes action, every life is valued, and every voice has the chance to be heard."
]);
    } else if (index === 1) {
      assert.match(profiles[index], /aria-expanded="false" aria-controls="maximos-biography-expanded"/);
      assert.match(profiles[index], /id="maximos-biography-expanded" hidden/);
      const biography = [...profiles[index].matchAll(/<p class="about-leadership-biography">([\s\S]*?)<\/p>/g)].map(match => match[1].replace(/<button\b[\s\S]*?<\/button>/g, '').replace(/<[^>]+>/g, '').trim());
      assert.deepEqual(biography, [
  "Born in 1966 on Long Island, New York, Archimandrite Maximos Weimar is an Orthodox Christian priest, spiritual leader, and educator with more than three decades of religious experience. Having embraced Orthodox Christianity in 1993, he was elevated to the rank of Archimandrite in 2003 and has dedicated his life to spiritual guidance, theological education, and service to others.",
  "He currently serves in the Russian Orthodox Church Outside Russia as Abbot of Saint Panteleimon Skete in Florida and Administrator of Saint John Cassian Chapel in Alabama. He is also Abbot Emeritus of the Monastery of Saint Dionysios the Areopagite in New York. His extensive leadership experience reflects a longstanding commitment to compassion, human dignity, and community service.",
  "As Vice President of Your Global Voice, Father Maximos brings his spiritual wisdom, leadership experience, and dedication to helping others. His vision is one where compassion unites us, kindness inspires action, and every life is treated with dignity and respect."
]);
    } else {
      assert.match(profiles[index], /aria-expanded="false" aria-controls="robert-biography-expanded"/);
      assert.match(profiles[index], /id="robert-biography-expanded" hidden/);
      const biography = [...profiles[index].matchAll(/<p class="about-leadership-biography">([\s\S]*?)<\/p>/g)].map(match => match[1].replace(/<button\b[\s\S]*?<\/button>/g, '').replace(/<[^>]+>/g, '').trim());
      assert.deepEqual(biography, [
  "Born in Pennsylvania, Robert Shillenn brings to Your Global Voice a wealth of international experience, academic knowledge, and a longstanding commitment to education and community service. He earned his bachelor’s degree from Providence College in Rhode Island and a master’s degree in theology from Saint Mary’s Seminary and University in Baltimore, Maryland.",
  "Throughout his career, Robert has worked as an educator, interpreter, and translator across the United States, Europe, and West Africa. His multilingual expertise and international experience have strengthened his understanding of diverse cultures and communities. He has also participated in humanitarian volunteer work in rural Mexico and served on organizational boards, including that of a rural hospital in Nevada.",
  "As Secretary and Treasurer of Your Global Voice, Robert contributes his extensive knowledge, international perspective, and dedication to responsible leadership. His experience reflects the belief that understanding brings people together, compassion crosses borders, and meaningful action can create lasting change."
]);
    }
    assert.equal((profiles[index].match(/<img\b/g) || []).length, 1);
  }
});
