import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {renderProjectsOverview} from '../scripts/projects-overview.mjs';
import {renderProjectCategories} from '../scripts/project-categories.mjs';

const html=await readFile(new URL('../public/projects.html',import.meta.url),'utf8');
test('obsolete future banner, duplicate mobile artwork and wave are absent from the published page',async()=>{
 const overview=renderProjectsOverview();assert(overview.includes(renderProjectCategories()));
 assert.doesNotMatch(html,/Shape Our Future Together|Share Your Ideas|projects-future|projects-unity-icon|project-categories-wave|future-landscape/);
 const css=await readFile(new URL('../public/projects.css',import.meta.url),'utf8');assert.doesNotMatch(css,/projects-future|projects-unity-icon|project-categories-wave/);
 const {assets}=await import('../scripts/prepare-pages.mjs');assert(!assets.includes('11111111(1).png'));assert(!assets.includes('projects-future-background.webp'));
 assert(html.includes('class="project-engagement-motto"'));assert(html.includes('class="projects-approach"'));
});

test('retained project script is inert without its removed donation and disclosure elements',async()=>{
 const script=await readFile(new URL('../public/projects.js',import.meta.url),'utf8');
 let calls=0;
 vm.runInNewContext(script,{document:{querySelectorAll:()=>[]},window:{matchMedia:()=>({matches:false})},fetch:()=>{calls++;throw Error('No remote calls expected');}});
 assert.equal(calls,0);
 assert(html.indexOf('class="project-cause-panels"')<html.indexOf('class="projects-approach"'));
});
