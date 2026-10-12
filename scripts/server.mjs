import { createServer } from 'node:http';
import { createContactHandler } from './contact-delivery.mjs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Explicit public routes prevent exposing source files, secrets, or arbitrary paths.
const routes = new Map([
  ['/', ['../public/index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['../public/index.html', 'text/html; charset=utf-8']],
  ...['about', 'mission', 'purposes', 'projects', 'get-involved', 'donate', 'contact'].flatMap((page) => [
    [`/${page}`, [`../public/${page}.html`, 'text/html; charset=utf-8']],
    [`/${page}/`, [`../public/${page}.html`, 'text/html; charset=utf-8']],
    [`/${page}.html`, [`../public/${page}.html`, 'text/html; charset=utf-8']],
  ]),
  ['/603250A8-B1C4-4533-848C-4028A6E0AD49.png', ['../public/603250A8-B1C4-4533-848C-4028A6E0AD49.png', 'image/png']],
  ['/donation-globe.webp', ['../public/donation-globe.webp', 'image/webp']],
  ['/donate.js', ['../public/donate.js', 'text/javascript; charset=utf-8']],
  ['/donate.css', ['../public/donate.css', 'text/css; charset=utf-8']],
  ['/contact.js', ['../public/contact.js', 'text/javascript; charset=utf-8']],
  ['/contact.css', ['../public/contact.css', 'text/css; charset=utf-8']],
  ['/styles.css', ['../public/styles.css', 'text/css; charset=utf-8']],
]);

export function createPreviewServer(contactOptions) {
  const handleContact = createContactHandler(contactOptions);
  return createServer(async (request, response) => {
    const contactRoute = /^\/contact(?:\.html|\/)?(?:\?|$)/.test(request.url);
    const donateRoute = /^\/donate(?:\.html|\/)?(?:\?|$)/.test(request.url);
    response.setHeader('Content-Security-Policy', `default-src 'none'; img-src 'self'; style-src 'self'; base-uri 'none'; ${contactRoute ? "script-src 'self'; connect-src 'self'; form-action 'self'" : donateRoute ? "script-src 'self'; form-action 'none'" : "form-action 'none'"}; frame-ancestors 'none'`);
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
