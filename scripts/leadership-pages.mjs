import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export async function writeLeadershipPages({andreasBiography,maximosBiography,robertBiography}){
 const shell=await readFile(new URL('../public/about.html',import.meta.url),'utf8');
 const cssVersion=createHash('sha256').update(await readFile(new URL('../public/leadership-biography.css',import.meta.url))).digest('hex').slice(0,16);
 const profiles=[
  ['andreas-elefteriadis','Andreas Elefteriadis','Founder & President','E7F71712-32D1-43FE-BA18-618193E48BA8.png',1145,1374,andreasBiography],
  ['maximos-weimar','Archimandrite Maximos Weimar','Vice President','C877690E-4E12-4A62-BCE4-47A36456254D.png',1150,1367,maximosBiography],
  ['robert-shillenn','Robert Shillenn','Secretary & Treasurer','Elderly Cleric in Embroidered Hat.png',1151,1367,robertBiography]
 ];
 for(const [slug,name,role,photo,width,height,biography] of profiles){
  const content=`<div class="leadership-biography"><a class="biography-return" href="about.html#desktop-about-team-heading"><span aria-hidden="true">←</span> Return to About Us</a><article class="biography-panel" aria-labelledby="biography-name"><img class="biography-portrait" src="${photo}" width="${width}" height="${height}" alt="${escape(name)}"><div class="biography-copy"><h1 id="biography-name">${escape(name)}</h1><p class="biography-role">${escape(role)}</p>${biography.map(p=>`<p>${escape(p)}</p>`).join('')}</div></article></div>`;
  let html=shell.replace(/<title>[\s\S]*?<\/title>/,`<title>${escape(name)} | Your Global Voice, Inc.</title>`)
   .replace(/<main id="main" tabindex="-1">[\s\S]*?<\/main>/,`<main id="main" tabindex="-1">${content}</main>`)
   .replace(/\s*<link rel="stylesheet" href="(?:about|desktop-about|desktop-about-hero|mission)\.css[^\"]*">/g,'')
   .replace(/\s*<script src="(?:desktop-about|about)\.js[^\"]*" defer><\/script>/g,'')
   .replace('</head>',`  <link rel="stylesheet" href="leadership-biography.css?v=${cssVersion}">\n</head>`);
  await writeFile(new URL(`../public/${slug}.html`,import.meta.url),html);
 }
}
