import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createPreviewServer} from '../scripts/server.mjs';
import {assets} from '../scripts/prepare-pages.mjs';

test('desktop homepage hero reuses central donation and messaging destinations and ships versioned assets', async t => {
 const server=createPreviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base=`http://127.0.0.1:${server.address().port}`;
 const html=await (await fetch(base)).text();
 const hero=html.match(/<section class="home-hero-desktop"[\s\S]*?<\/section>/)[0];
 assert.match(hero,/A Shared Voice<br><em>for a Better World/);
 assert.match(hero,/href="donate.html#donation-payment"/);
 assert.match(hero,/href="contact.html#message-heading"/);
 assert.equal((hero.match(/home-cause-/g)||[]).length,4);
 assert.equal((html.match(/class="header-logo"/g)||[]).length,1);
 const cssURL=html.match(/href="(home-hero\.css\?v=[a-f0-9]{16})"/)[1];
 const cssResponse=await fetch(base+'/'+cssURL);assert.equal(cssResponse.status,200);
 const css=await cssResponse.text();assert.match(css,/@media \(min-width: 64\.0625rem\)/);
 assert.match(css,/\.home-hero-desktop \{ display: none; \}/);
 assert.match(css,/\.home-hero-legacy \{ display: none; \}/);
 const image=await fetch(base+'/home-hero-landscape.webp');assert.equal(image.status,200);assert.match(image.headers.get('content-type'),/image\/webp/);
 for(const asset of ['home-hero.css','home-hero-landscape.webp'])assert(assets.includes(asset));
 for(const page of ['projects','about','mission','purposes','get-involved','donate','contact'])assert(!(await readFile(new URL('../public/'+page+'.html',import.meta.url),'utf8')).includes('home-hero.css'));
});
