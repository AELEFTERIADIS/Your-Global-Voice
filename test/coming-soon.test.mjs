import test from 'node:test';
import assert from 'node:assert/strict';
import {createPreviewServer} from '../scripts/server.mjs';

test('shared Coming Soon route serves approved content and permits its local Go Back script', async t => {
 const server=createPreviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base=`http://127.0.0.1:${server.address().port}`;
 for(const path of ['/coming-soon','/coming-soon/','/coming-soon.html?cause=animal-welfare']) {
  const response=await fetch(base+path);assert.equal(response.status,200);
  assert.match(response.headers.get('content-security-policy'),/script-src 'self'/);
  const html=await response.text();assert.match(html,/<h1 id="coming-soon-heading">Coming Soon<\/h1>/);
  assert(html.includes('Something meaningful is taking shape. Stay tuned!'));
  assert.match(html,/href="projects.html#project-initiatives-heading">Go Back<\/a>/);
  assert.match(html,/<script src="coming-soon.js" defer>/);
 }
 for(const asset of ['coming-soon.css','coming-soon.js'])assert.equal((await fetch(base+'/'+asset)).status,200);
});
