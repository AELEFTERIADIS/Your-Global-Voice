import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {missionImages} from '../scripts/mission-images.mjs';
import {renderDesktopHomeFooter} from '../scripts/desktop-home.mjs';
import {renderDesktopMissionFooter} from '../scripts/desktop-mission.mjs';
const html=await readFile(new URL('../public/mission.html',import.meta.url),'utf8');
const desktop=html.split('<div class="desktop-mission-page">')[1].split('<div class="mission-compact-preserved">')[0];
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
test('desktop Mission preserves the original mission photographs and all approved full statements',async()=>{
 for(const image of missionImages.slice(0,4))assert(desktop.includes(`src="${image.src}" width="${image.width}" height="${image.height}"`));
 const mission=JSON.parse(await readFile(new URL('../content/mission.json',import.meta.url),'utf8'));
 for(const part of mission)assert(desktop.includes(`<p>${escape(typeof part==='string'?part:part.text)}</p>`));
 for(const section of mission.slice(2,6))assert(desktop.replaceAll('<br>',' ').includes(section.slogan));
 assert.equal((desktop.match(/<article class="desktop-mission-card /g)||[]).length,4);
 assert.doesNotMatch(desktop,/<h[1-6][^>]*>Our Commitment/);
 assert(desktop.indexOf('class="desktop-mission-hero"')<desktop.indexOf('class="desktop-mission-cards"'));
 assert(desktop.includes('<details class="desktop-mission-guides">'));
});
test('Mission uses existing participation, donation, and shared footer components',async()=>{
 assert(desktop.includes('href="donate.html#donation-payment"'));
 assert(desktop.includes('href="get-involved.html#application"'));
 const contact=JSON.parse(await readFile(new URL('../content/contact.json',import.meta.url),'utf8'));
 assert(html.includes(renderDesktopMissionFooter(contact)));
 assert.equal(renderDesktopMissionFooter(contact).split('</section></div>')[0],renderDesktopHomeFooter(contact).split('</section></div>')[0]);
 assert.equal((html.match(/<footer class="desktop-home-footer"/g)||[]).length,1);
 assert.equal((desktop.match(/class="[^\"]*desktop-mission-photo-pending"/g)||[]).length,0);
 assert(desktop.includes('class="desktop-mission-hero-art"'));
 assert(desktop.includes('class="desktop-mission-closing-art"'));
 assert.doesNotMatch(desktop,/<form|(?:href|src)="https?:\/\//);
});

test('new Mission desktop reference keeps original community photo, cause order, navy motto and a single-line closing',()=>{
 assert(desktop.includes('href="get involved 111.JPEG"'));
 assert(desktop.includes('preserveAspectRatio="xMidYMid slice"'));
 const colors=[...desktop.matchAll(/<article class="desktop-mission-card desktop-mission-([^\"]+)/g)].map(m=>m[1]);
 assert.deepEqual(colors,['red','purple','brown','green']);
 assert(desktop.includes('Compassion | Dignity | Responsibility'));
 assert(desktop.includes('for a more just and caring world'));
 const closing=desktop.match(/<h2 id="desktop-mission-invitation-title">(.*?)<\/h2>/)[1];
 assert(!closing.includes('<br'));
 assert(closing.includes('One World <span>|</span> One Shared Responsibility'));
 assert(!desktop.includes('2D800A7B-B42F-453F-9FEA-E8615115523D.jpeg'));
});

test('Issue 1 decorations use only the approved Mission reference and preserve individual tapered color contours',async()=>{
 const source=await readFile(new URL('../scripts/desktop-mission.mjs',import.meta.url),'utf8');
 const decoration=source.slice(source.indexOf('const waves='),source.indexOf('const heroArtwork='));
 assert(decoration.includes('mission-reference-hero-wave'));
 assert(decoration.includes('mission-reference-closing-wave'));
 assert(decoration.includes('mission-reference-hero-divider'));
 assert(decoration.includes('mission-reference-closing-divider'));
 assert(!decoration.includes('stroke-dasharray'));
 assert(!decoration.includes('About Us'));
 assert(!decoration.includes('home-approved'));
});

test('Mission closing uses the new 123456789 reference, omits the invitation paragraph, and integrates the actual footer',async()=>{
 const source=await readFile(new URL('../scripts/desktop-mission.mjs',import.meta.url),'utf8');
 const closing=desktop.split('<section class="desktop-mission-invitation"')[1];
 assert(closing.includes('123456789.png'));
 assert(!closing.includes('Join us in building'));
 assert(closing.includes('Be Part of Our Mission'));
 assert(html.includes('desktop-mission-footer-wave'));
 assert(source.includes("renderDesktopHomeFooter(contact).replace"));
});

test('desktop Mission cards use the four approved upright slogan boxes while full statements remain available',()=>{
 const cards=desktop.split('<section class="desktop-mission-cards"')[1].split('</section>')[0];
 assert.equal((cards.match(/class="desktop-mission-slogan"/g)||[]).length,4);
 const slogans=['Compassion in Action','Justice Without Discrimination','Compassion Beyond Humanity','Protect Nature, Preserve Our Future'];
 const actual=[...cards.matchAll(/<p class="desktop-mission-slogan"><span>(.*?)<\/span><\/p>/g)].map(m=>m[1].replaceAll('<br>',' '));
 assert.deepEqual(actual,slogans);
 assert(!cards.includes('Provide humanitarian assistance'));
 assert(desktop.includes('Our Full Mission Statement'));
});
