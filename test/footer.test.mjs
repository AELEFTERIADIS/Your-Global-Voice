import test from 'node:test';
import assert from 'node:assert/strict';
import {createPreviewServer} from '../scripts/server.mjs';
import {pagesFiles} from '../scripts/prepare-pages.mjs';

test('shared approved footer links resolve on all pages and licensed local fonts can load under CSP', async t => {
 const server=createPreviewServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));const base=`http://127.0.0.1:${server.address().port}`;let expected;
 for(const file of pagesFiles){const response=await fetch(`${base}/${file}`);assert.match(response.headers.get('content-security-policy'),/font-src 'self'/);const html=await response.text();const footer=html.match(/<footer\b[\s\S]*?<\/footer>/)[0];assert.ok(footer.includes('YOUR GLOBAL VOICE'));assert.ok(footer.includes('Where Every Voice Matters'));assert.ok(footer.includes('© 2026 Your Global Voice, Inc. All rights reserved.'));assert.doesNotMatch(footer,/<img|<svg|footer-motto|footer-description|<i\b/);const links=[...footer.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map(([,href,label])=>({href,label}));assert.deepEqual(links.map(x=>x.label),['Home','About Us','Our Mission','Our Causes','Our Projects','Get Involved','Donate','Contact Us']);assert.deepEqual(links.map(x=>x.href),pagesFiles);if(expected)assert.deepEqual(links,expected);expected=links;for(const {href} of links)assert.equal((await fetch(`${base}/${href}`)).status,200);}
 for(const [file,mime,signature] of [['cinzel-regular.woff','font/woff','wOFF'],['garamond-regular.woff2','font/woff2','wOF2']]){const response=await fetch(`${base}/${file}`);assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),mime);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.subarray(0,4).toString(),signature);}
 const license=await(await fetch(`${base}/footer-font-licenses.txt`)).text();assert.match(license,/SIL OPEN FONT LICENSE/);
});
