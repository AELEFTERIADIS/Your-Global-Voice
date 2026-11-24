import test from 'node:test';
import assert from 'node:assert/strict';
import contact from '../content/contact.json' with {type:'json'};
import {renderBankTransferDetails} from '../scripts/donate-bank.mjs';
test('bank transfer dialog has one support email, canonical organization and X-only dismissal',()=>{
 const html=renderBankTransferDetails();
 const email=contact.emails.find(e=>e.label==='Donations & Support').address;
 assert.ok(html.includes(contact.mailingAddress[0]));
 assert.equal((html.match(/<a\b/g)||[]).length,1);
 assert.ok(html.includes(`href="mailto:${email}"`));
 assert.equal((html.match(/<button\b/g)||[]).length,1);
 assert.match(html,/aria-label="Close Bank Transfer Details"/);
 assert.match(html,/aria-labelledby="bank-transfer-title"/);
 assert.match(html,/For domestic or international bank transfers, please/);
 assert.doesNotMatch(html,/Print Instructions|<img|<form|<iframe/);
});
