import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createPreviewServer} from '../scripts/server.mjs';

test('Humanitarian page preserves the actual Causes header/footer and has four action-free focus cards',async()=>{
 const html=await readFile(new URL('../public/humanitarian.html',import.meta.url),'utf8');
 const causes=await readFile(new URL('../public/purposes.html',import.meta.url),'utf8');
 for(const tag of ['header','footer']){
  const pattern=tag==='header'?/<header class="site-header">[\s\S]*?<\/header>/:/<footer class="desktop-home-footer"[\s\S]*?<\/footer>/;
  assert.equal(html.match(pattern)[0].replace(/<a class="cause-footer-return"[\s\S]*?<\/a>/,''),causes.match(pattern)[0]);
 }
 assert.equal((html.match(/<header\b/g)||[]).length,1);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 const cards=[...html.matchAll(/<article class="relief-focus-card">([\s\S]*?)<\/article>/g)];
 assert.equal(cards.length,4);
 for(const [,card] of cards)assert.doesNotMatch(card,/<a\b|<button\b|Explore More/);
 for(const phrase of ['Essential<br>Assistance','Emergency<br>Relief','Community<br>Recovery','Lasting<br>Resilience','When hardship strikes,','Our Humanitarian Commitment','Compassion That Reaches'])assert(html.includes(phrase));
 assert.match(html,/<div class="humanitarian-page-shell"><main/);
 assert.match(html,/humanitarian.css\?v=[a-f0-9]{16}/);
});

test('Humanitarian has one initially collapsed inline statement, existing actions and its originating cause link',async()=>{
 const html=await readFile(new URL('../public/humanitarian.html',import.meta.url),'utf8');
 assert.equal((html.match(/<details class="relief-more"/g)||[]).length,1);
 assert.match(html,/<details class="relief-more"><summary>/);
 assert.doesNotMatch(html,/<details class="relief-more" open/);
 assert.match(html,/relief-read-more">Read More/);assert.match(html,/relief-read-less">Read Less/);
 assert(html.includes('Beyond emergency response, we support preparedness, self-reliance, and sustainable solutions to help communities recover with strength and dignity and better face future challenges.'));
 assert.equal((html.match(/href="donate.html\?cause=humanitarian-assistance#donation-payment"/g)||[]).length,2);
 assert.match(html,/class="relief-action relief-involve" href="coming-soon.html\?cause=humanitarian-assistance"/);
 assert.match(html,/class="cause-footer-return" href="causes.html"/);
 const causes=await readFile(new URL('../public/purposes.html',import.meta.url),'utf8');
 assert.match(causes,/<li id="humanitarian-assistance"[\s\S]*?href="humanitarian.html">Explore More/);
});

test('Humanitarian routes and photograph assets resolve under the existing security policy',async t=>{
 const server=createPreviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base='http://127.0.0.1:'+server.address().port;
 for(const path of ['/humanitarian','/humanitarian/','/humanitarian.html','/humanitarian.css','/Compassion%20Beyond%20Borders_%20Humanitarian%20Relief.png','/5008A87A-3C8C-4B00-A61F-FECAB730B2A7.PNG'])assert.equal((await fetch(base+path)).status,200,path);
 assert.match((await fetch(base+'/humanitarian.html')).headers.get('content-security-policy'),/default-src 'none'/);
 assert.equal((await fetch(base+'/content/purposes.json')).status,404);
});


test('expanded humanitarian commitment preserves all four reference explanations and reuses the shared message form',async()=>{
 const html=await readFile(new URL('../public/humanitarian.html',import.meta.url),'utf8');
 const rows=[...html.matchAll(/<section class="relief-detail-row">([\s\S]*?)<\/section>/g)];
 assert.equal(rows.length,4);
 const headings=['A Commitment to<br>Human Dignity','A Comprehensive<br>Humanitarian Approach','Collaboration for<br>Greater Impact','Building Lasting<br>Resilience'];
 const paragraphs=[
 'We stand beside individuals and communities facing hardship, poverty, displacement, and the effects of natural disasters. Our humanitarian work is guided by compassion, respect, and support for the essential needs that protect life, health, and well-being.',
 'We focus on immediate relief, short-term assistance, and long-term recovery. Our goal is to ease suffering, restore essential services, support the rebuilding of homes and livelihoods, and strengthen community resilience.',
 'We work with volunteers, local communities, and humanitarian partner organizations in the United States and abroad. Through shared resources, knowledge, and coordinated action, we seek to reach individuals in need more effectively, respond with care, and create lasting, positive change.',
 'Beyond emergency response, we support preparedness, self-reliance, and sustainable solutions to help communities recover with strength and dignity and better face future challenges.'
 ];
 rows.forEach(([,row],i)=>{assert(row.includes('<h3>'+headings[i]+'</h3>'));assert(row.includes('<p>'+paragraphs[i]+'</p>'));assert(row.includes('<svg'));});
 assert.match(html,/class="relief-action relief-support relief-message" href="contact.html#message-heading"/);
 assert.doesNotMatch(html,/<form\b/);
 const contact=await readFile(new URL('../public/contact.html',import.meta.url),'utf8');
 assert(contact.includes('id="message-heading"'));
});
