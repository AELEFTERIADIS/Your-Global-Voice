# GitHub Pages publication

The repository contains a prepared workflow at `.github/workflows/pages.yml`.
Every push to `main` automatically validates and publishes the `/public` content
through the prepared static artifact. No approval variable is required.
Publication accepts the existing GitHub Pages project URL and the approved
HTTPS root URLs `https://ygvoice.org/` and `https://www.ygvoice.org/`. Other
hostnames, paths, credentials, ports, and insecure URLs remain blocked.
The workflow reads GitHub’s saved Pages domain; it does not change that setting,
DNS, or a CNAME. Domain setup and HTTPS availability require live verification.

## GitHub setup (no Terminal required)

The owner has confirmed **Settings → Pages → Build and deployment → Source**
is saved as **GitHub Actions**. The workflow uses that configuration directly;
it does not attempt to switch the publishing source or require permission to
update repository settings. For a newly configured repository, set that source
manually before the first workflow run. Enable repository Actions if GitHub prompts you.
No personal API key or `YGV_PAGES_PUBLICATION_APPROVED` variable is needed.
A root `index.html` also opens the existing `public/index.html` website when an
older branch-root publishing configuration is still active; it prevents README
from being used as the landing page. The Actions artifact continues to place the
actual homepage directly at the project URL and does not include this redirect.

If Pages was not enabled when this commit was pushed, open **Actions → Validate
and publish website → Run workflow** and select `main` after setting the source.
Subsequent pushes to `main` will publish automatically.

Approved URLs are `https://aelefteriadis.github.io/Your-Global-Voice/`,
`https://ygvoice.org/`, and `https://www.ygvoice.org/`. GitHub determines the
published canonical URL from its saved Pages configuration. This update does not
select or change the canonical domain, add DNS records, or change email settings.
The legacy `configure-pages-source.mjs` helper is not used by the workflow; the
workflow does not automatically switch Pages sources or domain settings.

Future pushes scan credentials, regenerate and test all eight pages, and upload
only the public website artifact. No manual server restart is needed. Edit source
content using GitHub’s web editor (`scripts/contact.mjs`, `content/contact.json`,
or `scripts/build.mjs`) rather than generated HTML. Failed checks block deployment;
pull requests validate without publishing. The successful deploy job reports the
actual website URL. GitHub Actions execution and live publication must be verified
in GitHub; this environment cannot currently read its API.

## Scope and security

The scanner is Gitleaks v8.24.3, pinned by release checksum, with its standard
rules plus a Resend-key rule. Git history and checkout are scanned with secrets
redacted. All Actions are pinned to their resolved full commit identifiers.
GitHub's built-in job token publishes the site; no user token or mail key is
required. Only the publish job receives Pages-write and OIDC permissions.

`prepare-pages.mjs` creates a new artifact containing only the eight HTML pages,
shared CSS, Contact CSS/JavaScript, original logo, and `.nojekyll`. It refuses to
overwrite an existing output directory. Server source, tests, docs, contact JSON,
Git metadata, and environment files are excluded. Build-only CSP metadata
restricts resources and form submission without changing the approved design,
text, navigation, footer, or logo. Relative HTML paths support the project URL.

GitHub Pages is static hosting. Contact submission uses the separate Cloudflare
Worker and server-side Resend adapter, not the local Node preview server. The
Pages artifact includes the configured Worker endpoint. The Worker allowlist
includes `https://aelefteriadis.github.io`, `https://ygvoice.org`, and
`https://www.ygvoice.org`; responses echo only the matched allowed origin and
include `Vary: Origin`. Unknown origins remain rejected. No mail key belongs in
HTML, JavaScript, the Pages artifact, or its build environment. Production
Worker deployment, browser CORS, provider acceptance, and actual inbox delivery
must be verified live after configuration changes.

## Validation before activation

Run `npm test`, `git diff --exit-code -- public`, and
`node scripts/prepare-pages.mjs /tmp/your-new-pages-directory` for local checks.
The final report distinguishes local validation from GitHub Actions execution and
public publication. GitHub settings could not be read through this environment's
API connection; an HTTP Forbidden response is not proof that Pages is enabled or
disabled. GitHub Pages source configuration above is required before claiming a public site.
