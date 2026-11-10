import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('approved hero divider is a transparent vector without raster or background replacement',async()=>{
 const svg=await readFile(new URL('../public/home-hero-approved-divider.svg',import.meta.url),'utf8');
 assert.match(svg,/viewBox="640 130 110 376"/);
 assert.equal((svg.match(/<path /g)||[]).length,3);
 assert.doesNotMatch(svg,/<image|<rect|<foreignObject|preserveAspectRatio="none"/);
 for(const id of ['home-approved-gold','home-approved-upper','home-approved-lower'])assert(svg.includes(`fill="url(#${id})"`));
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 assert(html.includes(svg));
 assert(html.includes('Hands holding a leafy globe together.'));
});
