import { test, expect } from '@playwright/test';
const pages = ['index','about','mission','purposes','projects','get-involved','donate','contact'];

async function assertLayout(page) {
 const failures = await page.evaluate(() => {
  const failures = [];
  const visible = e => !!e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
  const rect = e => e.getBoundingClientRect();
  const width = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > width + 1) failures.push('document horizontal overflow');
  for (const e of document.querySelectorAll('main, main section, main article, main .card-grid, main .purpose-grid, main .button, main input, main select, main textarea')) {
   if (!visible(e) || e.closest('[hidden]')) continue;
   const r=rect(e);
   if (r.left < -1 || r.right > width+1) failures.push(`offscreen ${e.tagName}.${e.className}`);
   if (e.matches('.button, input, select, textarea') && e.scrollWidth > e.clientWidth+2) failures.push(`clipped control ${e.id || e.textContent}`);
  }
  for (const img of document.images) {
   if (!visible(img)) continue;
   if (!img.complete || !img.naturalWidth) { failures.push(`missing image ${img.getAttribute('src')}`); continue; }
   const r=rect(img), style=getComputedStyle(img);
   if (style.objectFit==='fill' && Math.abs(r.width/r.height-img.naturalWidth/img.naturalHeight)>.02) failures.push(`distorted image ${img.getAttribute('src')}`);
  }
  // Check actual rendered glyph rectangles, including long headings and labels.
  const walker=document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
  while(walker.nextNode()) {
   const n=walker.currentNode;
   if(!n.textContent.trim() || !visible(n.parentElement) || n.parentElement.closest('[hidden],select,textarea')) continue;
   const range=document.createRange();range.selectNodeContents(n);
   for(const r of range.getClientRects()) if(r.width && (r.left < -1 || r.right > width+1)) failures.push(`clipped text: ${n.textContent.slice(0,60)}`);
  }
  // Shared main/header gutters must match; the compact footer is an approved exception.
  if (Math.abs(rect(document.querySelector('main')).left-rect(document.querySelector('.header-inner')).left)>1) failures.push('inconsistent page gutters');
  return failures;
 });
 expect(failures).toEqual([]);
}

for (const name of pages) test(`${name}: responsive layout and approved visual baseline`, async ({page}, testInfo) => {
 const errors=[];page.on('pageerror', e=>errors.push(e.message));
 // Never contact a real inbox or payment provider. Only status is mocked; POST is blocked.
 await page.route('**/*', route => {
  const url=new URL(route.request().url());
  if(url.origin==='http://127.0.0.1:3107') return route.continue();
  if(url.hostname==='ygv-contact.andyelft.workers.dev' && url.pathname==='/api/contact/status' && route.request().method()==='GET')
   return route.fulfill({json:{available:true,token:'responsive-preview-only'},headers:{'access-control-allow-origin':'http://127.0.0.1:3107'}});
  return route.abort();
 });
 await page.goto(`/${name}.html`);
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode()}));});
 await expect(page.locator('main')).toBeVisible();
 await assertLayout(page);
 await expect(page).toHaveScreenshot(`${name}.png`,{fullPage:true});
 if(name==='about') {
  const button=page.locator('.about-who-toggle');
  await button.focus();await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('#about-who-expanded')).toBeVisible();
  await assertLayout(page);await expect(page).toHaveScreenshot('about-expanded.png',{fullPage:true});
  await button.focus();await page.keyboard.press('Space');await expect(button).toHaveAttribute('aria-expanded','false');
 }
 if(name==='contact') {
  const options=page.locator('select[name="subject"] option');
  await expect(options).toHaveCount(18);
  for(const value of await options.evaluateAll(es=>es.slice(1).map(e=>e.value))) await page.locator('select[name="subject"]').selectOption(value);
  expect(await page.locator('.contact-form').evaluate(e=>e.checkValidity())).toBe(false);
 }
 if(name==='donate') {
  await page.locator('input[name="giving-frequency"][value="monthly"]').check();
  await assertLayout(page);
  await expect(page).toHaveScreenshot('donate-monthly.png',{fullPage:true});
 }
 const menu=page.locator('.mobile-menu');
 if(await menu.isVisible()) {
  await menu.locator('summary').focus();await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('open','');
  await expect(menu.locator('nav')).toBeVisible();
  // Full menu screenshot catches clipped labels at every narrow width.
  await page.locator('.site-header').scrollIntoViewIfNeeded();
  await expect(page.locator('.site-header')).toHaveScreenshot(`${name}-menu.png`);
 }
 expect(errors).toEqual([]);
});
