// Local donation intent only. Hosted checkout receives no designation or amount.
(() => {
 const desktopTemplate=document.querySelector('#donate-desktop-content');
 const desktopMedia=matchMedia('(min-width: 80rem)');
 desktopMedia.addEventListener('change',()=>location.reload());
 if(!desktopMedia.matches){desktopTemplate?.remove();return;}
 if(desktopTemplate)document.querySelector('#main').replaceChildren(desktopTemplate.content.cloneNode(true));
 const root=document.querySelector('.give-page');if(!root)return;
 const main=root.closest('main'),footer=main.nextElementSibling;
 if(footer?.classList.contains('desktop-home-footer')){const shell=document.createElement('div');shell.className='donate-content-shell';main.before(shell);shell.append(main,footer);}

 const action=root.querySelector('.give-hope-action');
 // Review-only desktop draft: no provider navigation or payment requests.
 const purpose=root.querySelector('#give-project'),purposeGroup=root.querySelector('.give-project-choice'),note=root.querySelector('.give-designation-note');
 const available=[...purpose.options].map(o=>({id:o.value,cause:o.dataset.cause,causeName:o.dataset.causeName,label:o.textContent}));
 function updateSummary(){
  const selected=root.querySelector('[name=give-cause]:checked').value;
  const general=selected==='general-support';
  const generalOption=available.find(o=>o.id===selected);
  root.querySelector('#summary-cause').textContent=general?'Our Overall Mission':generalOption.causeName;
  root.querySelector('#summary-purpose').textContent=general?'General mission support':purpose.selectedOptions[0].textContent;
  const amount=root.querySelector('[name=giving-amount]:checked').value,custom=root.querySelector('#giving-custom');
  root.querySelector('.give-custom-entry').hidden=amount!=='custom';
  const value=Number(amount==='custom'?custom.value:amount);
  root.querySelector('#summary-amount').textContent=amount==='custom'&&(!custom.value||!custom.checkValidity())?'Enter a valid amount':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value)+' USD';
  root.querySelector('#summary-frequency').textContent=root.querySelector('[name=giving-frequency]:checked').value==='monthly'?'Monthly':'One-Time';
 }
 root.querySelectorAll('[name=giving-amount],[name=giving-frequency]').forEach(input=>input.addEventListener('change',updateSummary));
 root.querySelector('#giving-custom').addEventListener('input',updateSummary);
 function selectCause(cause,project){const general=cause==='general-support';purposeGroup.hidden=general;note.hidden=general;purpose.replaceChildren();if(!general){available.filter(o=>o.cause===cause).forEach(o=>purpose.add(new Option(o.label,o.id)));if([...purpose.options].some(o=>o.value===project))purpose.value=project;}updateSummary();}
 root.querySelectorAll('[name=give-cause]').forEach(input=>input.addEventListener('change',()=>selectCause(input.value)));
 purpose.addEventListener('change',updateSummary);
 root.querySelectorAll('[name=giving-method]').forEach(input=>input.addEventListener('change',()=>{updateSummary();root.querySelector('#give-review-status').hidden=true;}));
 action.addEventListener('click',()=>{
  const custom=root.querySelector('#giving-custom');
  if(root.querySelector('[name=giving-amount]:checked').value==='custom'&&(!custom.value||!custom.checkValidity())){custom.focus();custom.reportValidity();return;}
  updateSummary();const status=root.querySelector('#give-review-status');
  const method={card:'Credit or Debit Card',paypal:'PayPal',ach:'Bank Account (ACH)'}[root.querySelector('[name=giving-method]:checked').value];
  status.textContent=`Review mode: ${method} selected. No payment was processed or opened. Review your choices in Your Donation Summary.`;status.hidden=false;
 });
 const params=new URLSearchParams(location.search);
 const requested=params.get('project')||params.get('designation')||params.get('designationId');
 const project=available.find(o=>o.id===requested);
 const cause=project?.cause||params.get('cause')||'general-support';
 const match=[...root.querySelectorAll('[name=give-cause]')].find(o=>o.value===cause);
 const selected=match||root.querySelector('[name=give-cause][value="general-support"]');selected.checked=true;selectCause(selected.value,project?.id);
})();
