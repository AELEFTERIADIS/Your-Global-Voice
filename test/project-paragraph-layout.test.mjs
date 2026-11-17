import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderProjectCategories} from '../scripts/project-categories.mjs';

test('desktop Projects paragraphs retain the approved four lines and exact punctuation',()=>{
 const expected=[
  ['Advancing justice,','protecting fundamental','rights, and standing against','discrimination.'],
  ['Bringing hope, providing','essential assistance, and','supporting communities','in need.'],
  ['Protecting animals','from cruelty, supporting','rescue, and promoting','compassionate care.'],
  ['Preserving natural habitats,','protecting ecosystems, and','building a sustainable','future.']
 ];
 const paragraphs=[...renderProjectCategories().matchAll(/<p class="project-cause-description">([\s\S]*?)<\/p>/g)];
 assert.equal(paragraphs.length,4);
 paragraphs.forEach(([html],index)=>{
  const lines=[...html.matchAll(/<span class="project-paragraph-line">([^<]+)<\/span>/g)].map(m=>m[1]);
  assert.deepEqual(lines,expected[index]);
  assert.equal((html.match(/<br class="project-paragraph-break">/g)||[]).length,3);
  assert(lines.at(-1).endsWith('.'));
 });
});

test('Projects versions its paragraph-layout script so an earlier cached script cannot persist',async()=>{
 const html=await readFile(new URL('../public/projects.html',import.meta.url),'utf8');
 const bytes=await readFile(new URL('../public/projects.js',import.meta.url));
 const version=createHash('sha256').update(bytes).digest('hex').slice(0,16);
 assert(html.includes(`src="projects.js?v=${version}"`));
});
