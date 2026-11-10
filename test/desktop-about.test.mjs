import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderDesktopHomeClosing,renderDesktopHomeFooter} from '../scripts/desktop-home.mjs';
const html=await readFile(new URL('../public/about.html',import.meta.url),'utf8');
const desktop=html.split('<div class="desktop-about-page desktop-about-current-reference">')[1].split('<div class="about-compact-preserved">')[0];
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
test('desktop About preserves complete source biographies and original portrait identities',async()=>{
 const source=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');
 for(const [key,file] of [['andreasBiography','andreas-elefteriadis.html'],['maximosBiography','maximos-weimar.html'],['robertBiography','robert-shillenn.html']]){
  const biographyPage=await readFile(new URL('../public/'+file,import.meta.url),'utf8');
  const paragraphs=JSON.parse(source.match(new RegExp('const '+key+' = (\\[[\\s\\S]*?\\n\\]);'))[1]);
  for(const paragraph of paragraphs)assert(biographyPage.includes(`<p>${escape(paragraph)}</p>`));
 }
 for(const photo of ['E7F71712-32D1-43FE-BA18-618193E48BA8.png','C877690E-4E12-4A62-BCE4-47A36456254D.png','Elderly Cleric in Embroidered Hat.png'])assert(desktop.includes(`src="${photo}"`));
 assert(desktop.includes('Your Global Voice — About Us123.png'));
 assert(desktop.includes('About Us_ Unity in Diversity (1).png'));
 assert.equal((desktop.match(/class="desktop-about-profile-info"/g)||[]).length,3);
 assert.equal((desktop.match(/data-about-toggle/g)||[]).length,1);
 for(const [,id] of desktop.matchAll(/aria-controls="([^"]+)"/g))assert(desktop.includes(`id="${id}" class="desktop-about-expanded" hidden`));
 assert.doesNotMatch(desktop,/desktop-home-cause desktop-home-|desktop-about-dove|desktop-about-who/);
 assert(!desktop.includes('font:italic')); 
});
test('desktop About uses the actual Home closing and footer without creating another system',async()=>{
 assert(desktop.includes(renderDesktopHomeClosing()));
 const contact=JSON.parse(await readFile(new URL('../content/contact.json',import.meta.url),'utf8'));
 const expected=renderDesktopHomeFooter(contact);
 // Portable build rewrites existing absolute page links only; this shared footer already uses sibling paths.
 assert(html.includes(expected));
 assert.equal((html.match(/<footer class="desktop-home-footer"/g)||[]).length,1);
 assert(desktop.includes('href="donate.html#donation-payment"'));
 assert(desktop.includes('href="get-involved.html#application"'));
});

test('desktop About follows the new reference section order and keeps its hero concise',()=>{
 const hero=desktop.split('</section>')[0];
 assert.doesNotMatch(hero,/desktop-about-hero-description|<a |<button/);
 const sections=['desktop-about-hero','desktop-about-foundation','desktop-about-team','desktop-about-commitment','desktop-about-story','desktop-about-closing'];
 const positions=sections.map(c=>desktop.indexOf('class="'+c+'"'));
 assert(positions.every(p=>p>=0));
 assert.deepEqual(positions,[...positions].sort((a,b)=>a-b));
 assert(desktop.includes('data-about-label="Our Story"'));
 assert(desktop.includes('desktop-about-volunteers'));
});

test('desktop leadership links open individual biographies with a return to the team',async()=>{
 for(const [name,file] of [['Andreas Elefteriadis','andreas-elefteriadis.html'],['Archimandrite Maximos Weimar','maximos-weimar.html'],['Robert Shillenn','robert-shillenn.html']]){
  assert(desktop.includes(`href="${file}" aria-label="Read more about ${name}"`));
  const biography=await readFile(new URL('../public/'+file,import.meta.url),'utf8');
  assert(biography.includes(`id="biography-name">${name}</h1>`));
  assert(biography.includes('href="about.html#desktop-about-team-heading"'));
  assert(biography.includes('Return to About Us'));
  assert.equal((biography.match(/<main /g)||[]).length,1);
  assert.equal((biography.match(/<h1 /g)||[]).length,1);
  assert.doesNotMatch(biography,/about-compact-preserved|desktop-about-page|data-about-toggle/);
 }
});
