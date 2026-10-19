import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { compileStyles, stylesheetNames, resolveMedia } from '../scripts/build-styles.mjs';

test('every stylesheet is built from the shared tokens and named breakpoints', async () => {
 const files=await compileStyles();
 const tokens=JSON.parse(await readFile(new URL('../styles/tokens.json',import.meta.url),'utf8'));
 for(const value of Object.values(tokens.properties)) for(const [,name] of value.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(name in tokens.properties,name);
 for (const file of stylesheetNames) {
  assert.equal(await readFile(new URL(`../public/${file}`,import.meta.url),'utf8'),files.get(file),`Run npm run build: ${file} is stale`);
  const source=await readFile(new URL(`../styles/${file}`,import.meta.url),'utf8');
  for(const [,name] of source.matchAll(/@media\s+\(--([a-z0-9-]+)\)/g)) assert.ok(tokens.media[name],name);
  assert.doesNotMatch(source,/@media\s+\((?:min|max)-width:/,`${file} bypasses named breakpoints`);
  for(const [,name] of source.matchAll(/var\((--[a-z0-9-]+)/g)) {
   // Only these JS/content-measured values are component-owned, not global tokens.
   assert.ok(name in tokens.properties || ['--mission-column-gap','--mission-image-width','--about-image-height','--donation-motto-space','--donation-header-offset'].includes(name),name);
  }
 }
 assert.equal(resolveMedia(tokens.media.phone,tokens.properties),`(max-width: ${tokens.properties['--breakpoint-phone']})`);
 assert.equal(resolveMedia(tokens.media.stacked,tokens.properties),`(max-width: ${tokens.properties['--breakpoint-editorial']})`);
 assert.equal(resolveMedia(tokens.media['compact-navigation'],tokens.properties),`(max-width: ${tokens.properties['--breakpoint-navigation']})`);
 assert.equal(resolveMedia(tokens.media['wrapped-header'],tokens.properties),`(max-width: ${tokens.properties['--breakpoint-header']})`);
 assert.equal(resolveMedia(tokens.media['desktop-editorial'],tokens.properties),`(min-width: ${tokens.properties['--breakpoint-editorial-start']})`);
});

test('all eight pages inherit the shared foundation before page-specific styles',async()=>{
 for(const file of ['index','about','mission','purposes','projects','get-involved','donate','contact']) {
  const html=await readFile(new URL(`../public/${file}.html`,import.meta.url),'utf8');
  assert.equal([...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)][0][1],'styles.css');
 }
});
