const desktopSidebarToggle=document.querySelector('.desktop-sidebar-toggle');
const desktopSidebar=document.querySelector('#desktop-quick-links');
if(desktopSidebarToggle&&desktopSidebar){
 const setSidebar=open=>{desktopSidebar.hidden=!open;desktopSidebarToggle.setAttribute('aria-expanded',String(open));};
 setSidebar(desktopSidebarToggle.getAttribute('aria-expanded')==='true');
 desktopSidebarToggle.addEventListener('click',()=>setSidebar(desktopSidebarToggle.getAttribute('aria-expanded')!=='true'));
 desktopSidebar.addEventListener('keydown',event=>{if(event.key==='Escape'){setSidebar(false);desktopSidebarToggle.focus();event.preventDefault();}});
}
