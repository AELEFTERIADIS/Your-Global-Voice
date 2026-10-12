import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export function validatePagesUrl(value) {
  const url = new URL(value);
  const allowedPaths = new Map([
    ['aelefteriadis.github.io', '/Your-Global-Voice'],
    ['ygvoice.org', ''],
    ['www.ygvoice.org', '']
  ]);
  if (url.protocol !== 'https:' || !allowedPaths.has(url.hostname) || url.port || url.username || url.password || url.search || url.hash || url.pathname.replace(/\/$/, '') !== allowedPaths.get(url.hostname)) {
    throw new Error('Publishing stopped: Pages must target the approved GitHub Pages project URL, https://ygvoice.org/, or https://www.ygvoice.org/.');
  }
  return url.href;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  validatePagesUrl(process.env.PAGES_BASE_URL);
  console.log('Approved GitHub Pages publication URL confirmed.');
}
