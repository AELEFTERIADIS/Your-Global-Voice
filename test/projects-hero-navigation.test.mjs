import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {projectHeroCauses,renderProjectsHero,projectHeroArtwork} from '../scripts/projects-hero.mjs';
import {approvedCauseIds} from '../worker/donation-registry.mjs';
const script=await readFile(new URL('../public/projects-hero.js',import.meta.url),'utf8');
function setup({existing=false,dialogs=true}={}) {
 const events={},attributes={href:'#project-initiatives-heading'};
 const link={dataset:{causeTarget:'projects-animal-welfare',causeLabel:'Animal Welfare'},setAttribute:(key,value)=>attributes[key]=value,removeAttribute:key=>delete attributes[key],addEventListener:(name,fn)=>events[name]=fn};
 const copy={},closeEvents={},viewEvents={};
 const heading={setAttribute(){},focus(){heading.focused=true;},scrollIntoView(options){heading.scrolled=options;}};
 const dialog={open:false,querySelector:selector=>selector==='.projects-cause-notice-copy'?copy:selector==='button'?{addEventListener:(name,fn)=>closeEvents[name]=fn}:{addEventListener:(name,fn)=>viewEvents[name]=fn},close(){this.open=false;}};
 if(dialogs)dialog.showModal=function(){this.open=true;};
 const document={querySelector:()=>dialog,querySelectorAll:()=>[link],getElementById:id=>id==='project-initiatives-heading'?heading:existing && id==='projects-animal-welfare'?{id}:null};
 vm.runInNewContext(script,{document});
 return {events,attributes,copy,dialog,closeEvents,viewEvents,heading};
}
test('hero navigation reuses exactly the four cause identities without creating category sections',()=>{
 assert.deepEqual(projectHeroCauses.map(c=>c.id),approvedCauseIds);
 assert.deepEqual(projectHeroCauses.map(c=>c.label),['Justice','Compassion','Protection','Nature']);
 assert.equal(projectHeroArtwork.width/projectHeroArtwork.height,2);
 assert.equal(projectHeroArtwork.src,'projects-hero-compact.webp');
 const relativeHeight=(projectHeroArtwork.height/projectHeroArtwork.width)/(941/1672);
 assert(relativeHeight>=.88 && relativeHeight<=.92);
 const hero=renderProjectsHero();
 assert.equal((hero.match(/<section\b/g)||[]).length,1);
 assert.equal((hero.match(/<dialog\b/g)||[]).length,1);
 assert.equal((hero.match(/class="projects-hero-cause"/g)||[]).length,4);
 for(const cause of projectHeroCauses)assert(hero.includes(`data-cause-target="projects-${cause.id}"`));
});
test('missing categories give accessible feedback and navigate only to the existing listing',()=>{
 const f=setup();let prevented=false;
 f.events.click({preventDefault(){prevented=true;}});
 assert(prevented);assert(f.dialog.open);assert.match(f.copy.textContent,/Animal Welfare.*not have a dedicated/);
 assert.equal(f.attributes['aria-haspopup'],'dialog');
 f.viewEvents.click({preventDefault(){}});
 assert.equal(f.dialog.open,false);assert(f.heading.focused);assert.equal(f.heading.scrolled.block,'center');
 f.events.click({preventDefault(){}});f.closeEvents.click();assert.equal(f.dialog.open,false);
});
test('existing category targets become native fragment links and modified clicks retain browser behavior',()=>{
 const ready=setup({existing:true});
 assert.equal(ready.attributes.href,'#projects-animal-welfare');assert.equal(ready.events.click,undefined);
 const pending=setup();pending.events.click({ctrlKey:true,preventDefault(){assert.fail('modified click intercepted');}});
 assert.equal(pending.dialog.open,false);
 const fallback=setup({dialogs:false});assert.equal(fallback.events.click,undefined);assert.equal(fallback.attributes.href,'#project-initiatives-heading');
});
