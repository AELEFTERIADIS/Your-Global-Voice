import test from 'node:test';
import assert from 'node:assert/strict';
import { hasHumanApproval } from '../scripts/visual-review-policy.mjs';
const review=(state,commit_id='current',extra={})=>({state,commit_id,user:{type:'User',login:'owner'},author_association:'OWNER',...extra});
test('visual baseline approval must be human, trusted, and for the current revision',()=>{
 assert.equal(hasHumanApproval([review('APPROVED')],'current'),true);
 assert.equal(hasHumanApproval([review('APPROVED','old')],'current'),false);
 assert.equal(hasHumanApproval([review('APPROVED','current',{user:{type:'Bot',login:'bot'}})],'current'),false);
 assert.equal(hasHumanApproval([review('APPROVED','current',{author_association:'NONE'})],'current'),false);
});
test('dismissal or requested changes revoke an earlier visual approval',()=>{
 assert.equal(hasHumanApproval([review('APPROVED'),review('DISMISSED')],'current'),false);
 assert.equal(hasHumanApproval([review('APPROVED'),review('CHANGES_REQUESTED')],'current'),false);
 assert.equal(hasHumanApproval([review('CHANGES_REQUESTED'),review('APPROVED')],'current'),true);
});
