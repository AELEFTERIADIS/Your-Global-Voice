import { missionImages } from './mission-images.mjs';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const pagesFiles = ['index.html', 'about.html', 'mission.html', 'purposes.html', 'projects.html', 'get-involved.html', 'donate.html', 'contact.html'];
export const assets = ['CFA1FD8E-17F4-49FE-A5D8-4F97EBB1E587.png', 'YGV-Humanitarian-Aid.jpeg', '8C534551-DFAE-4F96-B226-14203E48BE5D.jpeg', '011A7EA4-9734-4150-A3F7-7694CB94F46D.jpeg', 'C877690E-4E12-4A62-BCE4-47A36456254D.png', 'Elderly Cleric in Embroidered Hat.png', 'E7F71712-32D1-43FE-BA18-618193E48BA8.png', 'about.js', 'about.css', '3F43F73B-C751-448D-AE01-2EFD16DF9F87.png', '76294CB8-5CC1-405F-92D0-03D3AFBEA081.png', ...missionImages.map(image => image.src), 'cinzel-regular.woff', 'garamond-regular.woff2', 'footer-font-licenses.txt', 'styles.css', 'mission.css', 'contact.css', 'contact.js', 'donate.css', 'donate.js', 'donation-globe.webp', 'paypal-logo.svg', 'amex-logo.svg', 'link-logo.svg', 'visa-logo.svg', 'mastercard-logo.svg', 'discover-logo.svg', '603250A8-B1C4-4533-848C-4028A6E0AD49.png'];

export async function preparePages(destination, apiOrigin = process.env.CONTACT_API_ORIGIN || '') {
  if (apiOrigin) {
    const url = new URL(apiOrigin);
    if (url.protocol !== 'https:' || url.origin !== apiOrigin || !url.hostname.endsWith('.workers.dev')) throw new Error('Contact API must be an exact HTTPS workers.dev origin.');
  }
  // Refuse to overwrite an existing directory or user work.
  await mkdir(destination);
  for (const file of [...pagesFiles, ...assets]) {
    const source = new URL(`../public/${file}`, import.meta.url);
    if (file.endsWith('.html')) {
      let html = await readFile(source, 'utf8');
      const contact = file === 'contact.html';
      const donate = file === 'donate.html';
      const about = file === 'about.html';
      const csp = `default-src 'none'; img-src 'self'; style-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'${contact ? `; script-src 'self'; connect-src 'self'${apiOrigin ? " " + apiOrigin : ""}` : (donate || about) ? "; script-src 'self'" : ''}`;
      html = html.replace('<head>', `<head>\n  <meta http-equiv="Content-Security-Policy" content="${csp}">${contact ? `\n  <meta name="ygv-hosting" content="static">${apiOrigin ? '\n  <meta name="ygv-contact-api" content="' + apiOrigin + '">' : ''}` : ''}`);
      await writeFile(resolve(destination, file), html);
    } else {
      await copyFile(source, resolve(destination, file));
    }
  }
  await writeFile(resolve(destination, '.nojekyll'), '');
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (!process.argv[2]) throw new Error('Provide a new, empty output directory for the Pages artifact.');
  await preparePages(resolve(process.argv[2]));
  console.log('Prepared the eight-page static artifact; no server files or credentials included.');
}
