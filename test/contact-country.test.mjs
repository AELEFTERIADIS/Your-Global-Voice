import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

test('Country controller coexists with submission controller and includes country without exceeding message limit',async()=>{
 const events=new Map();const countryEvents=new Map();const submit={disabled:true};const status={textContent:''};
 const form={querySelector:()=>submit,addEventListener:(name,fn)=>events.set(name,fn),hasAttribute:()=>false};
 const country={value:'Greece',closest:()=>form,addEventListener:(name,fn)=>countryEvents.set(name,fn)};
 const message={value:'A detailed inquiry for verification.',maxLength:5000,addEventListener:()=>{},setCustomValidity(value){this.error=value;}};
 const context={document:{getElementById:id=>id==='contact-country'?country:id==='contact-message'?message:null,querySelector:selector=>selector==='.contact-form'?form:selector==='#contact-status'?status:selector==='#contact-result'?{}:null},location:{hostname:'ygvoice.org',protocol:'https:'},AbortSignal,setTimeout,fetch:async()=>({ok:true,status:200,json:async()=>({available:true,token:'synthetic-token'})})};
 runInNewContext(await readFile(new URL('../public/contact-country.js',import.meta.url),'utf8'),context);
 runInNewContext(await readFile(new URL('../public/contact.js',import.meta.url),'utf8'),context);
 await new Promise(resolve=>setImmediate(resolve));assert.equal(submit.disabled,false);assert(events.has('submit'));
 countryEvents.get('input')();const fields=new Map();events.get('formdata')({formData:fields});
 assert.equal(fields.get('message'),'Country: Greece\n\n'+message.value);assert.equal(message.maxLength,5000-'Country: Greece\n\n'.length);
 message.value='a'.repeat(5000);countryEvents.get('input')();assert(message.error);country.value='';countryEvents.get('input')();assert.equal(message.error,'');assert.equal(message.maxLength,5000);
});
