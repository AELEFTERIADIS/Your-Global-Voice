(() => {
 const dialog=document.querySelector('.donate-mailing-dialog');
 const trigger=document.querySelector('.give-alternative .give-other-card:first-child .give-other-action');
 if(!dialog||!trigger)return;
 document.body.append(dialog);
 let opener;
 trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls','donate-mailing-instructions');dialog.id='donate-mailing-instructions';
 trigger.addEventListener('click',event=>{event.preventDefault();opener=document.activeElement;dialog.showModal();dialog.scrollTop=0;});
 dialog.querySelectorAll('[data-mailing-close]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
 dialog.addEventListener('close',()=>{if(!dialog.open)opener?.focus({preventScroll:true});});
 dialog.querySelector('.mailing-print').addEventListener('click',()=>{
  const sheet=dialog.querySelector('.mailing-sheet').cloneNode(true);
  sheet.querySelectorAll('.mailing-x,.mailing-actions').forEach(e=>e.remove());
  const css=document.querySelector('link[href*="donate-mailing.css"]').href;
  const printWindow=window.open('','_blank','width=900,height=1000');
  if(!printWindow){window.alert('Please allow the mailing instructions print window, then try again.');return;}
  printWindow.opener=null;
  printWindow.document.open();
  printWindow.addEventListener('load',()=>{printWindow.document.fonts.ready.then(()=>{printWindow.focus();printWindow.print();});},{once:true});
  printWindow.document.write('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Mailing Instructions — Your Global Voice</title><link rel="stylesheet" href="'+css+'"></head><body><section class="donate-mailing-dialog mailing-print-document">'+sheet.outerHTML+'</section></body></html>');
  printWindow.document.close();
 });
})();
