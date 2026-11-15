// This module only handles hero navigation. It does not access payment APIs.
const causeNotice=document.querySelector('.projects-cause-notice');
if(causeNotice) {
 const copy=causeNotice.querySelector('.projects-cause-notice-copy');
 const close=causeNotice.querySelector('button');
 const currentProjects=causeNotice.querySelector('a');
 for(const link of document.querySelectorAll('.projects-hero-cause')) {
  const target=document.getElementById(link.dataset.causeTarget);
  if(target) {
   link.setAttribute('href','#'+target.id);
   link.removeAttribute('title');
   continue;
  }
  // No fictitious category sections or broken fragments: the native fallback
  // goes to the existing listing, even without JS or dialog support.
  if(typeof causeNotice.showModal!=='function')continue;
  link.setAttribute('aria-haspopup','dialog');
  link.addEventListener('click',event=>{
   if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
   event.preventDefault();
   copy.textContent=link.dataset.causeLabel+' does not have a dedicated project category section yet. You can view our current projects below.';
   causeNotice.showModal();
  });
 }
 close.addEventListener('click',()=>causeNotice.close());
 currentProjects.addEventListener('click',event=>{
  event.preventDefault();
  causeNotice.close();
  const heading=document.getElementById('project-initiatives-heading');
  if(heading) {
   heading.setAttribute('tabindex','-1');
   heading.focus({preventScroll:true});
   heading.scrollIntoView({block:'center'});
  }
 });
}

// Align the desktop globe with the actual separator after the browser resolves its fonts.
function alignProjectsHeroGlobe() {
 const subtitle=document.querySelector('.projects-hero-slogan-desktop');
 const globe=document.querySelector('.projects-hero-mini-globe');
 const lines=document.querySelector('.projects-hero-globe-lines');
 if(!subtitle||!globe||!lines||typeof subtitle.getStartPositionOfChar!=='function'||getComputedStyle(subtitle).display==='none')return;
 const index=subtitle.textContent.indexOf('|');
 if(index<0)return;
 const center=(subtitle.getStartPositionOfChar(index).x+subtitle.getEndPositionOfChar(index).x)/2;
 globe.setAttribute('transform',`translate(${center} 619)`);
 lines.setAttribute('d',`M225 610Q540 592 ${center-33} 619M${center+33} 619Q1234 592 1549 610`);
}
alignProjectsHeroGlobe();
document.fonts?.ready.then(alignProjectsHeroGlobe);
globalThis.addEventListener?.('resize',alignProjectsHeroGlobe,{passive:true});
