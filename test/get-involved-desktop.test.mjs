import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderApplication} from '../scripts/application.mjs';

test('Get Involved desktop retains one exact application form, unique field IDs and original-photo sources',async()=>{
 const html=await readFile(new URL('../public/get-involved.html',import.meta.url),'utf8');
 const source=renderApplication().match(/<form\b[\s\S]*?<\/form>/)[0];
 const forms=html.match(/<form\b[\s\S]*?<\/form>/g);assert.equal(forms.length,1);assert.equal(forms[0],source);
 const ids=[...forms[0].matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 const desktop=html.split('<div class="get-involved-compact">')[0].split('<div class="get-involved-desktop">')[1];
 const photos=[...desktop.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(photos,['Get involved 2.png','get involved 111.JPEG']);
 assert(!desktop.includes('33333333.png'));assert(!desktop.includes('wwwwwwwww.png'));assert(desktop.includes('class="giv-full-hero"'));assert(desktop.includes('class="giv-intro-more"'));assert(desktop.includes('Read Less'));assert(desktop.includes('Your Voice Can Make a Difference'));assert(desktop.includes('Explore More'));assert(desktop.includes('class="giv-return-back"'));assert(!desktop.includes('Return Back'));assert.match(desktop,/href="donate.html#donation-payment"/);
 for(const title of ['Support','Participate','Contribute','Connect'])assert(desktop.includes(`<h3>${title}</h3>`));
});
