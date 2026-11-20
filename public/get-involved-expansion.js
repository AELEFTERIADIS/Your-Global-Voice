const control=document.querySelector('.giv-intro-more');
const content=document.getElementById('giv-expanded');
if(control&&content){
 const summary=control.querySelector('summary');
 summary.setAttribute('aria-controls',content.id);
 let animation;let revision=0;let returnRequested=false;
 const sync=async(animate=true)=>{
  const current=++revision;
  animation?.cancel();
  const expanded=control.open;
  summary.setAttribute('aria-expanded',String(expanded));
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(expanded)content.hidden=false;
  if(animate&&!reduce&&!content.hidden){
   const height=content.getBoundingClientRect().height;
   animation=content.animate(expanded?[{height:'0px',opacity:0,overflow:'hidden'},{height:height+'px',opacity:1,overflow:'hidden'}]:[{height:height+'px',opacity:1,overflow:'hidden'},{height:'0px',opacity:0,overflow:'hidden'}],{duration:260,easing:'ease-in-out'});
   try{await animation.finished;}catch{return;}
  }
  if(current!==revision)return;
  content.hidden=!expanded;
  if(!expanded&&returnRequested){
   returnRequested=false;summary.focus({preventScroll:true});
   document.querySelector('.giv-introduction')?.scrollIntoView({behavior:reduce?'instant':'smooth',block:'start'});
  }
 };
 control.addEventListener('toggle',()=>sync());sync(false);
 content.querySelector('.giv-return-back')?.addEventListener('click',()=>{returnRequested=true;control.open=false;});
}
