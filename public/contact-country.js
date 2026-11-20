(()=>{
// Include the optional country in the inquiry delivered by the existing endpoint.
const country=document.getElementById('contact-country');
const message=document.getElementById('contact-message');
const form=country?.closest('form');
if(form&&message){
 const prefix=()=>country.value.trim()?`Country: ${country.value.trim()}\n\n`:'';
 const update=()=>{message.maxLength=5000-prefix().length;message.setCustomValidity(message.value.length>message.maxLength?'Please shorten your message to include your selected country within the 5,000-character limit.':'');};
 country.addEventListener('input',update);message.addEventListener('input',update);
 form.addEventListener('formdata',e=>{e.formData.set('message',prefix()+message.value);});
 form.addEventListener('reset',()=>setTimeout(update,0));
}

})();
