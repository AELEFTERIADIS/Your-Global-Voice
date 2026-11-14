import { missionImages } from './mission-images.mjs';
import { createServer } from 'node:http';
import { createContactHandler } from './contact-delivery.mjs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Explicit public routes prevent exposing source files, secrets, or arbitrary paths.
const routes = new Map([
 ...['/environmental-protection','/environmental-protection/','/environmental-protection.html'].map(path=>[path,['../public/environmental-protection.html','text/html; charset=utf-8']]),
 ['/environmental-protection.css',['../public/environmental-protection.css','text/css; charset=utf-8']],
 ['/Your%20Global%20Voice_%20Environmental%20Protection.png',['../public/Your Global Voice_ Environmental Protection.png','image/png']],
 ['/home-frame.css',['../public/home-frame.css','text/css; charset=utf-8']],
 ['/F3DD0B89-7B89-49E6-9ABE-704FBE41D499.JPEG',['../public/F3DD0B89-7B89-49E6-9ABE-704FBE41D499.JPEG','image/jpeg']],
 ['/FF41928C-E0E7-46E8-9976-1B6857351736.PNG',['../public/FF41928C-E0E7-46E8-9976-1B6857351736.PNG','image/png']],
 ['/contact-modal.js',['../public/contact-modal.js','text/javascript; charset=utf-8']],
 ['/contact-modal.css',['../public/contact-modal.css','text/css; charset=utf-8']],
 ...['/animal-welfare','/animal-welfare/','/animal-welfare.html'].map(path=>[path,['../public/animal-welfare.html','text/html; charset=utf-8']]),
 ['/animal-welfare.css',['../public/animal-welfare.css','text/css; charset=utf-8']],
 ['/Animal%20Welfare_%20Compassion%20in%20Action.png',['../public/Animal Welfare_ Compassion in Action.png','image/png']],
 ['/5008A87A-3C8C-4B00-A61F-FECAB730B2A7.PNG',['../public/5008A87A-3C8C-4B00-A61F-FECAB730B2A7.PNG','image/png']],
 ...['/humanitarian','/humanitarian/','/humanitarian.html'].map(path=>[path,['../public/humanitarian.html','text/html; charset=utf-8']]),
 ['/humanitarian.css',['../public/humanitarian.css','text/css; charset=utf-8']],
 ['/Compassion%20Beyond%20Borders_%20Humanitarian%20Relief.png',['../public/Compassion Beyond Borders_ Humanitarian Relief.png','image/png']],

 ...['/human-rights','/human-rights/','/human-rights.html'].map(path=>[path,['../public/human-rights.html','text/html; charset=utf-8']]),
 ['/human-rights.js', ['../public/human-rights.js', 'text/javascript; charset=utf-8']],
 ['/human-rights.css',['../public/human-rights.css','text/css; charset=utf-8']],
 ['/Human%20Rights%20and%20Dignity%20Nonprofit%20Poster.png',['../public/Human Rights and Dignity Nonprofit Poster.png','image/png']],
 ['/FB4FACEC-5020-4449-8B9B-A6A524186EE3.JPEG',['../public/FB4FACEC-5020-4449-8B9B-A6A524186EE3.JPEG','image/jpeg']],
 ...['/causes','/causes/','/causes.html'].map(path=>[path,['../public/purposes.html','text/html; charset=utf-8']]),
 ['/xxxxxxxxxxxxxx.png',['../public/xxxxxxxxxxxxxx.png','image/png']],
 ['/desktop-causes.css',['../public/desktop-causes.css','text/css; charset=utf-8']],
 ['/Our%20Causes_%20Compassion%20in%20Action.png',['../public/Our Causes_ Compassion in Action.png','image/png']],
 ['/2D800A7B-B42F-453F-9FEA-E8615115523D.jpeg', ['../public/2D800A7B-B42F-453F-9FEA-E8615115523D.jpeg','image/jpeg']],
 ['/C84CC7A1-DA96-47CA-B88D-67E57851C8D0.png', ['../public/C84CC7A1-DA96-47CA-B88D-67E57851C8D0.png','image/png']],
 ['/123456789.png', ['../public/123456789.png','image/png']],
 ['/desktop-mission.css',['../public/desktop-mission.css','text/css; charset=utf-8']],
 ['/585C5709-9F99-450A-BC75-FF3237495E19.png',['../public/585C5709-9F99-450A-BC75-FF3237495E19.png','image/png']],
 ['/41251AE2-36C7-4CCA-87DD-16804E860189.jpeg',['../public/41251AE2-36C7-4CCA-87DD-16804E860189.jpeg','image/jpeg']],
 ['/home-hero-approved-divider.svg',['../public/home-hero-approved-divider.svg','image/svg+xml']],
 ...['andreas-elefteriadis','maximos-weimar','robert-shillenn'].flatMap(page=>[
   [`/${page}.html`,[`../public/${page}.html`,'text/html; charset=utf-8']],
   [`/${page}`, [`../public/${page}.html`,'text/html; charset=utf-8']],
   [`/${page}/`, [`../public/${page}.html`,'text/html; charset=utf-8']],
 ]),
 ['/leadership-biography.css',['../public/leadership-biography.css','text/css; charset=utf-8']],
 ['/About%20Us_%20Unity%20in%20Diversity%20(1).png', ['../public/About Us_ Unity in Diversity (1).png', 'image/png']],
 ['/Your%20Global%20Voice%20%E2%80%94%20About%20Us123.png', ['../public/Your Global Voice — About Us123.png', 'image/png']],
 ['/Your%20Global%20Voice%20About%20Us.png', ['../public/Your Global Voice About Us.png', 'image/png']],
 ['/479BC5DC-EFA1-48F7-849F-E25CB71E542D.png', ['../public/479BC5DC-EFA1-48F7-849F-E25CB71E542D.png', 'image/png']],
 ['/desktop-about.css', ['../public/desktop-about.css', 'text/css; charset=utf-8']],
 ['/desktop-about.js', ['../public/desktop-about.js', 'text/javascript; charset=utf-8']],
 ['/desktop-about-hero.css', ['../public/desktop-about-hero.css', 'text/css; charset=utf-8']],
 ['/C74456AF-F38B-4398-AAD8-0F5E2803FC34.png', ['../public/C74456AF-F38B-4398-AAD8-0F5E2803FC34.png', 'image/png']],
 ['/home-sidebar-refinement.css', ['../public/home-sidebar-refinement.css', 'text/css; charset=utf-8']],
 ['/desktop-home.css', ['../public/desktop-home.css', 'text/css; charset=utf-8']],
 ['/BC7678D3-851B-4549-BF8C-D4BE0B43E533.png', ['../public/BC7678D3-851B-4549-BF8C-D4BE0B43E533.png', 'image/png']],
 ['/desktop-header-condensed-bold.woff', ['../public/desktop-header-condensed-bold.woff', 'font/woff']],
 ['/desktop-header-font-license.txt', ['../public/desktop-header-font-license.txt', 'text/plain; charset=utf-8']],
 ['/desktop-header.css', ['../public/desktop-header.css', 'text/css; charset=utf-8']],
 ['/desktop-header.js', ['../public/desktop-header.js', 'text/javascript; charset=utf-8']],
 ['/home-brand.css', ['../public/home-brand.css', 'text/css; charset=utf-8']],
 ['/home-sidebar.css', ['../public/home-sidebar.css', 'text/css; charset=utf-8']],
 ['/home-sidebar.js', ['../public/home-sidebar.js', 'text/javascript; charset=utf-8']],
 ['/donation-cause.css', ['../public/donation-cause.css', 'text/css; charset=utf-8']],
 ['/donation-cause.js', ['../public/donation-cause.js', 'text/javascript; charset=utf-8']],
 ['/home-causes.css', ['../public/home-causes.css', 'text/css; charset=utf-8']],
 ['/home-causes.js', ['../public/home-causes.js', 'text/javascript; charset=utf-8']],
 ['/What%20We%20Stand%20For_%20Four%20Causes.png', ['../public/What We Stand For_ Four Causes.png', 'image/png']],
 ['/A%20Shared%20Voice%20for%20a%20Better%20World%20Banner.png', ['../public/A Shared Voice for a Better World Banner.png', 'image/png']],
 ['/8ED5B5FC-24D8-415B-AC3C-1D3238049D61.png', ['../public/8ED5B5FC-24D8-415B-AC3C-1D3238049D61.png', 'image/png']],
 ['/0E3E8863-61DD-4871-976F-125EACDB2842.png', ['../public/0E3E8863-61DD-4871-976F-125EACDB2842.png', 'image/png']],
 ['/home-hero.css', ['../public/home-hero.css', 'text/css; charset=utf-8']],
 ['/home-hero-landscape.webp', ['../public/home-hero-landscape.webp', 'image/webp']],
 ['/projects-hero-row-background.webp', ['../public/projects-hero-row-background.webp', 'image/webp']],
 ['/projects-approach-paragraph-left.webp', ['../public/projects-approach-paragraph-left.webp', 'image/webp']],
 ['/projects-approach-mobile-edit.webp', ['../public/projects-approach-mobile-edit.webp', 'image/webp']],
  ...['/coming-soon', '/coming-soon/', '/coming-soon.html'].map(path => [path, ['../public/coming-soon.html', 'text/html; charset=utf-8']]),
  ['/coming-soon.css', ['../public/coming-soon.css', 'text/css; charset=utf-8']],
  ['/coming-soon.js', ['../public/coming-soon.js', 'text/javascript; charset=utf-8']],
  ['/projects-hero-slogan-repair.webp',['../public/projects-hero-slogan-repair.webp','image/webp']],
 ['/projects-hero-compact.webp', ['../public/projects-hero-compact.webp', 'image/webp']],
  ['/projects-hero-nature-label.webp', ['../public/projects-hero-nature-label.webp', 'image/webp']],
  ['/projects-hero-value-labels.webp', ['../public/projects-hero-value-labels.webp', 'image/webp']],
  ['/Explore%20Our%20Impact%20Projects%20(1).png', ['../public/Explore Our Impact Projects (1).png', 'image/png']],
  ['/projects-slogan-accent.svg', ['../public/projects-slogan-accent.svg', 'image/svg+xml']],
  ['/projects-title-accent.svg', ['../public/projects-title-accent.svg', 'image/svg+xml']],
  ['/projects-gold-wave.svg', ['../public/projects-gold-wave.svg', 'image/svg+xml']],
  ['/projects.css', ['../public/projects.css', 'text/css; charset=utf-8']],
  ['/projects.js', ['../public/projects.js', 'text/javascript; charset=utf-8']],
  ['/projects-hero.js', ['../public/projects-hero.js', 'text/javascript; charset=utf-8']],
  ['/DE95C446-F64B-4963-923B-8703F03269C5.png', ['../public/DE95C446-F64B-4963-923B-8703F03269C5.png', 'image/png']],
  ['/2E318DBA-71A7-4D42-9FC2-5E723868F9CC.png', ['../public/2E318DBA-71A7-4D42-9FC2-5E723868F9CC.png', 'image/png']],
  ['/C4112960-9D5E-444E-92F1-4F3CE664A3D6.png', ['../public/C4112960-9D5E-444E-92F1-4F3CE664A3D6.png', 'image/png']],
  ['/56EA6270-EEBB-4E87-A031-4D6FCC6D8A22.png', ['../public/56EA6270-EEBB-4E87-A031-4D6FCC6D8A22.png', 'image/png']],
  ['/Get%20involved%202.png', ['../public/Get involved 2.png', 'image/png']],
  ['/Get%20involve%20Hero%20PNG.PNG', ['../public/Get involve Hero PNG.PNG', 'image/png']],
  ['/get-involved-hero.css', ['../public/get-involved-hero.css', 'text/css; charset=utf-8']],
  ['/application.js', ['../public/application.js', 'text/javascript; charset=utf-8']],
  ['/application.css', ['../public/application.css', 'text/css; charset=utf-8']],
  ['/get%20involved%20111.JPEG', ['../public/get involved 111.JPEG', 'image/jpeg']],
  ['/30D02897-5227-4D75-B420-B17C1E5737F6.jpeg', ['../public/30D02897-5227-4D75-B420-B17C1E5737F6.jpeg', 'image/jpeg']],
  ['/D9F50182-33A3-4256-A66C-C0ED63B26F1E.jpeg', ['../public/D9F50182-33A3-4256-A66C-C0ED63B26F1E.jpeg', 'image/jpeg']],
  ['/CFA1FD8E-17F4-49FE-A5D8-4F97EBB1E587.png', ['../public/CFA1FD8E-17F4-49FE-A5D8-4F97EBB1E587.png', 'image/png']],
  ['/YGV-Humanitarian-Aid.jpeg', ['../public/YGV-Humanitarian-Aid.jpeg', 'image/jpeg']],
  ['/8C534551-DFAE-4F96-B226-14203E48BE5D.jpeg', ['../public/8C534551-DFAE-4F96-B226-14203E48BE5D.jpeg', 'image/jpeg']],
  ['/011A7EA4-9734-4150-A3F7-7694CB94F46D.jpeg', ['../public/011A7EA4-9734-4150-A3F7-7694CB94F46D.jpeg', 'image/jpeg']],
  ...['E7F71712-32D1-43FE-BA18-618193E48BA8.png','C877690E-4E12-4A62-BCE4-47A36456254D.png','Elderly Cleric in Embroidered Hat.png'].map(file=>['/'+encodeURI(file),['../public/'+file,'image/png']]),
  ['/about.js', ['../public/about.js', 'text/javascript; charset=utf-8']],
  ['/about.css', ['../public/about.css', 'text/css; charset=utf-8']],
  ['/3F43F73B-C751-448D-AE01-2EFD16DF9F87.png', ['../public/3F43F73B-C751-448D-AE01-2EFD16DF9F87.png', 'image/png']],
  ['/76294CB8-5CC1-405F-92D0-03D3AFBEA081.png', ['../public/76294CB8-5CC1-405F-92D0-03D3AFBEA081.png', 'image/png']],
  ...missionImages.map(image => [`/${image.src}`, [`../public/${image.src}`, 'image/png']]),
  ['/', ['../public/index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['../public/index.html', 'text/html; charset=utf-8']],
  ...['about', 'mission', 'purposes', 'projects', 'get-involved', 'donate', 'contact'].flatMap((page) => [
    [`/${page}`, [`../public/${page}.html`, 'text/html; charset=utf-8']],
    [`/${page}/`, [`../public/${page}.html`, 'text/html; charset=utf-8']],
    [`/${page}.html`, [`../public/${page}.html`, 'text/html; charset=utf-8']],
  ]),
  ['/603250A8-B1C4-4533-848C-4028A6E0AD49.png', ['../public/603250A8-B1C4-4533-848C-4028A6E0AD49.png', 'image/png']],
  ...['visa', 'mastercard', 'discover'].map(brand => [`/${brand}-logo.svg`, [`../public/${brand}-logo.svg`, 'image/svg+xml']]),
  ['/link-logo.svg', ['../public/link-logo.svg', 'image/svg+xml']],
  ['/amex-logo.svg', ['../public/amex-logo.svg', 'image/svg+xml']],
  ['/paypal-logo.svg', ['../public/paypal-logo.svg', 'image/svg+xml']],
  ['/donation-globe.webp', ['../public/donation-globe.webp', 'image/webp']],
  ['/donate.js', ['../public/donate.js', 'text/javascript; charset=utf-8']],
  ['/donate.css', ['../public/donate.css', 'text/css; charset=utf-8']],
  ['/contact.js', ['../public/contact.js', 'text/javascript; charset=utf-8']],
  ['/mission.css', ['../public/mission.css', 'text/css; charset=utf-8']],
  ['/contact.css', ['../public/contact.css', 'text/css; charset=utf-8']],
  ['/cinzel-regular.woff', ['../public/cinzel-regular.woff', 'font/woff']],
  ['/garamond-regular.woff2', ['../public/garamond-regular.woff2', 'font/woff2']],
  ['/footer-font-licenses.txt', ['../public/footer-font-licenses.txt', 'text/plain; charset=utf-8']],
  ['/styles.css', ['../public/styles.css', 'text/css; charset=utf-8']],
]);

export function createPreviewServer(contactOptions) {
  const handleContact = createContactHandler(contactOptions);
  return createServer(async (request, response) => {
    const contactRoute = /^\/(?:contact|get-involved|animal-welfare|environmental-protection)(?:\.html|\/)?(?:\?|$)/.test(request.url);
    response.setHeader('Content-Security-Policy', `default-src 'none'; img-src 'self'; style-src 'self'; font-src 'self'; base-uri 'none'; ${contactRoute ? "script-src 'self'; connect-src 'self'; form-action 'self'" : "script-src 'self'; form-action 'none'"}; frame-ancestors 'none'`);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    response.setHeader('Cache-Control', 'no-store');

    let apiPath;
    try { apiPath = new URL(request.url, 'http://localhost').pathname; } catch {
      response.writeHead(400); response.end(); return;
    }
    if (await handleContact(request, response, apiPath)) return;

    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }

    let pathname;
    try {
      pathname = new URL(request.url, 'http://localhost').pathname;
    } catch {
      response.writeHead(400);
      response.end();
      return;
    }
    // Keep relative assets at the site root for existing trailing-slash aliases.
    if (pathname !== '/' && pathname.endsWith('/') && routes.has(pathname)) {
      const query = new URL(request.url, 'http://localhost').search;
      response.writeHead(308, { Location: pathname.slice(0, -1) + query });
      response.end();
      return;
    }
    const route = routes.get(pathname);
    if (!route) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : 'Not found');
      return;
    }
    try {
      const body = await readFile(new URL(route[0], import.meta.url));
      response.writeHead(200, { 'Content-Type': route[1] });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch {
      response.writeHead(500);
      response.end();
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  const server = createPreviewServer();
  server.on('error', (error) => {
    console.error(`Preview server failed: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`Homepage preview listening on local port ${port}.`);
  });
}
