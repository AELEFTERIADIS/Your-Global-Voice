// Honor only established cause IDs; query text is never inserted as HTML.
const causeField=document.querySelector('#donation-cause-field');
const causeSelect=document.querySelector('#donation-cause');
const requestedCause=new URLSearchParams(location.search).get('cause');
if(causeField&&causeSelect&&[...causeSelect.options].some(option=>option.value===requestedCause)){
 document.querySelector('#donation-payment').insertBefore(causeField,document.querySelector('.donation-selector'));
 causeSelect.value=requestedCause;
 causeField.hidden=false;
}
