import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createPreviewServer} from '../scripts/server.mjs';
test('Animal Welfare reuses the exact approved header and contextual shared footer',async()=>{
 const page=await readFile(new URL('../public/animal-welfare.html',import.meta.url),'utf8');
 const baseline=await readFile(new URL('../public/humanitarian.html',import.meta.url),'utf8');
 for(const re of [/<header[\s\S]*?<\/header>/,/<footer class="desktop-home-footer"[\s\S]*?<\/footer>/]) assert.equal(page.match(re)[0],baseline.match(re)[0]);
 assert.equal((page.match(/<header/g)||[]).length,1);
 assert.equal((page.match(/class="animal-focus-card"/g)||[]).length,4);
 assert.match(page,/<details class="animal-more"><summary>/);
 assert.doesNotMatch(page,/<details class="animal-more" open/);
 assert.match(page,/Read More/);assert.match(page,/Read Less/);
 assert.match(page,/To provide charitable financial assistance and support for the care and well-being of animals\./);
 assert.equal((page.match(/href="donate.html\?cause=animal-welfare#donation-payment"/g)||[]).length,2);
 assert.match(page,/href="coming-soon.html\?cause=animal-welfare"/);
 assert.match(page,/animal-welfare.css\?v=[a-f0-9]{16}/);
});
test('Animal Welfare page, photograph reference and stylesheet resolve',async()=>{
 const server=createPreviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const base='http://127.0.0.1:'+server.address().port;for(const path of ['/animal-welfare.html','/animal-welfare.css','/Animal%20Welfare_%20Compassion%20in%20Action.png'])assert.equal((await fetch(base+path)).status,200,path);}finally{await new Promise(r=>server.close(r));}
});
