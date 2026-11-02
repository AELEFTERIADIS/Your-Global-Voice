import test from 'node:test';
import assert from 'node:assert/strict';
import {paypalSandboxJSON,safePayPalDiagnostic} from '../worker/paypal-test-diagnostics.mjs';
import {formatTestFailure} from '../scripts/verify-donation-payments.mjs';

test('only allowlisted identifiers appear in diagnostics and runner output',async()=>{
 const payload={name:'SECRET_CLIENT_ID',debug_id:'Bearer access-token',message:'SECRET',details:[{issue:'SECRET_TOKEN'}]};
 let error;
 try {await paypalSandboxJSON('paypal_order_create','https://api-m.sandbox.paypal.com/v2/checkout/orders',{},async()=>Response.json(payload,{status:422}));}catch(e){error=e;}
 assert.deepEqual(error.diagnostic,{provider:'paypal_sandbox',stage:'paypal_order_create',status:422,reason:'provider_http_error'});
 assert(!JSON.stringify(error).includes('SECRET'));
 const diagnostic={provider:'paypal_sandbox',stage:'paypal_oauth',status:401,reason:'provider_http_error',errorName:'invalid_client',debugId:'a1b2c3d4e5f67',issues:['MISSING_REQUIRED_PARAMETER'],message:'SECRET',access_token:'SECRET'};
 const output=formatTestFailure('/test/donations',400,200,{diagnostic,message:'SECRET'});
 assert(output.includes('paypal_oauth'));assert(output.includes('401'));assert(output.includes('invalid_client'));assert(!output.includes('SECRET'));
 assert.equal(safePayPalDiagnostic({...diagnostic,stage:'SECRET'}),undefined);
 assert.equal(safePayPalDiagnostic({...diagnostic,status:'SECRET'}),undefined);
 // Even a credential/token that happens to match an identifier is suppressed.
 const filtered=safePayPalDiagnostic(diagnostic,['invalid_client','a1b2c3d4e5f67','MISSING_REQUIRED_PARAMETER']);
 assert.equal(filtered.errorName,undefined);assert.equal(filtered.debugId,undefined);assert.equal(filtered.issues,undefined);
});

test('malformed and oversized provider errors retain only stage and HTTP status',async()=>{
 for(const body of ['not JSON','x'.repeat(9000),'null']) {
  await assert.rejects(paypalSandboxJSON('paypal_order_create','https://api-m.sandbox.paypal.com/v2/checkout/orders',{},async()=>new Response(body,{status:502})),error=>{
   assert.deepEqual(error.diagnostic,{provider:'paypal_sandbox',stage:'paypal_order_create',status:502,reason:'provider_http_error'});return true;
  });
 }
});

test('network errors and invalid successful JSON do not leak raw error text',async()=>{
 await assert.rejects(paypalSandboxJSON('paypal_oauth','https://api-m.sandbox.paypal.com/v1/oauth2/token',{},async()=>{throw Error('Authorization: Basic SECRET');}),error=>{
  assert.deepEqual(error.diagnostic,{provider:'paypal_sandbox',stage:'paypal_oauth',status:null,reason:'transport_error'});assert(!error.stack.includes('SECRET'));return true;
 });
 await assert.rejects(paypalSandboxJSON('paypal_order_read','https://api-m.sandbox.paypal.com/v2/checkout/orders/TEST',{},async()=>new Response('SECRET',{status:200})),error=>{
  assert.deepEqual(error.diagnostic,{provider:'paypal_sandbox',stage:'paypal_order_read',status:200,reason:'invalid_response'});return true;
 });
});
