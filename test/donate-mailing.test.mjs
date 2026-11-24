import test from 'node:test';
import assert from 'node:assert/strict';
import contact from '../content/contact.json' with {type:'json'};
import {renderMailingInstructions} from '../scripts/donate-mailing.mjs';
test('mailing dialog uses canonical organizational details and safe map/email links',()=>{
 const html=renderMailingInstructions();
 for(const line of contact.mailingAddress)assert.ok(html.includes(line));
 const maps='https://www.google.com/maps/search/?api=1&amp;query='+encodeURIComponent(contact.mailingAddress.slice(1).join(', '));
 assert.equal(html.split(`href="${maps}" target="_blank" rel="noopener noreferrer"`).length-1,2);
 assert.ok(html.includes('href="mailto:'+contact.emails.find(e=>e.label==='Donations & Support').address+'"'));
 assert.match(html,/<dialog[^>]+aria-labelledby="mailing-instructions-title"/);
 assert.equal((html.match(/data-mailing-close/g)||[]).length,2);
 assert.match(html,/class="mailing-print"/);
 assert.doesNotMatch(html,/<img|<iframe|<form|disabled|Coming Soon/);
});
