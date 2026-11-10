document.querySelectorAll('[data-about-toggle]').forEach(button=>{
 const panel=document.getElementById(button.getAttribute('aria-controls'));
 if(!panel)return;
 button.addEventListener('click',()=>{
  const open=button.getAttribute('aria-expanded')!=='true';
  button.setAttribute('aria-expanded',String(open));
  button.textContent=button.dataset.aboutLabel?(open?'Close Our Story':'Our Story →'):(open?'Read Less':'Read More');
  panel.hidden=!open;
 });
});
