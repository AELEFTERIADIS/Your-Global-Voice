import { verifySyntheticLedger } from './synthetic-ledger-test.mjs';
import { PayPalSandboxError } from './paypal-test-diagnostics.mjs';
import { createTestCheckout, reconcileTestDonation, captureTestPayPal } from './donation-test-service.mjs';
const response=(status,data)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export default { async fetch(request,env) {
 if(env.DONATION_TEST_MODE!=='true' || !env.DONATION_DB || typeof env.DONATION_TEST_ADMIN_TOKEN!=='string' || env.DONATION_TEST_ADMIN_TOKEN.length<32)return response(503,{message:'Test ledger is not configured.'});
 const path=new URL(request.url).pathname;
 if(path==='/return' && request.method==='GET')return response(200,{message:'Test checkout returned. Use authenticated reconciliation; this is not payment confirmation.'});
 if(request.headers.get('Authorization')!=='Bearer '+env.DONATION_TEST_ADMIN_TOKEN)return response(403,{message:'Forbidden.'});
 if(request.method!=='POST' || !['/test/donations','/test/reconcile','/test/paypal/capture','/test/ledger/verify'].includes(path))return response(404,{message:'Not found.'});
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return response(415,{message:'JSON required.'});
 try {
  const reader=request.body?.getReader();if(!reader)return response(400,{message:'Invalid request.'});
  let text='',size=0;const decoder=new TextDecoder();while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2048){await reader.cancel();return response(413,{message:'Request too large.'});}text+=decoder.decode(value,{stream:true});}
  const data=JSON.parse(text+decoder.decode());
  const result=path==='/test/ledger/verify'?await verifySyntheticLedger(env,data):path==='/test/donations'?await createTestCheckout(env,data,new URL('/return',request.url).href):path==='/test/paypal/capture'?await captureTestPayPal(env,data.donationId):await reconcileTestDonation(env,data.donationId);
  return response(200,result);
 } catch(error) {
  if(error instanceof PayPalSandboxError)return response(400,{message:'PayPal Sandbox request failed.',diagnostic:error.diagnostic});
  return response(400,{message:'Test donation request failed validation or provider verification. Inspect test records before retrying.'});
 }
} };

