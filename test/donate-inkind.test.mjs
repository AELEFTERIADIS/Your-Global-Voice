import test from 'node:test';
import assert from 'node:assert/strict';
import contact from '../content/contact.json' with {type:'json'};
import {renderInKindContributions} from '../scripts/donate-inkind.mjs';
test('in-kind modal preserves approved content, one support link and X-only dismissal',()=>{
 const html=renderInKindContributions();
 for(const text of ['Donate Resources','Support our mission by donating goods, supplies, equipment, or other essential resources.','Arrange Your Contribution','Please contact our Donations &amp; Support team to discuss current needs and coordinate your contribution.'])assert.ok(html.includes(text));
 const email=contact.emails.find(e=>e.label==='Donations & Support').address;
 assert.ok(html.includes(`href="mailto:${email}"`));
 assert.equal((html.match(/<a\b/g)||[]).length,1);
 assert.equal((html.match(/<button\b/g)||[]).length,1);
 assert.match(html,/aria-labelledby="inkind-modal-title"/);
 assert.match(html,/aria-label="Close Donate Resources"/);
 assert.doesNotMatch(html,/<br|<img|<form|<iframe|Print Instructions/);
});
