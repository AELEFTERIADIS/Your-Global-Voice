const stages=new Set(['paypal_oauth','paypal_order_create','paypal_order_read','paypal_capture']);
const reasons=new Set(['provider_http_error','transport_error','invalid_response']);
const names=new Set(['invalid_client','invalid_request','invalid_grant','invalid_scope','unsupported_grant_type','unauthorized_client','INVALID_REQUEST','AUTHENTICATION_FAILURE','NOT_AUTHORIZED','PERMISSION_DENIED','RESOURCE_NOT_FOUND','UNPROCESSABLE_ENTITY','INTERNAL_SERVER_ERROR','SERVICE_UNAVAILABLE','TOO_MANY_REQUESTS','RATE_LIMIT_REACHED']);
const issues=new Set(['INVALID_PARAMETER_VALUE','MISSING_REQUIRED_PARAMETER','INVALID_RESOURCE_ID','INVALID_CURRENCY_CODE','CURRENCY_NOT_SUPPORTED','AMOUNT_MISMATCH','AMOUNT_NOT_SUPPORTED','PAYEE_ACCOUNT_INVALID','PAYEE_ACCOUNT_RESTRICTED','PAYEE_NOT_ENABLED_FOR_CARD_PROCESSING','PAYEE_NOT_ENABLED_FOR_PAYPAL_PROCESSING','RECEIVING_LIMIT_EXCEEDED','DOMESTIC_TRANSACTION_REQUIRED','TRANSACTION_REFUSED','PAYER_ACTION_REQUIRED','DUPLICATE_INVOICE_ID','REQUEST_ALREADY_PROCESSED','PAYMENT_SOURCE_INFO_CANNOT_BE_VERIFIED','UNSUPPORTED_INTENT']);

// Never forward provider messages, descriptions, headers, links or raw bodies.
// Unknown identifiers are omitted rather than accepting arbitrary provider text.
export function safePayPalDiagnostic(value, sensitive=[]) {
 if(!value || !stages.has(value.stage) || !reasons.has(value.reason) || !(value.status===null || Number.isInteger(value.status) && value.status>=100 && value.status<=599))return undefined;
 const safe=text=>typeof text==='string' && !sensitive.some(secret=>typeof secret==='string' && secret.length>0 && text.includes(secret));
 const result={provider:'paypal_sandbox',stage:value.stage,status:value.status,reason:value.reason};
 if(names.has(value.errorName) && safe(value.errorName))result.errorName=value.errorName;
 if(typeof value.debugId==='string' && /^[a-f0-9]{13}$/i.test(value.debugId) && safe(value.debugId))result.debugId=value.debugId;
 if(Array.isArray(value.issues)) {
  const allowed=[...new Set(value.issues.filter(issue=>issues.has(issue) && safe(issue)))].slice(0,8);
  if(allowed.length)result.issues=allowed;
 }
 return result;
}

export class PayPalSandboxError extends Error {
 constructor(diagnostic,sensitive=[]) {
  super('PayPal Sandbox request failed.');
  this.name='PayPalSandboxError';
  this.diagnostic=Object.freeze(safePayPalDiagnostic(diagnostic,sensitive));
 }
}

async function errorIdentifiers(response) {
 const reader=response.body?.getReader();
 if(!reader)return {};
 try {
  let size=0,text='';const decoder=new TextDecoder();
  while(true) {
   const {done,value}=await reader.read();if(done)break;
   size+=value.length;
   if(size>8192){await reader.cancel();return {};}
   text+=decoder.decode(value,{stream:true});
  }
  const data=JSON.parse(text+decoder.decode());
  return {errorName:data?.name || data?.error,debugId:data?.debug_id,issues:Array.isArray(data?.details)?data.details.map(detail=>detail?.issue):[]};
 } catch {return {};}
 finally {reader.releaseLock();}
}

export async function paypalSandboxJSON(stage,url,options,send,sensitive=[]) {
 let response;
 try {response=await send(url,options);}
 catch {throw new PayPalSandboxError({stage,status:null,reason:'transport_error'},sensitive);}
 if(!response.ok)throw new PayPalSandboxError({stage,status:response.status,reason:'provider_http_error',...await errorIdentifiers(response)},sensitive);
 try {return await response.json();}
 catch {throw new PayPalSandboxError({stage,status:response.status,reason:'invalid_response'},sensitive);}
}
