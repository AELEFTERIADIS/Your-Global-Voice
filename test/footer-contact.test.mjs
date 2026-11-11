import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderFooterContact} from '../scripts/footer-contact.mjs';
import {renderDesktopHomeFooter} from '../scripts/desktop-home.mjs';
import {renderDesktopMissionFooter} from '../scripts/desktop-mission.mjs';
const contact=JSON.parse(await readFile(new URL('../content/contact.json',import.meta.url),'utf8'));
test('shared footer contact preserves original destinations and the complete stored mailing address',()=>{
 const html=renderFooterContact(contact);
 assert(html.includes('href="mailto:info@ygvoice.org"'));
 assert(html.includes('href="https://wa.me/16316379508"'));
 const maps=new URL(html.match(/class="footer-contact-address" href="([^"]+)"/)[1].replaceAll('&amp;','&'));
 assert.equal(maps.origin,'https://www.google.com');
 assert.equal(maps.searchParams.get('query'),contact.mailingAddress.slice(1).join(', '));
 for(const line of contact.mailingAddress.slice(1))assert(html.includes(line));
 assert(!html.includes('→'));assert(!html.includes('<p>'));
 for(const render of [renderDesktopHomeFooter,renderDesktopMissionFooter])assert(render(contact).includes(html));
});

import {pagesFiles} from '../scripts/prepare-pages.mjs';
test('all published pages reuse one shared desktop footer and a versioned stylesheet',async()=>{
 for(const file of pagesFiles){
  const html=await readFile(new URL('../public/'+file,import.meta.url),'utf8');
  assert.equal((html.match(/class="desktop-home-footer"/g)||[]).length,1,file);
  assert(html.includes(renderFooterContact(contact)),file);
  assert.match(html,/<link rel="stylesheet" href="desktop-home.css\?v=[a-f0-9]{16}">/);
 }
});
