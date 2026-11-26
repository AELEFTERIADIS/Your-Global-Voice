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

 const panel=root.querySelector('.give-central'),surround=document.createElement('div');surround.className='give-panel-surround';panel.before(surround);surround.append(panel);
 const action=root.querySelector('.give-hope-action');
 // Review-only desktop draft: no provider navigation or payment requests.
 const purpose=root.querySelector('#give-project'),purposeGroup=root.querySelector('.give-project-choice'),note=root.querySelector('.give-designation-note');
 const available=[...purpose.options].map(o=>({id:o.value,cause:o.dataset.cause,causeName:o.dataset.causeName,label:o.textContent}));
 // Select-only combobox; the original select remains the source of donation values.
 const projectTrigger=document.createElement('button'),projectMenu=document.createElement('div');
 projectTrigger.type='button';projectTrigger.id='give-project-trigger';projectTrigger.className='give-project-trigger';
 projectTrigger.setAttribute('role','combobox');projectTrigger.setAttribute('aria-haspopup','listbox');projectTrigger.setAttribute('aria-expanded','false');
 projectTrigger.setAttribute('aria-controls','give-project-menu');
 projectMenu.id='give-project-menu';projectMenu.className='give-project-menu';projectMenu.setAttribute('role','listbox');projectMenu.hidden=true;
 const projectLabel=purposeGroup.querySelector('label');projectLabel.id='give-project-label';projectLabel.htmlFor=projectTrigger.id;
 projectTrigger.setAttribute('aria-labelledby','give-project-label give-project-trigger');projectMenu.setAttribute('aria-labelledby',projectLabel.id);
 purpose.hidden=true;purpose.after(projectTrigger,projectMenu);
 let activeProject=0,typeahead='',typeaheadTimer;
 function closeProjects(){projectMenu.hidden=true;projectTrigger.setAttribute('aria-expanded','false');projectTrigger.removeAttribute('aria-activedescendant');}
 function highlightProject(index){
  const options=[...projectMenu.children];if(!options.length)return;
  activeProject=(index+options.length)%options.length;
  options.forEach((option,i)=>option.classList.toggle('is-active',i===activeProject));
  projectTrigger.setAttribute('aria-activedescendant',options[activeProject].id);
  options[activeProject].scrollIntoView({block:'nearest'});
 }
 function refreshProjects(){
  closeProjects();projectTrigger.textContent=purpose.selectedOptions[0]?.textContent||'';projectMenu.replaceChildren();
  [...purpose.options].forEach((option,i)=>{const item=document.createElement('div');item.id='give-project-option-'+i;item.setAttribute('role','option');item.setAttribute('aria-selected',String(option.selected));item.textContent=option.textContent;
   item.addEventListener('mouseenter',()=>highlightProject(i));
   item.addEventListener('mousedown',event=>event.preventDefault());
   item.addEventListener('click',()=>{purpose.selectedIndex=i;purpose.dispatchEvent(new Event('change',{bubbles:true}));projectTrigger.focus({preventScroll:true});});projectMenu.append(item);
  });
 }
 function openProjects(){if(!purpose.options.length)return;projectMenu.hidden=false;projectTrigger.setAttribute('aria-expanded','true');highlightProject(purpose.selectedIndex);}
 projectTrigger.addEventListener('click',()=>projectMenu.hidden?openProjects():closeProjects());
 projectTrigger.addEventListener('keydown',event=>{
  const key=event.key;
  if(key==='Escape'){event.preventDefault();closeProjects();return;}
  if(key==='Tab'){closeProjects();return;}
  if(['ArrowDown','ArrowUp','Home','End'].includes(key)){
   event.preventDefault();const wasClosed=projectMenu.hidden;if(wasClosed)openProjects();
   if(key==='Home')highlightProject(0);else if(key==='End')highlightProject(purpose.options.length-1);else if(!wasClosed)highlightProject(activeProject+(key==='ArrowDown'?1:-1));return;
  }
  if(key==='Enter'||key===' '){event.preventDefault();if(projectMenu.hidden)openProjects();else{purpose.selectedIndex=activeProject;purpose.dispatchEvent(new Event('change',{bubbles:true}));}return;}
  if(key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();if(projectMenu.hidden)openProjects();clearTimeout(typeaheadTimer);typeahead+=key.toLocaleLowerCase();const index=[...purpose.options].findIndex(o=>o.textContent.toLocaleLowerCase().startsWith(typeahead));if(index>=0)highlightProject(index);typeaheadTimer=setTimeout(()=>typeahead='',700);}
 });
 purposeGroup.addEventListener('mouseleave',closeProjects);
 document.addEventListener('pointerdown',event=>{if(!purposeGroup.contains(event.target))closeProjects();});
 purposeGroup.addEventListener('focusout',event=>{if(!purposeGroup.contains(event.relatedTarget))closeProjects();});
 purpose.addEventListener('change',refreshProjects);
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
 function selectCause(cause,project){const general=cause==='general-support';const card=[...root.querySelectorAll('[name=give-cause]')].find(input=>input.value===cause)?.closest('.give-cause');if(card)purposeGroup.style.setProperty('--project-background',getComputedStyle(card).getPropertyValue('--card-tint'));purposeGroup.hidden=general;note.hidden=general;purpose.replaceChildren();if(!general){available.filter(o=>o.cause===cause).forEach(o=>purpose.add(new Option(o.label,o.id)));if([...purpose.options].some(o=>o.value===project))purpose.value=project;}refreshProjects();updateSummary();}
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
