import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderDesktopHome,renderDesktopHomeFooter} from '../scripts/desktop-home.mjs';
import {createPreviewServer} from '../scripts/server.mjs';
const contact=JSON.parse(await readFile(new URL('../content/contact.json',import.meta.url),'utf8'));

test('complete desktop Home page preserves reference section order, wording and existing destinations',async t=>{
 const server=createPreviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base=`http://127.0.0.1:${server.address().port}`,html=await (await fetch(base)).text();
 const content=renderDesktopHome();
 assert.deepEqual([...content.matchAll(/<section class="([^"]+)"/g)].map(m=>m[1]),['desktop-home-hero','desktop-home-causes','desktop-home-purpose','desktop-home-difference','desktop-home-involved','desktop-home-closing']);
 assert.match(content.replaceAll('<br>',''),/Advancing human dignity, supporting those in need, protecting animals, and preserving our planet\./);
 const hero=content.match(/<section class="desktop-home-hero"[\s\S]*?<\/section>/)[0];
 assert.deepEqual([...hero.matchAll(/<a[^>]*href="([^"]+)"/g)].map(m=>m[1]),['#desktop-home-causes','donate.html#donation-payment']);
 assert.equal((content.match(/class="desktop-home-cause desktop-home-/g)||[]).length,4);
 const projects=await readFile(new URL('../public/projects.html',import.meta.url),'utf8');
 for(const [,id] of content.matchAll(/href="projects.html#([^"]+)"/g))assert(projects.includes(`id="${id}"`));
 assert.match(html,/<div class="home-compact-preserved">[\s\S]*?class="home-hero-desktop"/);
 assert.equal((await fetch(base+'/BC7678D3-851B-4549-BF8C-D4BE0B43E533.png')).status,200);
 const css=await (await fetch(base+'/desktop-home.css')).text();assert.match(css,/@media\(min-width:80rem\)/);
});

test('desktop footer uses verified contact metadata and never invents social profiles',()=>{
 const footer=renderDesktopHomeFooter(contact);
 assert.match(footer,/mailto:info@ygvoice.org/);assert.match(footer,/https:\/\/wa.me\/16316379508/);
 for(const address of contact.mailingAddress.slice(1))assert(footer.includes(address));
 assert.doesNotMatch(footer,/P.O. Box|Suffolk County|facebook.com|instagram.com|tiktok.com|x.com/);
 for(const label of ['Facebook','Instagram','X','TikTok'])assert(footer.includes(`aria-label="${label}: profile link not configured"`));
});

test('approved header structure outside desktop navigation and sidebar assets remain unchanged',async()=>{
 const expected={"public/desktop-header.js": "2e753cab88fee74d0c20c804734ed5c30b8bd3c2228ad1fdd34d927ebfc98f83", "public/home-sidebar.css": "7a36dc6db9574b7b2fb52c49cd622b909f95b78cade9057adb68e8c6bafaf8c9", "public/home-sidebar.js": "0ccd662771eee6ccee2c0ed49454a9c274780b2d5e9c26735527961d7f5d2731"};
 for(const [file,hash] of Object.entries(expected))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 assert.equal(createHash('sha256').update(html.match(/<header[\s\S]*?<\/header>/)[0].replace(/<nav class="desktop-reference-nav"[\s\S]*?<\/nav>/,'')).digest('hex'),'2cefc86f0a6ebd957d31df6f0c62d779fd262a7f1175a7370a8fed18f3d42dd6');
});
