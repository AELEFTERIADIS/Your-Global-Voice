import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createPreviewServer} from '../scripts/server.mjs';

test('independent Human Rights page reuses the actual shared header and Causes footer',async()=>{
 const page=await readFile(new URL('../public/human-rights.html',import.meta.url),'utf8');
 const causes=await readFile(new URL('../public/purposes.html',import.meta.url),'utf8');
 const header=s=>s.match(/<header class="site-header">[\s\S]*?<\/header>/)[0];
 const footer=s=>s.match(/<footer class="desktop-home-footer"[\s\S]*?<\/footer>/)[0];
 assert.equal(header(page),header(causes));assert.equal(footer(page).replace(/<a class="cause-footer-return"[\s\S]*?<\/a>/,''),footer(causes));
 assert.equal((page.match(/<header\b/g)||[]).length,1);
 assert.equal((page.match(/<h1\b/g)||[]).length,1);
 assert.match(page,/<div class="human-rights-page-shell"><main/);
 assert.match(page,/<link rel="stylesheet" href="human-rights.css\?v=[a-f0-9]{16}">/);
});

test('approved Human Rights wording is real HTML and all cause actions preserve established destinations',async()=>{
 const html=await readFile(new URL('../public/human-rights.html',import.meta.url),'utf8');
 for(const phrase of ['A World of Equality,','Respect, and Human Dignity','Our Commitment','Defend<br>Human Rights','End<br>Discrimination','Protect<br>Human Dignity','Equality and Justice','Stand for Justice','Uphold Human Dignity'])assert(html.includes(phrase),phrase);
 assert.equal((html.match(/<article class="rights-commitment-card/g)||[]).length,4);
 assert.match(html,/href="donate.html\?cause=human-rights-dignity#donation-payment"/);
 assert.match(html,/href="get-involved.html"/);assert.match(html,/href="causes.html"/);
 assert(!html.includes('<form'));
 const causes=await readFile(new URL('../public/purposes.html',import.meta.url),'utf8');
 assert.match(causes,/class="human-rights-page-link" href="human-rights.html"/);
 assert.equal((causes.match(/<details class="human-rights-more/g)||[]).length,0);
});

test('new page, local stylesheet and approved photograph source are available without exposing private files',async t=>{
 const s=createPreviewServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>s.close(r)));const base='http://127.0.0.1:'+s.address().port;
 for(const url of ['/human-rights','/human-rights/','/human-rights.html','/human-rights.css','/Human%20Rights%20and%20Dignity%20Nonprofit%20Poster.png'])assert.equal((await fetch(base+url)).status,200,url);
 const page=await fetch(base+'/human-rights.html');assert.match(page.headers.get('content-security-policy'),/default-src 'none'/);
 assert.equal((await fetch(base+'/content/contact.json')).status,404);
});
