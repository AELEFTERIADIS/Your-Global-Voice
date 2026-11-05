import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {projectCategories,renderProjectCategories,projectDesignReference} from '../scripts/project-categories.mjs';
import {approvedCauseIds} from '../worker/donation-registry.mjs';
const html=await readFile(new URL('../public/projects.html',import.meta.url),'utf8');

test('four unique cause panels follow Explore Our Projects and precede the one existing project',()=>{
 assert.deepEqual(projectCategories.map(c=>c.id),approvedCauseIds);
 assert.deepEqual(projectCategories.map(c=>c.label),['Human Rights & Dignity','Humanitarian Assistance & Relief','Animal Welfare','Environmental Protection']);
 assert.match(html,/<h2 id="project-initiatives-heading"><span>Explore Our Projects<\/span><\/h2>\s*<div class="project-cause-panels">/);
 assert.equal((html.match(/class="project-cause-panel"/g)||[]).length,4);
 assert.equal((html.match(/class="project-dignity-layout"/g)||[]).length,1);
 assert.equal((html.match(/id="project-dignity-heading"/g)||[]).length,1);
 assert(html.indexOf('class="project-cause-panels"')<html.indexOf('class="project-dignity-layout"'));
});

test('every hero link resolves directly to its corresponding accessible panel without JavaScript',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const cause of projectCategories) {
  assert(html.includes(`href="#projects-${cause.id}" data-cause-target="projects-${cause.id}"`));
  assert(html.includes(`id="projects-${cause.id}" aria-labelledby="projects-${cause.id}-title" tabindex="-1"`));
 }
});

test('Explore Projects navigates to the existing project or provides native empty-category feedback',()=>{
 const cards=renderProjectCategories();
 assert.equal((cards.match(/class="project-cause-icon"/g)||[]).length,4);
 assert.equal((cards.match(/Explore Projects <span/g)||[]).length,4);
 assert.match(cards,/<a class="project-cause-action project-cause-explore" href="#project-dignity-heading"/);
 assert.equal((cards.match(/<details class="project-cause-empty">/g)||[]).length,3);
 assert.equal((cards.match(/There are no published projects for this cause yet\./g)||[]).length,3);
 assert.doesNotMatch(cards,/<form|<input|<fieldset|<button|checkout|paypal|stripe/i);
});

test('Voices for Dignity retains one donation panel and all approved paragraphs',async()=>{
 const paragraphs=JSON.parse(await readFile(new URL('../content/project-dignity.json',import.meta.url),'utf8'));
 for(const paragraph of paragraphs)assert(html.includes('<p>'+paragraph+'</p>'));
 assert.equal((html.match(/class="project-giving"/g)||[]).length,1);
 assert.equal((html.match(/id="dignity-custom"/g)||[]).length,1);
 assert.equal((html.match(/<button type="button" disabled>/g)||[]).length,2);
 assert.doesNotMatch(html,/Our Projects &amp; Initiatives<\/span>/);
});


test('approved cause copy and all three actions use existing destinations without adding checkout',async()=>{
 const cards=renderProjectCategories();
 assert.equal((cards.match(/class="project-cause-description"/g)||[]).length,4);
 assert(cards.includes('Providing emergency relief and essential assistance to individuals and communities affected by disasters, crises, and hardship.'));
 assert.equal((cards.match(/href="donate.html#giving-heading"/g)||[]).length,4);
 assert.equal((cards.match(/>Support This Cause<\/span>/g)||[]).length,4);
 assert.equal((cards.match(/>Send a Message<\/span>/g)||[]).length,4);
 assert.equal((cards.match(/role="img" aria-label="[^"]+"/g)||[]).length,4);
 assert.equal((cards.match(/class="project-cause-accent"/g)||[]).length,4);
 assert.doesNotMatch(cards,/https?:|test-checkout|data-payment|<form|<input|<button/i);
 for(const [page,id] of [['donate','giving-heading'],['contact','message-heading']]) {
  const destination=await readFile(new URL(`../public/${page}.html`,import.meta.url),'utf8');
  assert(destination.includes(`id="${id}"`));
 }
 const css=await readFile(new URL('../public/projects.css',import.meta.url),'utf8');
 assert.match(css,/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
 assert.match(css,/@media \(max-width: 56rem\).*grid-template-columns: 1fr/);
 assert.equal(projectDesignReference,'Explore Our Impact Projects (1).png');
 assert.equal((cards.match(/<image href="Explore Our Impact Projects \(1\).png"/g)||[]).length,4);
 assert.doesNotMatch(cards,/project-cause-photos\.webp/);
 const {createHash}=await import('node:crypto');
 const source=await readFile(new URL('../public/'+projectDesignReference,import.meta.url));
 assert.equal(createHash('sha1').update(`blob ${source.length}\0`).update(source).digest('hex'),'796c39d3493e5905e9a2b5ac23074e2607c35f9f');
});
