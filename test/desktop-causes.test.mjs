import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {preparePages} from '../scripts/prepare-pages.mjs';
test('desktop Causes keeps original photos, full inline disclosures, wording and existing action destinations',async()=>{
 const html=await readFile(new URL('../public/purposes.html',import.meta.url),'utf8');
 for(const src of ['8C534551-DFAE-4F96-B226-14203E48BE5D.jpeg','YGV-Humanitarian-Aid.jpeg','CFA1FD8E-17F4-49FE-A5D8-4F97EBB1E587.png','30D02897-5227-4D75-B420-B17C1E5737F6.jpeg'])assert(html.includes('src="'+src+'"'));
 assert.equal((html.match(/<details class="human-rights-more/g)||[]).length,4);
 assert(html.includes('We work to prevent animal cruelty and suffering, promote animal well-being, and ensure compassionate care for all animals.'));
 assert(html.includes('href="donate.html#donation-payment"'));
 assert(html.includes('href="contact.html#message-heading"'));
 assert.equal((html.match(/id="animal-welfare"/g)||[]).length,1);
 assert.match(html,/<link rel="stylesheet" href="desktop-causes.css\?v=[a-f0-9]{16}">/);
 const css=await readFile(new URL('../public/desktop-causes.css',import.meta.url),'utf8');
 assert(css.includes('@media(min-width:80rem)'));assert(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
});
