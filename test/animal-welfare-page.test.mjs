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
 assert.match(page,/Every animal—abandoned, injured, neglected, or displaced—deserves safety, care, and respect\./);
 assert.equal((page.match(/class="animal-detail-row"/g)||[]).length,4);
 assert.match(page,/Have an idea for an animal welfare project or wish to contribute to our mission\?/);
 assert.match(page,/href="contact.html#message-heading"/);
 assert.equal((page.match(/href="donate.html\?cause=animal-welfare#donation-payment"/g)||[]).length,2);
 assert.match(page,/href="coming-soon.html\?cause=animal-welfare"/);
 assert.match(page,/animal-welfare.css\?v=[a-f0-9]{16}/);
});
test('Animal Welfare page, photograph reference and stylesheet resolve',async()=>{
 const server=createPreviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const base='http://127.0.0.1:'+server.address().port;for(const path of ['/animal-welfare.html','/animal-welfare.css','/Animal%20Welfare_%20Compassion%20in%20Action.png'])assert.equal((await fetch(base+path)).status,200,path);}finally{await new Promise(r=>server.close(r));}
});

test('Animal Welfare expansion preserves the infographic wording as four accessible HTML sections',async()=>{
 const html=await readFile(new URL('../public/animal-welfare.html',import.meta.url),'utf8');
 const expected=[
 ['Protection and Dignity','Every animal—abandoned, injured, neglected, or displaced—deserves safety, care, and respect. Our mission is to defend their well-being and help create a world free from cruelty and suffering.'],
 ['Compassion in Action','We are developing projects to support animal rescue efforts, assist shelters, expand access to essential veterinary care, and promote humane treatment. Our goal is to bring relief, healing, and renewed hope to animals in need.'],
 ['Stronger Together','Lasting change grows through collaboration. We aim to work with shelters, rescue organizations, veterinary professionals, and dedicated volunteers, uniting resources and compassion to improve animal welfare in our communities and beyond.'],
 ['A Kinder Future','Our vision is to create lasting protection for animals through education, awareness, and responsible care. We aspire to prevent cruelty, reduce abandonment, and build a world where every animal can live with safety, health, and dignity.']
 ];
 const rows=[...html.matchAll(/<section class="animal-detail-row">([\s\S]*?)<\/section>/g)];assert.equal(rows.length,4);
 rows.forEach(([,row],i)=>{assert(row.includes('<h3>'+expected[i][0]+'</h3>'));assert(row.includes('<p>'+expected[i][1]+'</p>'));assert(row.includes('<svg'));});
});

test('Animal Welfare modal reuses the exact shared message form and existing delivery script',async()=>{
 const page=await readFile(new URL('../public/animal-welfare.html',import.meta.url),'utf8');
 const contact=await readFile(new URL('../public/contact.html',import.meta.url),'utf8');
 const section=/<section class="card content-panel contact-message"[\s\S]*?<\/section>/;
 assert.equal(page.match(section)[0],contact.match(section)[0]);
 assert.match(page,/<dialog class="shared-contact-modal" aria-labelledby="message-heading">/);
 assert.equal((page.match(/class="contact-form"/g)||[]).length,1);
 const js=await readFile(new URL('../public/contact-modal.js',import.meta.url),'utf8');
 assert.match(js,/script.src='contact.js'/);assert.doesNotMatch(js,/fetch\(/);
});

test('Animal Welfare subtitle and four focus descriptions omit only ending periods',async()=>{
 const html=await readFile(new URL('../public/animal-welfare.html',import.meta.url),'utf8');
 assert.match(html,/class="animal-slogan">Protection, care, and dignity for all animals<\/p>/);
 const descriptions=[...html.matchAll(/<article class="animal-focus-card">[\s\S]*?<p>([^<]+)<\/p>/g)].map(m=>m[1]);
 assert.deepEqual(descriptions,['Helping animals facing abandonment, harm, and danger','Supporting food, shelter, and essential care','Promoting humane treatment and protection','Encouraging responsible care and sustainable animal welfare']);
});
