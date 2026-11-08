const causeMenus=[...document.querySelectorAll('.home-cause-explore')];
function updateMenuSpace(menu){
 const card=menu.closest('.home-cause-card');
 card.classList.toggle('is-open',menu.open);
 if(menu.open){
  const frame=card.querySelector('.home-cause-art-frame').getBoundingClientRect();
  const panel=menu.querySelector('.home-cause-menu').getBoundingClientRect();
  card.style.setProperty('--home-cause-menu-space',`${Math.ceil(panel.bottom-frame.bottom)}px`);
 }else card.style.removeProperty('--home-cause-menu-space');
}
function closeOthers(current){for(const menu of causeMenus)if(menu!==current){menu.open=false;updateMenuSpace(menu);}}
for(const menu of causeMenus){
 menu.querySelector('summary').addEventListener('click',()=>closeOthers(menu));
 menu.addEventListener('toggle',()=>{if(menu.open)closeOthers(menu);updateMenuSpace(menu);});
 menu.addEventListener('keydown',event=>{if(event.key==='Escape'){menu.open=false;updateMenuSpace(menu);menu.querySelector('summary').focus();event.preventDefault();}});
 menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menu.open=false;updateMenuSpace(menu);}));
 new ResizeObserver(()=>updateMenuSpace(menu)).observe(menu.querySelector('.home-cause-menu'));
}
window.addEventListener('resize',()=>{for(const menu of causeMenus)updateMenuSpace(menu);});
document.addEventListener('click',event=>{if(!event.target.closest('.home-cause-explore'))closeOthers(null);});
