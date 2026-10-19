# Your Global Voice, Inc.

Official website of Your Global Voice, Inc., an international nonprofit organization dedicated to human rights, humanitarian assistance, animal welfare, and environmental protection.

Website: https://ygvoice.org

## Development

This custom-coded foundation uses semantic HTML, responsive CSS, and a small
Node.js preview server. There are no external dependencies or trackers,
or website builders. All eight pages share navigation and a footer. The homepage
displays the organization's name, official motto, and four exact official purposes.

Requires Node.js 22 or newer. From the existing checkout:

```sh
cd /workspace/Your-Global-Voice
npm run dev
```

The server binds to `127.0.0.1` on port 3000. In a local checkout, open
`http://127.0.0.1:3000` in your browser. In the cloud environment, validate with
`curl http://127.0.0.1:3000`; a local browser needs the cloud platform's supported
port forwarding to reach that server. Stop with Ctrl+C. To use another port,
run `PORT=3001 npm run dev`.

Run the HTTP smoke, official-content, and security boundary checks with `npm test`.
No dependency installation is required. `npm run build` regenerates all eight HTML
pages; development and test commands run this build automatically. Use the existing isolated checkout; no worktree is needed.

## Files

- `content/purposes.json`: exact official purpose titles and text supplied by the organization.
- `scripts/build.mjs`: shared layout, navigation, footer, and page content.
- `public/*.html`: eight generated pages; edit the generator rather than these outputs.
- `public/styles.css`: responsive layout, typography, colors, and keyboard focus.
- `scripts/server.mjs`: local preview with explicit public routes and security headers.
- `test/server.test.mjs`: all pages, navigation, exact official wording, inactive donations,
  stylesheet, HTTP methods, and private-file checks.
- `package.json`: development and test commands; no dependencies.
- `.gitignore`: excludes local secrets and generated files.

## Future donations and production

Donations are not enabled. Add a vetted hosted payment-provider checkout and a
separate server-side integration when requirements are approved. Keep credentials
out of public files and Git; validate webhook signatures and payment state on the
server. Do not collect card details in this static homepage. Update the restrictive
content security policy only for the chosen integration's required destinations.

The included HTTP server is for development. A future production host must provide
HTTPS, appropriate security headers (including HSTS once HTTPS is established),
and operational controls. No deployment or domain changes are part of this foundation.

## Stage-one review

Pages: Home (`/`), About Us (`/about`), Our Mission (`/mission`), Our Four Purposes
(`/purposes`), Our Projects (`/projects`), Get Involved (`/get-involved`), Donate
(`/donate`), and Contact Us (`/contact`). Project, participation, and contact
information is awaiting organizational approval; no projects, achievements,
partnerships, contact addresses, or legal statuses have been invented.

The Certificate of Incorporation is the authoritative source for the four
organizational purposes. The titles and text supplied by the organization are
stored verbatim in `content/purposes.json`. Do not rewrite, rename, shorten, or
substitute them without explicit approval. The official motto is
**MY VOICE + YOUR VOICE = OUR VOICE**. The design uses deep navy, restrained gold,
white, and green accents. The supplied official circular logo appears in every header. Its original image
is preserved, with a non-destructive circular CSS mask.

Donation options are informational placeholders only: online financial donations,
credit/debit cards, PayPal, Zelle, bank transfers, checks, and in-kind contributions.
No payment SDK, payment instructions, collection forms, or active donation links
are included. Never activate payments, publish, connect domains, change DNS or
email services, or purchase services without explicit approval.

The development preview can use port 3001 (`PORT=3001 npm run dev`). Cloud review requires
supported port forwarding; no public deployment has been made.

## Complete development draft

All eight pages include shared branding, desktop navigation, an accessible native
mobile disclosure menu, keyboard focus states, the official logo, and footer.
The donation page covers financial options, checks, goods, supplies, clothing,
animal/environment support, and international contributions, with expandable FAQs.
No donations or personal information are collected.

Before public release, the organization must approve the new explanatory copy,
project and participation details, verified contact channels, donation acceptance
policies, payment arrangements, mailing/collection locations, international
logistics, and receipt/tax guidance. The four original official purpose statements
and supplied logo have not been changed. No active projects or partnerships are
claimed. No deployment or infrastructure changes are included.

## Responsive design and verification

CSS is authored in `styles/` and compiled by `npm run build` into the versioned
`public/*.css` files. Shared tokens and named breakpoint conditions are defined in
`styles/tokens.json`; see [the responsive design standards](docs/responsive-design-system.md)
for component usage, approved exceptions and baseline-review policy.

Run `npm test` for functional/security/build checks. With the documented Chromium
and fonts installed, run `npm ci && npm run test:responsive` for all eight pages at
all eight viewport widths. CI requires both checks before GitHub Pages publication.
Use `npm run test:visual:update` only for a deliberately reviewed visual change.
