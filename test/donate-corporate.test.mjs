import test from 'node:test';
import assert from 'node:assert/strict';
import contact from '../content/contact.json' with {type:'json'};
import {renderCorporateDonations} from '../scripts/donate-corporate.mjs';
test('corporate modal has approved wording, one canonical support link and X-only dismissal',()=>{
 const html=renderCorporateDonations();
 for(const text of ['Partner With Us','We welcome businesses, institutions, and organizations that wish to support our mission through financial contributions, donated resources, or collaborative initiatives.','Explore Partnership Opportunities','Please contact our Donations &amp; Support team to discuss partnership opportunities and ways to support our work.'])assert.ok(html.includes(text));
 const email=contact.emails.find(e=>e.label==='Donations & Support').address;
 assert.ok(html.includes(`href="mailto:${email}"`));
 assert.equal((html.match(/<a\b/g)||[]).length,1);
 assert.equal((html.match(/<button\b/g)||[]).length,1);
 assert.match(html,/aria-labelledby="corporate-modal-title"/);
 assert.match(html,/aria-label="Close Partner With Us"/);
 assert.doesNotMatch(html,/<br|<img|<form|<iframe|Print Instructions/);
});
