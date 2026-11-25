(() => {
 if(!matchMedia('(min-width:80rem)').matches)return;
 const dialog=document.querySelector('.donate-corporate-dialog');
 const trigger=document.querySelector('.give-alternative .give-other-card:nth-child(4) .give-other-action');
 if(!dialog||!trigger)return;
 document.body.append(dialog);dialog.id='donate-corporate-partnerships';
 trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls',dialog.id);
 let opener;
 trigger.addEventListener('click',event=>{event.preventDefault();opener=document.activeElement;dialog.showModal();dialog.scrollTop=0;});
 dialog.querySelector('.corporate-modal-x').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));
})();
