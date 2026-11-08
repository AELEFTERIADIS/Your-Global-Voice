const sidebarMenus=[...document.querySelectorAll('.home-sidebar-item')];
function closeSidebarMenus(current){for(const menu of sidebarMenus)if(menu!==current)menu.open=false;}
for(const menu of sidebarMenus){
 menu.querySelector('summary').addEventListener('click',()=>closeSidebarMenus(menu));
 menu.addEventListener('toggle',()=>{if(menu.open)closeSidebarMenus(menu);});
 menu.addEventListener('keydown',event=>{if(event.key==='Escape'){menu.open=false;menu.querySelector('summary').focus();event.preventDefault();}});
 menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menu.open=false;}));
}
document.addEventListener('click',event=>{if(!event.target.closest('.home-sidebar'))closeSidebarMenus(null);});
matchMedia('(min-width: 108rem) and (min-width: 1728px)').addEventListener('change',event=>{if(!event.matches)closeSidebarMenus(null);});
