const messageDialog=document.querySelector('.shared-contact-modal');
const messageTrigger=document.querySelector('[data-contact-modal]');
if(messageDialog&&messageTrigger&&typeof messageDialog.showModal==='function'){
 let initialized=false;
 messageTrigger.setAttribute('aria-haspopup','dialog');
 messageTrigger.addEventListener('click',event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  messageDialog.showModal();
  if(!initialized){
   initialized=true;
   const script=document.createElement('script');script.src='contact.js';
   script.onerror=()=>{document.querySelector('#contact-status').textContent='The message form could not initialize. Please open our Contact page to send your message.';};
   document.head.append(script);
  }
  messageDialog.querySelector('#contact-name').focus();
 });
 messageDialog.querySelector('.shared-contact-close').addEventListener('click',()=>messageDialog.close());
 messageDialog.addEventListener('close',()=>messageTrigger.focus());
}
