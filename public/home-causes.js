const causeMenus=[...document.querySelectorAll('.home-cause-explore')];
function updateMenuState(menu){menu.closest('.home-cause-card').classList.toggle('is-open',menu.open);}
function closeOthers(current){for(const menu of causeMenus)if(menu!==current){menu.open=false;updateMenuState(menu);}}
for(const menu of causeMenus){
 menu.querySelector('summary').addEventListener('click',()=>closeOthers(menu));
 menu.addEventListener('toggle',()=>{if(menu.open)closeOthers(menu);updateMenuState(menu);});
 menu.addEventListener('keydown',event=>{if(event.key==='Escape'){menu.open=false;updateMenuState(menu);menu.querySelector('summary').focus();event.preventDefault();}});
 menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menu.open=false;updateMenuState(menu);}));
}
document.addEventListener('click',event=>{if(!event.target.closest('.home-cause-explore'))closeOthers(null);});
