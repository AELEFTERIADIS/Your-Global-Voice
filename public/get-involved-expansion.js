const control=document.querySelector('.giv-intro-more');
const content=document.getElementById('giv-expanded');
if(control&&content){
 const summary=control.querySelector('summary');
 summary.setAttribute('aria-controls',content.id);
 const sync=()=>{content.hidden=!control.open;summary.setAttribute('aria-expanded',String(control.open));};
 control.addEventListener('toggle',sync);sync();
 content.querySelector('.giv-return-back')?.addEventListener('click',()=>{
  control.open=false;sync();
  summary.focus({preventScroll:true});
  document.querySelector('.giv-introduction')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 });
}
