import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { donationRegistry, resolveDesignation } from '../worker/donation-registry.mjs';

const worker = 'https://ygvoice-donations-test.andyelft.workers.dev';
const database = 'ygvoice-donations-test';
const root = fileURLToPath(new URL('../', import.meta.url));
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export function testCases(runId) {
 if (!uuid.test(runId || '')) throw Error('Supply a run UUID; reuse it to resume the same payments.');
 return ['stripe', 'paypal'].flatMap(provider => donationRegistry.map((entry, index) => {
  const hex = createHash('sha256').update(`ygvoice:provider-verification:${runId.toLowerCase()}:${provider}:${entry.id}`).digest('hex').slice(0,32);
  return { provider, designationId:entry.id, amountCents:100+index,
   requestId:`${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}` };
 }));
}

// Read only, and scoped to this run's UUIDs, including pending rows.
export function ledgerSQL(cases) {
 if (!cases.length || cases.some(c => !uuid.test(c.requestId))) throw Error('Invalid verification request IDs.');
 return `SELECT d.id, d.request_id, d.provider, d.designation_id, d.amount_cents, d.currency, d.status, d.checkout_reference,
  a.kind, a.cause_id,
  (SELECT count(*) FROM donations x WHERE x.request_id=d.request_id) AS donation_count,
  (SELECT count(*) FROM donations x WHERE x.provider=d.provider AND x.checkout_reference=d.checkout_reference) AS reference_count,
  (SELECT count(*) FROM donation_events e WHERE e.donation_id=d.id) AS event_count,
  (SELECT count(*) FROM donation_events e WHERE e.donation_id=d.id AND e.provider=d.provider
   AND e.event_type='reconciled.completed' AND e.provider_event_id='reconcile:' || d.checkout_reference || ':completed') AS completion_count
  FROM donations d JOIN donation_designations a ON a.id=d.designation_id
  WHERE d.request_id IN (${cases.map(c=>`'${c.requestId}'`).join(',')});`;
}

export function verifyLedgerRows(rows, cases, checkouts) {
 if (rows.length !== cases.length) throw Error('Missing or duplicate test donations in remote D1.');
 return cases.map(input => {
  const row = rows.find(r=>r.request_id===input.requestId);
  const checkout = checkouts.get(input.requestId);
  const attribution = resolveDesignation(input.designationId);
  if (!row || !checkout || row.id!==checkout.donationId || row.checkout_reference!==checkout.checkoutReference ||
   row.provider!==input.provider || row.designation_id!==input.designationId || row.amount_cents!==input.amountCents ||
   row.currency!=='USD' || row.status!=='completed' || row.kind!==attribution.kind ||
   (row.cause_id || null)!==(attribution.kind==='project'?attribution.causeId:null) ||
   row.donation_count!==1 || row.reference_count!==1 || row.event_count!==1 || row.completion_count!==1 ||
   (input.provider==='stripe' ? !/^cs_test_/.test(row.checkout_reference) : !/^[A-Z0-9]{10,32}$/.test(row.checkout_reference))) {
   throw Error(`Remote D1 verification failed: ${input.provider}/${input.designationId}.`);
  }
  return {donationId:row.id,provider:row.provider,checkoutReference:row.checkout_reference,
   amountCents:row.amount_cents,currency:row.currency,status:row.status,attribution,
   donationCount:row.donation_count,eventCount:row.event_count};
 });
}

function queryD1(sql) {
 const output = execFileSync('wrangler', ['d1','execute',database,
  '--config','worker/wrangler.ledger-test.toml','--remote','--json','--command',sql],
  {cwd:root,encoding:'utf8',stdio:['ignore','pipe','inherit'],maxBuffer:4*1024*1024});
 const batches = JSON.parse(output);
 if (!Array.isArray(batches) || batches.some(b=>b.success!==true)) throw Error('Remote D1 read failed.');
 return batches.flatMap(b=>b.results || []);
}

