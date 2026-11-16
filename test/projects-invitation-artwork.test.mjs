import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderProjectsInvitationBackground} from '../scripts/projects-invitation-artwork.mjs';

test('invitation backgrounds render clean decorative assets without screenshot UI or masking layers',async()=>{
 for(const kind of ['giving','message']){
  const html=renderProjectsInvitationBackground(kind);
  assert.match(html,/^<img\b/);
  assert.doesNotMatch(html,/zzzz|<svg|<mask|clipPath|filter=|<button|<a\b/);
  const file=html.match(/src="([^"]+)"/)[1];
  const bytes=await readFile(new URL('../public/'+file,import.meta.url));
  assert.equal(bytes.subarray(1,4).toString(),'PNG');
  assert.equal(bytes.readUInt32BE(16),744);
  assert.equal(bytes.readUInt32BE(20),410);
 }
});
