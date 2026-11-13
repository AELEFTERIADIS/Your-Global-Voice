import {readFileSync} from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const reference='Compassion Beyond Borders_ Humanitarian Relief.png';
const icon=paths=>`<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const giving=icon('<path d="M34 27 20 15C6 1 20-7 32 7 44-7 59 1 45 15Z" transform="translate(0 10)"/><path d="M5 54 18 45h19c8 0 8 8 0 8H25M5 54v8l16-6h20l17-13c6-5 0-11-5-7l-14 9" stroke="#D99800"/>');
const essential=icon('<path d="M5 35h54l-6 23H12ZM8 31c-3-13 12-20 20-9M23 30c0-14 17-17 22-6M44 31V14h13v17M48 14V6h6v8M14 24l5 5M29 18l5 7"/>');
const emergency=icon('<path d="M5 28h33v25H5ZM38 34h13l9 10v9H38M42 38h7l5 7H42M15 24v-9h8v9M11 19h16M9 32h11v12H9M10 38h10M15 32v12"/><circle cx="16" cy="55" r="5"/><circle cx="48" cy="55" r="5"/><path d="M28 9V3M37 12l4-5M18 10l-4-5"/>');
const community=icon('<circle cx="32" cy="14" r="8"/><circle cx="13" cy="20" r="6"/><circle cx="51" cy="20" r="6"/><path d="M18 53v-9a14 14 0 0 1 28 0v9M4 48v-8a10 10 0 0 1 10-10M60 48v-8a10 10 0 0 0-10-10M32 53 23 44c-6-7 3-13 9-6 6-7 15-1 9 6Z"/>');
const sprout=icon('<path d="M32 58V34M32 41C9 41 5 21 5 12c17 0 27 9 27 23M33 35C33 13 46 4 60 4c0 16-8 29-27 31M19 23l13 18M47 18 33 35M17 59h31"/>');
const arrow='<span aria-hidden="true">→</span>';
// Decorative contours traced from the approved reference; no page text or photos in these masks.
const art=name=>readFileSync(new URL('../public/humanitarian-wave-'+name+'.svg',import.meta.url),'utf8');
const wave=(cls)=>art(cls.includes('hero')?'hero':cls.includes('commitment')?'middle':'footer-transition').replace('<svg ',`<svg class="relief-wave ${cls}" `);

const hero=`<section class="relief-hero" aria-labelledby="relief-title"><svg class="relief-hero-photo" viewBox="0 0 1199 320" preserveAspectRatio="none" role="img" aria-label="Humanitarian volunteers sharing relief supplies with a family"><defs><clipPath id="relief-hero-crop"><path d="M620 7C560 60 551 114 566 154S602 215 557 288H1190V7Z"/></clipPath><linearGradient id="relief-gold"><stop stop-color="#E8A000"/><stop offset=".5" stop-color="#FFE985"/><stop offset="1" stop-color="#E8A000"/></linearGradient></defs><image href="${reference}" width="1199" height="1312" clip-path="url(#relief-hero-crop)"/></svg><div class="relief-hero-copy"><div class="relief-title-row">${giving}<h1 id="relief-title">Humanitarian<br>Assistance &amp; Relief</h1></div><p class="relief-slogan">When hardship strikes,<br>compassion brings us together.</p><svg class="relief-accent" viewBox="0 0 400 22" preserveAspectRatio="none" aria-hidden="true"><path d="M0 20Q100-8 190 8T400 7Q275 5 190 13T0 20Z" fill="#D89500"/></svg><a class="relief-action relief-support" href="donate.html?cause=humanitarian-assistance#donation-payment">Support This Cause ${arrow}</a></div>${wave('relief-hero-wave')}</section>`;
const fullStatement='Our humanitarian efforts focus on helping individuals and communities facing hardship, poverty, and emergencies. We aim to provide essential assistance, including food, clothing, shelter, and other basic necessities. We also seek to support those affected by natural disasters and displacement, helping them recover and regain stability. Through compassion and practical action, we hope to ease suffering, inspire hope, and help communities build a stronger future.';
const commitment=`<section class="relief-commitment" aria-labelledby="relief-commitment-title"><div class="relief-commitment-copy"><h2 id="relief-commitment-title">Our Humanitarian Commitment</h2><p>Humanitarian assistance begins with recognizing the dignity of every individual. When hardship, disaster, or crisis threatens lives and livelihoods, our mission is to extend compassion, encourage solidarity, and help communities find a path toward stability and renewed hope.</p><details class="relief-more"><summary><span class="relief-read-more">Read More ${arrow}</span><span class="relief-read-less">Read Less <span aria-hidden="true">↑</span></span></summary><div class="relief-expanded"><p>${fullStatement}</p></div></details></div><div class="relief-commitment-image"><svg viewBox="674 353 482 185" role="img" aria-label="Volunteers rebuilding a home in a community recovery effort"><image href="${reference}" width="1199" height="1312"/></svg></div></section>${wave('relief-commitment-wave',1)}`;
const focusCards=[
 [essential,'Essential<br>Assistance','Provide food, clean water, clothing, and other basic necessities to individuals and families in need.'],
 [emergency,'Emergency<br>Relief','Respond to urgent needs during crises, natural disasters, and other humanitarian emergencies.'],
 [community,'Community<br>Recovery','Support the restoration of essential services, homes, and livelihoods in affected communities.'],
 [sprout,'Lasting<br>Resilience','Help communities build stronger, safer, and more self-sustaining futures.']
];
const focus=`<section class="relief-focus" aria-labelledby="relief-focus-title"><h2 id="relief-focus-title">Our Focus</h2><div class="relief-focus-grid">${focusCards.map(([svg,title,text],index)=>`<article class="relief-focus-card">${svg}<h3>${title}</h3><span class="relief-card-rule" aria-hidden="true"></span><p>${text}</p>${art('card-'+(index+1)).replace('<svg ','<svg class="relief-card-wave" ')}</article>`).join('')}</div></section>`;
const closing=`<section class="relief-closing" aria-labelledby="relief-closing-title"><svg class="relief-closing-photo" viewBox="0 0 560 220" role="img" aria-label="A relief volunteer offering essential supplies to a child"><defs><clipPath id="relief-closing-crop"><path d="M0 0H560C501 42 500 74 519 110S548 177 520 220H0Z"/></clipPath></defs><image href="5008A87A-3C8C-4B00-A61F-FECAB730B2A7.PNG" width="560" height="315" y="0" preserveAspectRatio="xMidYMid meet" clip-path="url(#relief-closing-crop)"/>${art('closing').replace('<svg ','<svg x="0" y="0" width="560" height="220" ')}</svg><div class="relief-closing-copy"><h2 id="relief-closing-title">Compassion That Reaches<br>Beyond Borders</h2><p>Stand with us in bringing relief, dignity, and renewed hope to individuals and communities facing hardship.</p><div class="relief-closing-actions"><a class="relief-action relief-involve" href="get-involved.html">Get Involved ${arrow}</a><a class="relief-action relief-support" href="donate.html?cause=humanitarian-assistance#donation-payment">Support This Cause ${arrow}</a></div></div></section><p class="relief-return"><a href="causes.html">← Back to Our Causes</a></p>${wave('relief-footer-wave',1)}`;

export async function writeHumanitarianPage(){
 const source=await readFile(new URL('../public/purposes.html',import.meta.url),'utf8');
 const version=createHash('sha256').update(await readFile(new URL('../public/humanitarian.css',import.meta.url))).digest('hex').slice(0,16);
 const content=`<article class="relief-page">${hero}${commitment}${focus}${closing}</article>`;
 const html=source.replace(/<title>[\s\S]*?<\/title>/,'<title>Humanitarian Assistance &amp; Relief | Your Global Voice, Inc.</title>')
 .replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="When hardship strikes, compassion brings us together. Explore our commitment to humanitarian assistance and relief.">')
 .replace(/<link rel="stylesheet" href="desktop-causes.css[^\"]*">/,`<link rel="stylesheet" href="humanitarian.css?v=${version}">`)
 .replace('class="causes-page-shell"','class="humanitarian-page-shell"')
 .replace(/<main id="main" tabindex="-1">[\s\S]*?<\/main>/,`<main id="main" tabindex="-1">${content}</main>`);
 await writeFile(new URL('../public/humanitarian.html',import.meta.url),html);
}
