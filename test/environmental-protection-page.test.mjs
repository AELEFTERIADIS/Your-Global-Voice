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

test('expanded commitment preserves all five approved explanations and reuses the existing message form',async()=>{
 const html=await readFile(new URL('../public/environmental-protection.html',import.meta.url),'utf8');
 const rows=[...html.matchAll(/<section class="environment-detail-row"[^>]*>([\s\S]*?)<\/section>/g)];
 const expected=[
 ['A Planet Worth Protecting','Every forest, river, ocean, and living ecosystem is part of our shared home. Protecting these natural treasures means safeguarding human well-being, biodiversity, and the future of generations yet to come.'],
 ['The Challenges Before Us','Climate change, deforestation, pollution, and the loss of natural habitats threaten communities and ecosystems worldwide. These challenges cross borders and demand greater awareness, shared responsibility, and lasting solutions.'],
 ['Turning Concern Into Action','Your Global Voice is developing environmental initiatives focused on conservation, reforestation, pollution reduction, and responsible resource use. Our intention is to transform compassion into practical opportunities that help restore nature and protect vulnerable ecosystems.'],
 ['Stronger Through Cooperation','Meaningful environmental progress requires collective effort. We aspire to collaborate with communities, environmental organizations, specialists, and volunteers to exchange knowledge, strengthen local initiatives, and encourage responsible stewardship across borders.'],
 ['A Future We Can Shape Together','Our vision is a world where clean water, thriving forests, healthy ecosystems, and sustainable communities are not privileges, but foundations of a better future. Through education, compassion, and purposeful action, we hope to help build a planet where nature and humanity can flourish together.']
 ];
 assert.equal(rows.length,5);rows.forEach(([,row],i)=>{assert.equal(row.match(/<h3[^>]*>(.*?)<\/h3>/)[1].replaceAll('<br>',' '),expected[i][0]);assert(row.includes('<p>'+expected[i][1]+'</p>'));assert(row.includes('<svg'));});
 assert.doesNotMatch(html,/Our Planet, Our Shared Responsibility/);
 assert.match(html,/Your Ideas Matter/);
 assert(html.includes('Have an environmental concern, a project proposal, or a desire to contribute? We welcome your ideas and participation as we develop meaningful ways to protect our shared planet.'));
 assert.match(html,/data-contact-modal href="contact.html#message-heading"/);
 const contact=await readFile(new URL('../public/contact.html',import.meta.url),'utf8');
 const form=/<section class="card content-panel contact-message"[\s\S]*?<\/section>/;
 assert.equal(html.match(form)[0],contact.match(form)[0]);
 assert.match(html,/<dialog class="shared-contact-modal" aria-labelledby="message-heading">/);
 assert.equal((html.match(/class="contact-form"/g)||[]).length,1);
 assert.doesNotMatch(html,/Environmental Protection Commitment Page.png/);
});