async function main() {
 const cases = testCases(process.argv[2]);
 const token = (await readFile(resolve(homedir(),'.ygvoice-donation-test-token'),'utf8')).trim();
 if (token.length<32 || /[\r\n]/.test(token)) throw Error('The existing token file must contain one raw admin token.');
 // Fail before creating checkouts if the existing local Wrangler/D1 access is unavailable.
 queryD1(ledgerSQL(cases));
 const post = async(path,body,expected=200)=>{
  const response = await fetch(worker+path,{method:'POST',redirect:'error',
   headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify(body),signal:AbortSignal.timeout(40000)});
  if (response.status!==expected) throw Error(`${path}: HTTP ${response.status}, expected ${expected}. Check the existing test configuration/token; do not rotate secrets.`);
  return response.json();
 };
 const checkouts = new Map();
 const terminal = createInterface({input:process.stdin,output:process.stdout});
 try {
  console.log(`Test Worker: ${worker}\nD1: ${database}\nRun: ${process.argv[2]} (reuse this UUID to resume)`);
  for (const input of cases) {
   const checkout = await post('/test/donations',input);
   if (!uuid.test(checkout.donationId || '') || (input.provider==='stripe'
    ? !/^cs_test_/.test(checkout.checkoutReference || '')
    : !/^[A-Z0-9]{10,32}$/.test(checkout.checkoutReference || ''))) throw Error('Unexpected test checkout reference.');
   checkouts.set(input.requestId,checkout);
   const retry = await post('/test/donations',input);
   if (retry.donationId!==checkout.donationId || retry.checkoutReference!==checkout.checkoutReference) throw Error('Duplicate checkout created.');
   await post('/test/donations',{...input,designationId:input.designationId==='animal-welfare'?'voices-for-dignity':'animal-welfare'},400);
   let result = await post('/test/reconcile',{donationId:checkout.donationId});
   if (result.status!=='completed') {
    if (result.status!=='pending') throw Error('Unexpected payment state.');
    console.log(`\n${input.provider}: ${input.designationId}, USD ${(input.amountCents/100).toFixed(2)}`);
    if (checkout.approvalURL) {
     const url = new URL(checkout.approvalURL);
     if (url.username || url.password || (input.provider==='stripe'
      ? url.origin!=='https://checkout.stripe.com'
      : url.origin!=='https://www.sandbox.paypal.com' || !['/checkoutnow','/checkoutnow/'].includes(url.pathname))) throw Error('Unexpected checkout destination.');
     console.log(`Open: ${url.href}`);
    } else console.log(`Resume the previously returned approval URL for ${checkout.checkoutReference}.`);
    console.log(input.provider==='stripe'
     ? 'Use Stripe test card 4242 4242 4242 4242, a future expiry and any valid test CVC. Never use a real card.'
     : 'Approve using a PayPal Sandbox buyer different from the Sandbox merchant.');
    if ((await terminal.question('After test approval, type approved (anything else stops): ')).trim()!=='approved') throw Error('Stopped; resume using the same run UUID.');
    result = await post(input.provider==='paypal'?'/test/paypal/capture':'/test/reconcile',{donationId:checkout.donationId});
   }
   if (result.status!=='completed') throw Error('Payment not completed; no success is claimed.');
   if (input.provider==='paypal') {
    // An already captured order must not be charged again.
    const captureRetry = await post('/test/paypal/capture',{donationId:checkout.donationId});
    if(captureRetry.status!=='completed')throw Error('Repeated capture failed.');
   }
   for (let i=0;i<2;i++) {
    const reconciled = await post('/test/reconcile',{donationId:checkout.donationId});
    if(reconciled.status!=='completed')throw Error('Repeated reconciliation failed.');
   }
  }
  const records = verifyLedgerRows(queryD1(ledgerSQL(cases)),cases,checkouts);
  console.log(JSON.stringify({runId:process.argv[2],testMode:true,providerVerified:true,
   remoteD1Verified:true,records},null,2));
 } finally { terminal.close(); }
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 main().catch(error=>{console.error(error.message);process.exitCode=1;});
}
