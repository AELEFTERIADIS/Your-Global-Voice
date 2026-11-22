// Presentation and local intent only: no payment requests or ledger activation.
(() => {
 const desktopTemplate=document.querySelector('#donate-desktop-content');
 // Use the established 1280px desktop boundary; retain the original DOM below it.
 if(!matchMedia('(min-width: 80rem)').matches){desktopTemplate?.remove();return;}
 if(desktopTemplate)document.querySelector('#main').replaceChildren(desktopTemplate.content.cloneNode(true));
 const root=document.querySelector('.give-page');if(!root)return;
 const action=root.querySelector('.give-hope-action');
 const providerUrls={card:'https://buy.stripe.com/fZu9ANdgj8484zp1lX3Je00',paypal:'https://www.paypal.com/ncp/payment/PVJ5JKDKZW8VQ'};
 root.querySelectorAll('[name=giving-method]').forEach(input=>input.addEventListener('change',()=>{action.href=providerUrls[input.value];}));
 action.addEventListener('click',event=>{const custom=root.querySelector('#giving-custom');if(root.querySelector('[name=giving-amount]:checked').value==='custom'&&(!custom.value||!custom.checkValidity())){event.preventDefault();custom.focus();custom.reportValidity();}});
 const purpose=root.querySelector('#give-project'),note=root.querySelector('.give-designation-note');
 const names={'human-rights-dignity':'Human Rights & Dignity','humanitarian-assistance':'Humanitarian Assistance','animal-welfare':'Animal Welfare','environmental-conservation':'Environmental Protection'};
 function update(cause){purpose.replaceChildren();const option=new Option(cause?names[cause]:'Support Our General Mission',cause||'general-support');purpose.add(option);if(cause==='human-rights-dignity')purpose.add(new Option('Voices for Dignity','voices-for-dignity'));note.hidden=!cause;}
 root.querySelectorAll('[name=give-cause]').forEach(input=>input.addEventListener('change',()=>{root.querySelector('[name=give-scope][value=specific]').checked=true;update(input.value);}));
 root.querySelectorAll('[name=give-scope]').forEach(input=>input.addEventListener('change',()=>{if(input.value==='general'){root.querySelectorAll('[name=give-cause]').forEach(c=>c.checked=false);update(null);}else{const first=root.querySelector('[name=give-cause]:checked')||root.querySelector('[name=give-cause]');first.checked=true;update(first.value);}}));
 const requested=new URLSearchParams(location.search).get('cause');const match=[...root.querySelectorAll('[name=give-cause]')].find(c=>c.value===requested);if(match){match.checked=true;root.querySelector('[name=give-scope][value=specific]').checked=true;update(requested);}
})();
