import test from 'node:test';import assert from 'node:assert/strict';
import {renderDonateReference} from '../scripts/donate-reference.mjs';
test('reference donation page retains hosted checkout safeguards and real designation options',()=>{
 const html=renderDonateReference();
 assert.equal((html.match(/id="donation-payment"/g)||[]).length,1);
 assert.equal((html.match(/id="giving-hope"/g)||[]).length,1);
 assert.match(html,/id="give-payment-options"/);assert.doesNotMatch(html,/id="give-payment-options" hidden/);
 assert.ok(html.includes('https://buy.stripe.com/fZu9ANdgj8484zp1lX3Je00'));
 for(const amount of [10,25,50,100,250,500])assert.ok(html.includes(`name="giving-amount" value="${amount}"`));
 assert.match(html,/Enter Amount \(USD\)/);assert.match(html,/name="giving-method" value="paypal"/);assert.doesNotMatch(html,/receipt by email|Your information is protected|visa-logo|mastercard-logo/);
 assert.match(html,/Your choices here are not carried over/);
 assert.match(html,/Hosted checkout does not receive your cause or project selection/);
 for(const id of ['human-rights-dignity','humanitarian-assistance','animal-welfare','environmental-conservation'])assert.ok(html.includes(`value="${id}"`));
 assert.doesNotMatch(html,/<form\b|<iframe\b/);
 for(const label of ['Give Hope','Your Generosity, Their Hope','Other Ways to Give','Your Generosity'])assert.ok(html.includes(label));
});
