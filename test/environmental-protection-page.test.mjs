import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createPreviewServer} from '../scripts/server.mjs';
test('Environmental Protection reuses the exact approved shared header, footer and contextual navigation',async()=>{
 const page=await readFile(new URL('../public/environmental-protection.html',import.meta.url),'utf8');
 const animal=await readFile(new URL('../public/animal-welfare.html',import.meta.url),'utf8');
 for(const re of [/<header[\s\S]*?<\/header>/,/<footer class="desktop-home-footer"[\s\S]*?<\/footer>/])assert.equal(page.match(re)[0],animal.match(re)[0]);
 assert.equal((page.match(/<header/g)||[]).length,1);
 assert.equal((page.match(/class="environment-focus-card"/g)||[]).length,4);
 assert.match(page,/<details class="environment-more"><summary>/);assert.doesNotMatch(page,/<details class="environment-more" open/);
 assert.match(page,/href="donate.html\?cause=environmental-conservation#donation-payment"/);
 assert.match(page,/href="coming-soon.html\?cause=environmental-conservation"/);
 assert.match(page,/class="cause-footer-return" href="causes.html"/);
 assert.match(page,/environmental-protection.css\?v=[a-f0-9]{16}/);
 for(const text of ['To protect our planet, preserve natural resources, restore ecosystems, and promote sustainable practices for a cleaner, healthier, and more resilient world.','Protect forests, wildlife, and natural habitats.','Reduce pollution and keep oceans and rivers clean.','Promote responsible resource use and minimize waste.','Support solutions that reduce emissions and build climate resilience.'])assert(page.includes(text));
});
test('Environmental Protection page and approved local reference resolve under the existing server',async()=>{
 const server=createPreviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const base='http://127.0.0.1:'+server.address().port;for(const path of ['/environmental-protection.html','/environmental-protection.css','/Your%20Global%20Voice_%20Environmental%20Protection.png'])assert.equal((await fetch(base+path)).status,200,path);}finally{await new Promise(r=>server.close(r));}
});

test('Our Causes opens Environmental Protection while its project destination stays Coming Soon',async()=>{
 const html=await readFile(new URL('../public/purposes.html',import.meta.url),'utf8');
 const card=html.match(/<li id="environmental-protection"[\s\S]*?<\/li>/)[0];
 assert.match(card,/class="human-rights-page-link" href="environmental-protection.html"/);
});
