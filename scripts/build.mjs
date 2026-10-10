import { readFile, writeFile } from 'node:fs/promises';

const purposes = JSON.parse(await readFile(new URL('../content/purposes.json', import.meta.url), 'utf8'));
const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const purposeList = () => `<ol class="purpose-grid">${purposes.map((purpose, i) => `<li><span class="purpose-number" aria-hidden="true">0${i + 1}</span><h3>${escape(purpose.title)}</h3><p>${escape(purpose.text)}</p></li>`).join('')}</ol>`;
const motto = 'MY VOICE + YOUR VOICE = OUR VOICE';
const pages = [
  ['/', 'Home', 'index.html'],
  ['/about', 'About Us', 'about.html'],
  ['/mission', 'Our Mission', 'mission.html'],
  ['/purposes', 'Our Four Purposes', 'purposes.html'],
  ['/projects', 'Our Projects', 'projects.html'],
  ['/get-involved', 'Get Involved', 'get-involved.html'],
  ['/donate', 'Donate', 'donate.html'],
  ['/contact', 'Contact Us', 'contact.html'],
];
const intro = (title, description) => `<section class="page-intro"><p class="eyebrow">Your Global Voice, Inc.</p><h1>${title}</h1><p class="lead">${description}</p></section>`;
const purposeSection = () => `<section class="purpose-section" aria-labelledby="purposes-heading"><div class="section-heading"><p class="eyebrow">Our foundation</p><h2 id="purposes-heading">Our Four Purposes</h2><p>The official organizational purposes from our Certificate of Incorporation.</p></div>${purposeList()}</section>`;
const bodies = {
  '/': `<section class="hero"><p class="eyebrow">Your Global Voice, Inc.</p><h1>Your<br>Global Voice<span class="legal-name">, Inc.</span></h1><p class="motto">${motto}</p><a class="button" href="/purposes">Explore Our Four Purposes <span aria-hidden="true">&rarr;</span></a></section>${purposeSection()}`,
  '/about': `${intro('About Us', 'Your Global Voice, Inc. is an international nonprofit organization.')}<section class="content-panel"><h2>Our motto</h2><p class="motto">${motto}</p><p>Our four official organizational purposes are set out in our Certificate of Incorporation.</p><a class="text-link" href="/purposes">Read Our Four Purposes &rarr;</a></section>`,
  '/mission': `${intro('Our Mission', motto)}${purposeSection()}`,
  '/purposes': `${intro('Our Four Purposes', 'The following purposes preserve the wording provided from our Certificate of Incorporation.')}${purposeSection()}`,
  '/projects': `${intro('Our Projects', 'Project information will be added after organizational approval.')}<section class="content-panel"><h2>Future updates</h2><p>No projects are listed at this stage.</p><a class="text-link" href="/purposes">Read Our Four Purposes &rarr;</a></section>`,
  '/get-involved': `${intro('Get Involved', motto)}<section class="content-panel"><h2>Ways to participate</h2><p>Opportunities to get involved will be shared once approved. Registration and contribution collection are not available yet.</p><a class="text-link" href="/donate">View future support options &rarr;</a></section>`,
  '/donate': `${intro('Donate', 'Future ways to support Your Global Voice, Inc.')}<section class="notice" aria-labelledby="donations-status"><h2 id="donations-status">Donations are not yet available</h2><p>Payment processing has not been activated. Verified donation instructions will be provided after configuration, testing, and approval.</p></section><section class="content-panel"><h2>Planned support options</h2><p>This page is prepared to accommodate the following options in a future stage:</p><ul class="support-list"><li>Online financial donations</li><li>Credit and debit card donations</li><li>PayPal</li><li>Zelle</li><li>Bank transfers</li><li>Checks</li><li>In-kind contributions, including food, clothing, essential supplies, and other appropriate goods</li></ul><p>No payments or goods are being collected through this website.</p></section>`,
  '/contact': `${intro('Contact Us', 'Contact details will be added after verification and organizational approval.')}<section class="content-panel"><h2>Contact information</h2><p>A contact form is not available at this stage.</p></section>`,
};
for (const [path, title, file] of pages) {
  const navigation = pages.map(([url, label]) => `<a href="${url}"${url === path ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${path === '/' ? 'Your Global Voice, Inc.' : `${title} | Your Global Voice, Inc.`}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  <header class="site-header"><div class="header-inner">
    <div class="header-brand"><img class="header-logo" src="603250A8-B1C4-4533-848C-4028A6E0AD49.png" alt="Your Global Voice official logo" width="1254" height="1254"><a class="wordmark" href="/">Your Global Voice<span>Inc.</span></a></div>
    <nav aria-label="Main navigation">${navigation}</nav>
  </div></header>
  <main id="main" tabindex="-1">${bodies[path]}</main>
  <footer class="site-footer"><div class="footer-inner"><div><p class="footer-name">Your Global Voice, Inc.</p><p class="footer-motto">${motto}</p></div><nav aria-label="Footer navigation">${navigation}</nav></div></footer>
</body>
</html>
`;
  await writeFile(new URL(`../public/${file}`, import.meta.url), html);
}
console.log('Built all 8 pages from shared layout and official purposes.');
