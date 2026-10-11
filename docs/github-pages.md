# GitHub Pages publication

The repository contains a prepared workflow at `.github/workflows/pages.yml`.
The initial publication remains blocked until the owner explicitly sets the
repository Actions variable `YGV_PAGES_PUBLICATION_APPROVED` to `true`.
No custom domain or CNAME is configured by this workflow.

## Final owner activation (no Terminal required)

After approving public publication of the existing content and contact details:

1. In this repository, open **Settings → Pages → Build and deployment** and set
   **Source** to **GitHub Actions**. Preserve any existing custom-domain settings;
   do not add ygvoice.org, alter DNS, or change Namecheap/email settings.
2. Open **Settings → Secrets and variables → Actions → Variables**, create the
   non-secret repository variable `YGV_PAGES_PUBLICATION_APPROVED`, and set it to
   `true`. Never add a Resend key to this static publishing workflow.
3. Open **Actions → Validate and publish website → Run workflow**, select `main`,
   and run it. If GitHub prompts you to enable Actions, do so for this workflow.
   The first successful publish job supplies the actual Pages URL.

Expected default project URL, only after successful publication:
`https://aelefteriadis.github.io/Your-Global-Voice/`.
This is an expected URL, not proof of publication. GitHub may show an alternative
if the repository already has domain settings; do not change those settings.

Subsequent pushes to `main` automatically scan credentials, build and test,
regenerate the pages, prepare the public artifact, and update Pages. No Terminal or preview server
restart is needed. You can edit the source content through GitHub’s web editor;
the workflow regenerates HTML, so you do not need to run the generator locally.
Edit `scripts/contact.mjs` / `content/contact.json` for Contact content and
`scripts/build.mjs` for other page content rather than the generated HTML.
A failed validation prevents publication. Pull requests run
validation without publishing. To pause future publishing, set the approval
variable to `false`. This does not remove the existing published website.

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

GitHub Pages is static hosting. The Contact form's Node.js/Resend API cannot run
there. The Pages artifact explicitly marks the form unavailable and does not
probe a nonexistent API. Email links, WhatsApp, address copying, navigation,
form fields, responsive layout, and donation information remain functional.
Actual form email delivery requires a separately approved backend integration.
No key belongs in HTML, JavaScript, the Pages artifact, or its build environment.
The existing local server retains its secure backend support and behavior.

## Validation before activation

Run `npm test`, `git diff --exit-code -- public`, and
`node scripts/prepare-pages.mjs /tmp/your-new-pages-directory` for local checks.
The final report distinguishes local validation from GitHub Actions execution and
public publication. GitHub settings could not be read through this environment's
API connection; an HTTP Forbidden response is not proof that Pages is enabled or
disabled. Owner activation above is required before claiming a public site.
