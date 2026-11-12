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

test('garden reference draft uses the original volunteer photo, shows the uploaded closing original and reuses the approved shared footer',async()=>{
 const html=await readFile(new URL('../public/purposes.html',import.meta.url),'utf8');
 assert(html.includes('<div class="causes-page-shell"><main'));
 assert(html.includes('<h3 class="causes-desktop-environmental">Environmental Protection</h3>'));
 assert(html.includes('href="41251AE2-36C7-4CCA-87DD-16804E860189.jpeg"'));
 assert(!html.includes('Original volunteer-garden photograph pending'));
 assert(!html.includes('Original planting photograph pending'));
 const closing=html.match(/<section class="causes-desktop-closing"[\s\S]*?<\/section>/)[0];
 assert(closing.includes('src="FB4FACEC-5020-4449-8B9B-A6A524186EE3.JPEG"'));
 assert(closing.includes('href="donate.html#donation-payment"'));
 assert(closing.includes('Make a Difference'));
 assert(!closing.includes('class="causes-closing-involved"'));
 assert(!closing.includes('→'));
 assert(!closing.includes('href="contact.html#message-heading"'));
 assert(closing.includes('causes-closing-upper-wave'));
 assert.equal((closing.match(/class="causes-closing-donate"/g)||[]).length,1);

 assert(!html.includes('href="xxxxxxxxxxxxxx.png"'));

 const footer=html.match(/<footer class="desktop-home-footer"[\s\S]*?<\/footer>/)[0];
 assert(!footer.includes('class="causes-footer-logo"'));
 assert(footer.includes('aria-disabled="true" title="No published destination available">Media Gallery'));
 assert.equal((html.match(/class="desktop-home-footer"/g)||[]).length,1);
});

test('Causes footer is byte-identical to the actual approved Home footer',async()=>{
 const causes=await readFile(new URL('../public/purposes.html',import.meta.url),'utf8');
 const home=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 const footer=html=>html.match(/<footer class="desktop-home-footer"[\s\S]*?<\/footer>/)[0];
 assert.equal(footer(causes),footer(home));
});
