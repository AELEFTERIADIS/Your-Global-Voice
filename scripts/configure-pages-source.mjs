import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validatePagesUrl } from './validate-pages-url.mjs';

export async function configurePagesSource({ repository, token, request = fetch }) {
  if (repository !== 'AELEFTERIADIS/Your-Global-Voice' || !token) throw new Error('The repository Pages configuration requires its built-in Actions token.');
  const endpoint = `https://api.github.com/repos/${repository}/pages`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  const current = await request(endpoint, { headers, signal: AbortSignal.timeout(15000) });
  if (!current.ok) throw new Error(`Cannot read Pages configuration (HTTP ${current.status}). Set Settings → Pages → Source to GitHub Actions and rerun this workflow.`);
  const settings = await current.json();
  validatePagesUrl(settings.html_url);
  if (settings.cname) throw new Error('Publishing stopped: an existing custom domain is configured. No domain settings were changed.');
  if (settings.build_type === 'workflow') return 'GitHub Actions publishing source already configured.';
  const result = await request(endpoint, {
    method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ build_type: 'workflow' }), signal: AbortSignal.timeout(15000)
  });
  if (!result.ok) throw new Error(`Cannot switch Pages source automatically (HTTP ${result.status}). Set Settings → Pages → Build and deployment → Source to GitHub Actions, then rerun Validate and publish website. No domain settings were changed.`);
  const confirmed = await request(endpoint, { headers, signal: AbortSignal.timeout(15000) });
  if (!confirmed.ok) throw new Error('Pages source update needs verification. Check Settings → Pages → Source before rerunning.');
  const final = await confirmed.json();
  validatePagesUrl(final.html_url);
  if (final.build_type !== 'workflow' || final.cname) throw new Error('Pages source is not ready for default-domain Actions publishing. Check Settings → Pages.');
  return 'Pages publishing source changed to GitHub Actions; domain settings preserved.';
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  console.log(await configurePagesSource({ repository: process.env.GITHUB_REPOSITORY, token: process.env.GITHUB_TOKEN }));
}
