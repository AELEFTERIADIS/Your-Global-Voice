import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createPreviewServer} from '../scripts/server.mjs';
import {approvedCauseIds} from '../worker/donation-registry.mjs';
import {preparePages} from '../scripts/prepare-pages.mjs';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('homepage cause menus reuse all four existing destinations in the approved order',async t=>{
 const server=createPreviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base=`http://127.0.0.1:${server.address().port}`;
 const response=await fetch(base);assert.match(response.headers.get('content-security-policy'),/script-src 'self'/);
 const html=await response.text(),projects=await (await fetch(base+'/projects.html')).text();
 assert.match(html,/<h2 id="home-causes-heading">What We Stand For<\/h2>/);assert(!html.includes('Our Four Purposes</h2>'));
 const menus=[...html.matchAll(/<details class="home-cause-explore"([^>]*)>([\s\S]*?)<\/details>/g)];assert.equal(menus.length,4);
 for(const [i,menu] of menus.entries()){
  assert(!/\bopen\b/.test(menu[1]));assert.match(menu[1],/name="home-causes"/);
  assert.deepEqual([...menu[2].matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map(m=>[m[1],m[2]]),[[`projects.html#projects-${approvedCauseIds[i]}`,'Explore Projects'],[`donate.html?cause=${approvedCauseIds[i]}#donation-payment`,'Give Hope'],['contact.html#message-heading','Send a Message']]);
  assert(projects.includes(`id="projects-${approvedCauseIds[i]}"`));
 }
 for(const asset of ['home-causes.css','home-causes.js','What%20We%20Stand%20For_%20Four%20Causes.png','donation-cause.js','donation-cause.css'])assert.equal((await fetch(base+'/'+asset)).status,200);
 const tmp=await mkdtemp(join(tmpdir(),'home-causes-'));t.after(()=>rm(tmp,{recursive:true,force:true}));await preparePages(join(tmp,'site'));
 const artifact=await readFile(join(tmp,'site/index.html'),'utf8');assert.match(artifact,/script-src 'self'/);
 assert.match(artifact,/<script src="home-causes\.js(?:\?v=[a-f0-9]{16})?" defer>/);
});

test('donation cause selection accepts only registered IDs and leaves hosted checkout handling untouched',async()=>{
 const script=await readFile(new URL('../public/donation-cause.js',import.meta.url),'utf8');
 for(const cause of [...approvedCauseIds,'unknown','<script>alert(1)</script>','']){
  const select={options:approvedCauseIds.map(value=>({value})),value:''},field={hidden:true};let inserted=false;
  const selector={};const document={querySelector:q=>q==='#donation-cause-field'?field:q==='#donation-cause'?select:q==='#donation-payment'?{insertBefore:(f,s)=>{assert.equal(f,field);assert.equal(s,selector);inserted=true;}}:selector};
  vm.runInNewContext(script,{document,URLSearchParams,location:{search:'?cause='+encodeURIComponent(cause)}});
  const known=approvedCauseIds.includes(cause);assert.equal(field.hidden,!known);assert.equal(inserted,known);assert.equal(select.value,known?cause:'');
 }
 assert.doesNotMatch(script,/fetch\s*\(|localStorage|innerHTML|stripe|paypal/i);
});
