import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createPreviewServer} from '../scripts/server.mjs';
import {preparePages,pagesFiles} from '../scripts/prepare-pages.mjs';

test('reference desktop header reuses the official logo, existing destinations and one sidebar on every page',async t=>{
 const server=createPreviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base=`http://127.0.0.1:${server.address().port}`;
 for(const file of pagesFiles){
  const response=await fetch(base+'/'+file);assert.equal(response.status,200);assert.match(response.headers.get('content-security-policy'),/script-src 'self'/);
  const html=await response.text(),header=html.match(/<header[\s\S]*?<\/header>/)[0];
  assert.equal((header.match(/class="header-logo"/g)||[]).length,1);
  assert.match(header,/src="603250A8-B1C4-4533-848C-4028A6E0AD49.png"/);
  assert.match(header,/A NONPROFIT ORGANIZATION/);assert.doesNotMatch(header,/<form\b/);
  assert.equal((html.match(/id="desktop-quick-links"/g)||[]).length,1);assert.match(header,/aria-controls="desktop-quick-links"/);
  const nav=header.match(/<nav class="desktop-reference-nav"[^>]*>([\s\S]*?)<\/nav>/)[1];
  const links=[...nav.matchAll(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(m=>[m[1],m[2].replace(/<svg[\s\S]*?<\/svg>/,'')]);
  assert.deepEqual(links,[['index.html','Home'],['about.html','About'],['mission.html','Mission'],['purposes.html','Causes'],['projects.html','Projects'],['get-involved.html','Get Involved'],['contact.html','Contact'],['donate.html','Donate']]);
  assert.match(html,/<link rel="stylesheet" href="desktop-header.css\?v=[a-f0-9]{16}">/);assert.match(html,/<script src="desktop-header.js\?v=[a-f0-9]{16}" defer>/);
 }
 for(const asset of ['desktop-header.css','desktop-header.js','desktop-header-condensed-bold.woff','desktop-header-font-license.txt'])assert.equal((await fetch(base+'/'+asset)).status,200);
});

test('published artifact contains the header controller and licensed local font without replacing page content',async t=>{
 const tmp=await mkdtemp(join(tmpdir(),'desktop-header-'));t.after(()=>rm(tmp,{recursive:true,force:true}));const site=join(tmp,'site');await preparePages(site);
 for(const file of pagesFiles){const html=await readFile(join(site,file),'utf8');assert.match(html,/script-src 'self'/);assert.match(html,/desktop-header.js\?v=/);}
 const font=await readFile(join(site,'desktop-header-condensed-bold.woff'));assert.equal(font.subarray(0,4).toString(),'wOFF');
 const license=await readFile(join(site,'desktop-header-font-license.txt'),'utf8');assert.match(license,/Apache-2.0/);assert.match(license,/modified ASCII subset/);
});
