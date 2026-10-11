# GitHub Pages contact email activation

## Prepared, not enabled

GitHub Pages hosts static files and cannot send email or store an API secret.
The prepared integration uses a separate Cloudflare Worker on its default HTTPS
workers.dev address and the already verified Resend domain. Namecheap mailboxes
continue receiving mail normally; no passwords, DNS, domain transfer, custom
Worker domain, or website builder is involved. No paid service is required by
this configuration. Account availability and free-tier limits must be confirmed
before activation; do not authorize a paid plan automatically.

The live form stays disabled until an endpoint is configured. API acceptance is
not proof of inbox receipt. No real delivery has been tested here.

## Exact external steps

1. Create or use a Cloudflare account with Workers and SQLite-backed Durable
   Objects available on the free plan. Obtain access to deploy the repository's
   `worker/wrangler.toml`. The repository contains the complete Worker source;
   no website migration is necessary. An authorized developer can deploy it
   using Wrangler, or connect this repository to Workers Builds with root
   directory `worker` and deploy command `npx wrangler deploy`.
2. In Cloudflare **Workers & Pages → your-global-voice-contact → Settings →
   Variables and Secrets**, add **RESEND_API_KEY as a Secret**, never as plaintext
   or a GitHub repository variable. Enter the existing sending-only key directly
   there. Do not send it through chat. Wrangler's interactive secret-entry flow
   is another option for an authorized developer. Do not put the key in a build
   command, TOML, HTML, JavaScript, or GitHub Pages settings.
3. Keep the public Worker settings `CONTACT_SITE_ORIGIN` equal to
   `https://aelefteriadis.github.io` (browser origins do not include the repository
   path) and `CONTACT_MAIL_FROM` equal to `info@ygvoice.org`, provided Resend
   authorizes this sender under the verified ygvoice.org domain. The visitor's
   address is Reply-To. The Worker controls recipients: Donations & Financial
   Support goes to support@ygvoice.org; all other categories go to info@ygvoice.org.
4. Deploy the Worker and record its actual HTTPS workers.dev origin. No DNS is
   needed. Before connecting it to Pages, test status and an authorized simulated
   browser submission against that endpoint, using the allowed Origin header,
   the returned one-time token, and waiting at least one second. Send clearly
   labeled real test inquiries for both general and donation categories. Check
   Resend delivery events and actual receipt in both Namecheap inboxes, including
   spam folders. Confirm Reply-To works. Acceptance alone is insufficient.
5. After both inbox tests succeed, in GitHub repository **Settings → Secrets and
   variables → Actions → Variables**, add `CONTACT_API_ORIGIN` containing only
   the exact public endpoint, for example `https://your-global-voice-contact.YOUR-SUBDOMAIN.workers.dev`.
   This URL is public, not a secret. Run **Actions → Validate and publish website →
   Run workflow** on main. The artifact builder adds the endpoint and narrowly
   scoped connection permission; no HTML content or visual design changes.
6. Verify the published Contact page from a browser: required-field validation,
   privacy consent, general and donation routing, both inbox receipts, replay
   rejection, rate limiting, and provider-error messaging. Remove the GitHub
   variable and rerun Pages publishing to disable submission if a problem occurs.

Do not supply a Namecheap password or a Resend key to GitHub Pages. Resend's
verified domain does not make a static form send emails without this endpoint.

## Security and privacy

Server-side validation allows only approved categories, constrains message/body
sizes, prevents header injection, and ignores any client-supplied recipient.
Only the configured website origin is allowed. Spam controls combine a honeypot,
cryptographically random single-use tokens, a minimum completion time, 15-minute
expiry, 20 token requests and five submission attempts per 15 minutes per client.
Durable Objects persist and serialize these limits across Worker restarts; an
alarm removes their state after the window. Cloudflare's trusted client IP is
HMAC-hashed before selecting the limiter. Bodies, email addresses, names and raw
IP addresses are not stored or logged by application code. Provider errors are
redacted and requests time out. This is layered spam protection, not a guarantee
against all abuse; a CAPTCHA can be evaluated later if necessary.

Cloudflare processes connection metadata; Resend processes submitted email; the
Namecheap inbox retains delivered inquiries. Review these providers' privacy
terms and choose an inbox retention/deletion policy before activation. The
existing consent and sensitive-information warning remain unchanged. Never
collect medical records, identity documents or payment details through the form.

## Validation

`npm test` covers all eight pages and simulated endpoint/provider behavior.
`npx wrangler deploy --dry-run --config worker/wrangler.toml` checks the Worker
bundle without publishing or sending email. Real Cloudflare storage behavior,
provider delivery, mailbox receipt and browser CORS must be checked after the
external setup. The local Node adapter still uses `CONTACT_MAIL_API_KEY`; the
new production Worker explicitly maps its `RESEND_API_KEY` Secret to that
adapter internally.
