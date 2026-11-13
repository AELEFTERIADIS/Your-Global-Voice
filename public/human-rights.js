const disclosure=document.querySelector('.rights-commitment-more');
const close=disclosure?.querySelector('.rights-read-less');
close?.addEventListener('click',()=>{
 disclosure.open=false;
 disclosure.querySelector('summary').focus({preventScroll:true});
 disclosure.querySelector('summary').scrollIntoView({block:'nearest'});
});
