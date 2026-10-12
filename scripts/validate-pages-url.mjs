import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export function validatePagesUrl(value) {
  const url = new URL(value);
  const allowedPaths = new Map([
    ['aelefteriadis.github.io', '/Your-Global-Voice'],
    ['ygvoice.org', ''],
    ['www.ygvoice.org', '']
  ]);
  // GitHub can report HTTP for a custom domain before certificate issuance or
  // HTTPS enforcement. This metadata must not prevent uploading the site.
  const customDomain = ['ygvoice.org', 'www.ygvoice.org'].includes(url.hostname);
  const allowedProtocol = url.protocol === 'https:' || (customDomain && url.protocol === 'http:');
  if (!allowedProtocol || !allowedPaths.has(url.hostname) || url.port || url.username || url.password || url.search || url.hash || url.pathname.replace(/\/$/, '') !== allowedPaths.get(url.hostname)) {
    throw new Error(`Publishing stopped: unapproved Pages URL configuration (protocol=${url.protocol}, host=${url.host}, path=${url.pathname}). Allowed destinations: the GitHub Pages project URL and ygvoice.org/www.ygvoice.org roots. Credentials, nonstandard ports, queries, and fragments are not allowed.`);
  }
  return url.href;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const approvedUrl = new URL(validatePagesUrl(process.env.PAGES_BASE_URL));
  console.log(`Pages configuration: ${approvedUrl.origin}${approvedUrl.pathname}`);
  if (approvedUrl.protocol === 'http:') console.warn('::warning::GitHub reports HTTP for this approved custom domain. Publishing may proceed, but HTTPS certificate availability and Enforce HTTPS must be verified before public readiness is confirmed.');
  console.log('Approved GitHub Pages publication URL confirmed.');
}
