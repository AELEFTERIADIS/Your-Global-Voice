import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {renderProjectsOverview} from '../scripts/projects-overview.mjs';
import {renderProjectCategories} from '../scripts/project-categories.mjs';

const html=await readFile(new URL('../public/projects.html',import.meta.url),'utf8');
test('approved future panel replaces the project box with exact copy and one existing contact destination',async()=>{
 const overview=renderProjectsOverview();
 assert(overview.includes(renderProjectCategories()));
 const panel=html.match(/<section class="projects-future"[\s\S]*?<\/section>/)[0];
 for(const text of ['Shape Our Future Together','From active projects to developing initiatives and future plans, Your Global Voice welcomes your ideas and participation in creating meaningful change for a better world.','My Voice + Your Voice = Our Voice','Share Your Ideas'])assert(panel.includes(text));
 assert.match(panel,/id="project-dignity-heading" aria-labelledby="projects-future-heading" tabindex="-1"/);
 assert.equal((panel.match(/<a /g)||[]).length,1);
 assert.equal((panel.match(/class="projects-future-panel"/g)||[]).length,1);
 assert(panel.indexOf('class="projects-future-panel"')<panel.indexOf('<h2'));
 assert(panel.indexOf('class="projects-future-motto"')<panel.indexOf('class="projects-future-scene"'));
 assert.equal((panel.match(/class="projects-future-scene"/g)||[]).length,1);
 assert.match(panel,/fill="#1884b9"/);
 assert.match(panel,/fill="#f5c535"/);
 assert.match(panel,/href="contact.html#message-heading">Share Your Ideas <span aria-hidden="true">&rarr;<\/span><\/a>/);
 assert.match(panel,/class="projects-unity-icon"[^>]*aria-hidden="true"/);
 assert.doesNotMatch(panel,/<img|<image|<form|<input|<button|checkout|donation|Voices for Dignity/i);
 const contact=await readFile(new URL('../public/contact.html',import.meta.url),'utf8');
 assert(contact.includes('id="message-heading"'));
 assert(contact.includes('<form'));
});

test('retained project script is inert without its removed donation and disclosure elements',async()=>{
 const script=await readFile(new URL('../public/projects.js',import.meta.url),'utf8');
 let calls=0;
 vm.runInNewContext(script,{document:{querySelectorAll:()=>[]},window:{matchMedia:()=>({matches:false})},fetch:()=>{calls++;throw Error('No remote calls expected');}});
 assert.equal(calls,0);
 assert(html.indexOf('class="project-cause-panels"')<html.indexOf('class="projects-future"'));
 assert(html.indexOf('class="projects-future"')<html.indexOf('class="projects-approach"'));
});
