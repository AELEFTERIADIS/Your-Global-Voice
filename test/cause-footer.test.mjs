import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pagesFiles} from '../scripts/prepare-pages.mjs';

test('return navigation appears only beneath social icons on individual cause pages',async()=>{
 for(const file of pagesFiles){
  const html=await readFile(new URL('../public/'+file,import.meta.url),'utf8');
  const individual=['human-rights.html','humanitarian.html','animal-welfare.html','environmental-protection.html'].includes(file);
  assert.equal((html.match(/class="cause-footer-return"/g)||[]).length,individual?1:0,file);
  if(individual){
   const social=html.match(/<section class="desktop-home-social">[\s\S]*?<\/section>/)[0];
   assert.match(social,/<\/svg><\/span><\/div><a class="cause-footer-return" href="causes.html"><span aria-hidden="true">←<\/span> Back to Our Causes<\/a><\/section>/);
   assert.doesNotMatch(html,/class="rights-return"|class="relief-return"/);
  }
 }
});
