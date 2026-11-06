import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
test('mobile approach preserves readable approved copy and the immutable desktop photograph',async()=>{
 const html=await readFile(new URL('../public/projects.html',import.meta.url),'utf8');
 assert.match(html,/class="projects-approach-mobile"/);
 assert.match(html,/Turning Compassion<\/span><span>Into Action/);
 const original=await readFile(new URL('../public/DE95C446-F64B-4963-923B-8703F03269C5.png',import.meta.url));
 assert.equal(createHash('sha256').update(original).digest('hex'),'199164cebcefac80f97cc9ba5277611fa94b5b3ecf8311495db8d0b78ab1ec68');
 assert(html.includes('At <em>Your Global Voice</em>, we strive to transform compassion into lasting impact through initiatives that uphold human dignity, bring hope to those in need, protect life, and help build a better future for all.'));
 const css=await readFile(new URL('../public/projects.css',import.meta.url),'utf8');
 assert.match(css,/\.projects-approach-mobile \{ display: none; \}/);
 const edit=await readFile(new URL('../public/projects-approach-mobile-edit.webp',import.meta.url));assert.equal(edit.subarray(0,4).toString(),'RIFF');assert.equal(edit.subarray(8,12).toString(),'WEBP');
});
