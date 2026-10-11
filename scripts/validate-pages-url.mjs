import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export function validatePagesUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'aelefteriadis.github.io' || url.port || url.username || url.password || url.search || url.hash || url.pathname.replace(/\/$/, '') !== '/Your-Global-Voice') {
    throw new Error('Publishing stopped: Pages must target https://aelefteriadis.github.io/Your-Global-Voice/. No custom-domain deployment is permitted.');
  }
  return url.href;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  validatePagesUrl(process.env.PAGES_BASE_URL);
  console.log('Default GitHub Pages project domain confirmed.');
}
