import { readFile, writeFile } from 'node:fs/promises';
import { renderContact } from './contact.mjs';
import { renderDonate } from './donate.mjs';
const mission = JSON.parse(await readFile(new URL('../content/mission.json', import.meta.url), 'utf8'));
const contact = JSON.parse(await readFile(new URL('../content/contact.json', import.meta.url), 'utf8'));

const purposes = JSON.parse(await readFile(new URL('../content/purposes.json', import.meta.url), 'utf8'));
const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const purposeAnchors = ['persecution-discrimination', 'humanitarian-assistance', 'animal-welfare', 'environmental-protection'];
const purposeList = (withAnchors = false) => `<ol class="purpose-grid">${purposes.map((purpose, i) => `<li${withAnchors ? ` id="${purposeAnchors[i]}"` : ''}><span class="purpose-number" aria-hidden="true">0${i + 1}</span><h3>${escape(purpose.title)}</h3><p>${escape(purpose.text)}</p></li>`).join('')}</ol>`;
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
const purposeSection = (withAnchors = false) => `<section class="purpose-section" aria-labelledby="purposes-heading"><div class="section-heading"><p class="eyebrow">Our foundation</p><h2 id="purposes-heading">Our Four Purposes</h2><p>The official organizational purposes from our Certificate of Incorporation.</p></div>${purposeList(withAnchors)}</section>`;
const card = (label, title, text, link = '') => `<article class="card"><p class="eyebrow">${label}</p><h2>${title}</h2><p>${text}</p>${link}</article>`;
const link = (url, text) => `<a class="text-link" href="${url}">${text} &rarr;</a>`;
const callout = (title, text, url, label) => `<section class="callout"><div><h2>${title}</h2><p>${text}</p></div><a class="button" href="${url}">${label} &rarr;</a></section>`;
const focusCards = () => `<div class="card-grid">${card('01 / Human dignity', 'Against persecution and discrimination', 'Our purposes include assistance, support, and advocacy for people facing persecution or discrimination based on religion, race, ethnicity, nationality, or national origin.')}${card('02 / Humanitarian relief', 'Help for essential needs', 'Food, clothing, housing assistance, essential supplies, and emergency assistance are at the heart of our humanitarian purpose.')}${card('03 / Animal welfare', 'Care for animals', 'Our animal welfare purpose centers on charitable financial assistance and support for the care and well-being of animals.')}${card('04 / The environment', 'Protect our shared world', 'Our environmental purpose encompasses forests, tree planting, natural resources, conservation, and sustainability.')}</div>`;
const bodies = {
  '/': `<section class="hero"><div><p class="eyebrow">Dignity. Compassion. A shared future.</p><h1>Your<br>Global Voice<span class="legal-name">, Inc.</span></h1><p class="motto">${motto}</p><p class="lead">An international nonprofit organization with four connected purposes: standing against persecution and discrimination, supporting humanitarian needs, caring for animals, and protecting the environment.</p><div class="actions"><a class="button" href="/purposes">Explore Our Four Purposes &rarr;</a>${link('/get-involved', 'Find your place')}</div></div><aside class="hero-note"><p class="eyebrow">One voice. Four purposes.</p><p class="display-quote">Compassion<br>without<br>boundaries.</p><p>For people. For animals.<br>For the world we share.</p><span class="seal-line" aria-hidden="true"></span></aside></section>${purposeSection()}${callout('A voice begins with understanding.', 'Learn about our mission and the ways you may be able to support it as opportunities are approved.', '/about', 'Meet Your Global Voice')}`,
  '/about': `${intro('About Us', 'A shared commitment to human dignity, compassionate assistance, animal welfare, and environmental stewardship.')}<section class="split-section"><div><p class="eyebrow">Who we are</p><h2>Four purposes.<br>One shared responsibility.</h2></div><div><p>Your Global Voice, Inc. is an international nonprofit organization. Our four official organizational purposes are set out in our Certificate of Incorporation.</p><p>Those purposes connect the needs of people, the well-being of animals, and the protection of the natural world. They provide the foundation for the work we seek to develop.</p><p>Our motto expresses an invitation to shared participation:</p><p class="motto">${motto}</p></div></section><section class="section-space"><div class="section-heading"><p class="eyebrow">Our foundation</p><h2>Compassion with a clear purpose</h2><p>These themes explain our purposes. The exact official wording is preserved on the Purposes page.</p></div>${focusCards()}</section>${callout('Discover what guides us.', 'Explore our mission and read the full official purposes.', '/mission', 'Our mission')}`,
  '/mission': `${intro('Our Mission', mission[0]).replace('<p class="eyebrow">Your Global Voice, Inc.</p>', '')}<section class="split-section"><div><p class="eyebrow">Our guiding direction</p><h2>A voice for care.<br>A purpose for action.</h2></div><div class="mission-body"><p>${escape(mission[1])}</p><details class="mission-details"><summary class="button"><span class="mission-read-more">Read More</span><span class="mission-read-less">Read Less</span></summary><div class="mission-expanded">${mission.slice(2).map(section => `<section class="mission-purpose"><h3>${escape(section.heading)}</h3><p>${escape(section.text)}</p></section>`).join('')}</div></details><p class="motto">${motto}</p></div></section>${purposeSection()}${callout('Explore our areas of focus.', 'See how our purposes can guide future initiatives, with a clear account of what is still being developed.', '/projects', 'Explore projects')}`,
  '/purposes': `${intro('Our Four Purposes', 'The following purposes preserve the wording provided from our Certificate of Incorporation.')}<p class="reading-note">These are the official purpose titles and statements. They are reproduced in full, without rewriting or shortening.</p>${purposeSection(true)}${callout('Purpose is our starting point.', 'Learn about the areas that may shape future initiatives.', '/projects', 'Our areas of focus')}`,
  '/projects': `${intro('Our Projects', 'Future initiatives will be guided by our four official purposes.')}<section class="notice"><h2>Project information will be added after organizational approval.</h2><p>No projects are listed at this stage. The areas below describe our purpose framework; they are not announcements of active programs, partnerships, or completed work.</p></section><section><div class="section-heading"><p class="eyebrow">Areas of focus</p><h2>Where our purposes can lead</h2></div>${focusCards()}</section><section class="content-panel"><h2>What future project updates will include</h2><p>Once approved, project information can explain the need being addressed, the scope of the initiative, available ways to participate, and relevant updates. Until then, no dates, locations, beneficiaries, or results are announced here.</p>${link('/purposes', 'Read the official purposes')}</section>${callout('Stay connected to our direction.', 'Explore possible ways to get involved while participation arrangements are being developed.', '/get-involved', 'Get involved')}`,
  '/get-involved': `${intro('Get Involved', 'Your interest can be the beginning of a shared commitment.')}<section class="notice"><h2>Opportunities are being developed</h2><p>Opportunities to get involved will be shared once approved. Registration and contribution collection are not available yet.</p></section><div class="card-grid">${card('Learn', 'Understand our purposes', 'Start with our four official purposes and the mission they guide. Share accurate information about the organization without implying that unannounced programs are operating.', link('/purposes', 'Explore our purposes'))}${card('Participate', 'Future volunteering', 'Potential volunteering arrangements will need a defined role, location or remote format, appropriate safeguards, and an approved registration process. No volunteer placements are currently offered.')}${card('Contribute', 'Consider future support', 'Financial contributions and donations of goods may become ways to help when verified arrangements are in place. Please review the donation guidance before making plans.', link('/donate', 'Review support options'))}${card('Connect', 'Future collaboration', 'Organizations and individuals may wish to explore how their interests align with our purposes. Contact channels and collaboration arrangements will be published after verification.', link('/contact', 'Contact information'))}</div>${callout('Every contribution starts with care.', 'Learn what must be in place before financial or in-kind support can be accepted.', '/donate', 'Ways to support')}`,
  '/donate': renderDonate(),
  '/contact': renderContact(contact),
};
// Sibling HTML paths work both from file:// and from the preview server.
const pageFiles = new Map(pages.map(([path, , file]) => [path, file]));
for (const [path, title, file] of pages) {
  const navigationLinks = pages.map(([url, label]) => `<a href="${url}"${url === path ? ' aria-current="page"' : ''}>${url === "/purposes" ? "Our Causes" : label}</a>`);
  const navigation = navigationLinks.join('');
  const footerNavigation = navigationLinks.slice(0, 5).join('') + '<span class="footer-navigation-break" aria-hidden="true"></span>' + navigationLinks.slice(5).join('');
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${path === '/' ? 'Your Global Voice, Inc.' : `${title} | Your Global Voice, Inc.`}</title>
  <meta name="description" content="Your Global Voice, Inc. — human dignity, humanitarian assistance, animal welfare, and environmental protection. Explore our purposes and future ways to participate.">
  <link rel="icon" type="image/png" href="603250A8-B1C4-4533-848C-4028A6E0AD49.png">
  <link rel="stylesheet" href="styles.css">${path === "/contact" ? '\n  <link rel="stylesheet" href="contact.css">\n  <script src="contact.js" defer></script>' : path === "/donate" ? '\n  <link rel="stylesheet" href="donate.css">\n  <script src="donate.js" defer></script>' : path === "/mission" ? '\n  <link rel="stylesheet" href="mission.css">' : ""}
</head>
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  <header class="site-header"><div class="header-inner">
    <div class="header-brand"><img class="header-logo" src="603250A8-B1C4-4533-848C-4028A6E0AD49.png" alt="Your Global Voice official logo" width="1254" height="1254"><a class="wordmark" href="/">Your Global Voice</a></div>
    <details class="mobile-menu"><summary>Menu <span aria-hidden="true">+</span></summary><nav aria-label="Mobile navigation">${navigation}</nav></details><nav class="desktop-nav" aria-label="Main navigation">${navigation}</nav>
  </div></header>
  <main id="main" tabindex="-1">${bodies[path]}</main>
  <footer class="site-footer"><div class="footer-inner"><p class="footer-name">YOUR GLOBAL VOICE</p><p class="footer-slogan">Where Every Voice Matters</p><nav class="footer-navigation" aria-label="Footer navigation">${footerNavigation}</nav><p class="footer-copyright">© 2026 Your Global Voice, Inc. All rights reserved.</p></div></footer>
</body>
</html>
`;
  const portableHtml = html.replace(/href="([^"#]+)"/g, (match, href) => {
    const target = pageFiles.get(href);
    return target ? `href="${target}"` : match;
  });
  await writeFile(new URL(`../public/${file}`, import.meta.url), portableHtml);
}
console.log('Built all 8 pages from shared layout and official purposes.');
