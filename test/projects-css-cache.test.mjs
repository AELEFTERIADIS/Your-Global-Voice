import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createPreviewServer} from '../scripts/server.mjs';

test('normal and query Projects URLs reference current content-versioned CSS and serve identical designs',async t=>{
 const server=createPreviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base=`http://127.0.0.1:${server.address().port}`;
 const normal=await(await fetch(base+'/projects.html')).text();
 assert.equal(await(await fetch(base+'/projects.html?v=2')).text(),normal);
 for(const asset of ['styles.css','projects.css']) {
  const bytes=await readFile(new URL('../public/'+asset,import.meta.url));
  const hash=createHash('sha256').update(bytes).digest('hex').slice(0,16);
  assert(normal.includes(`href="${asset}?v=${hash}"`));
  const response=await fetch(`${base}/${asset}?v=${hash}`);assert.equal(response.status,200);
  assert.match(response.headers.get('content-type'),/text\/css/);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);
 }
 assert.doesNotMatch(normal,/href="(?:styles|projects)\.css"/);
});
