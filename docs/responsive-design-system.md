# Responsive design system

## Audit and controlled implementation plan

Baseline: `1f0dc3d` (all eight published pages). Content, navigation, payment URLs,
form validation, contact security, photos, and approved component designs are locked.

Findings:

- `public/styles.css` contains two generations of hero, introductory panel, header,
  footer, notice and content-panel declarations; later rules silently win.
- The phone menu block is duplicated for portrait tablets. The footer has obsolete
  grid declarations below a later approved flex layout.
- Gold is defined twice; `#9b7428` is the effective page accent. Header/footer use
  the separately approved `#D7B56D` and `#102B49` palette.
- Gold panel borders and padding repeat in Mission, About and Contact. Identical
  dimensions should share tokens, without flattening intentionally different cards.
- Breakpoints (42, 56, 64 and 65rem) are copied through CSS and About JavaScript.
  They describe different component needs, not four competing device definitions.
- About has superseded spacing and overlay declarations. Its image height follows a
  specific sentence using ResizeObserver: an approved content-aware exception.
- Donate preserves a specialized hero crop and payment-control layout. Its legacy
  motto footprint and optical alignment are explicit exceptions, not patterns for
  new components. Changing them would change approved payment-page geometry.
- Mission already uses content-sized grid/subgrid rows and natural stacked images;
  preserve their measured desktop dimensions and existing responsive behavior.
- The current 40 tests cover generated pages, routing, forms, security and payments,
  but do not run real browser layout checks or screenshot comparisons in CI.

Affected implementation files: `styles/tokens.json`, `styles/*.css`,
`scripts/build-styles.mjs`, `scripts/build.mjs`, generated `public/*.css`,
`public/about.js` (breakpoint lookup only), `package.json`/lockfile,
`playwright.config.mjs`, `tests/visual/*`, `test/design-system.test.mjs`,
`.github/workflows/pages.yml`, and this document. No content changes are planned.

## Standards

- Main/header container: 78rem maximum; 1.5rem side gutters, 1rem on phones.
- Spacing scale: .25, .5, .75, 1, 1.5, 2, 3 and 4rem. Existing compact sections
  use 1.5rem; editorial sections use 3–4rem. Use semantic tokens, not new offsets.
- Standard panel: thin muted-gold border, 2px gold top rule, cream background,
  fluid 1.5–3rem padding; compact phone/tablet panel padding 1–1.5rem.
- Cards: existing 1.25–2.25rem fluid padding and 1.5rem grid gap.
- Typography: Arial body, Georgia editorial headings; existing responsive heading
  clamps and 1.75 paragraph line height. Preserve licensed footer typography.
- Photos: .5rem corners, natural proportions; use the approved landscape ratio
  only for components already cropped that way. Payment hero retains .75rem.
- Controls: minimum 44px touch target; primary buttons minimum 48px,
  1rem × 1.5rem padding. Wrap action groups before controls overflow.
- Layouts: `minmax(0, 1fr)`, content-sized rows, no fixed section heights. Mission
  keeps desktop image-left/text-right and image-first stacking below 64rem.

## Breakpoints and authoring

`styles/tokens.json` is the single source of truth for CSS variables and named media
queries. Author CSS in `styles/`; `npm run build` generates browser-ready files in
`public/`. Do not edit generated CSS. `@media (--phone)` and other named conditions
are expanded at build time: CSS custom properties cannot be used in media queries.
The generated CSS also exposes breakpoint variables for JavaScript.

- Phone: <=42rem (672px), normal phone stacking and About collapsed behavior.
- Compact navigation/forms: <=56rem (896px).
- Stacked editorial layout: <=64rem (1024px).
- Header wrapping: <=65rem (1040px).
- Other named media conditions preserve narrow payment/footer fit thresholds and
  reduced-motion preferences. Do not reuse page-specific fit thresholds generally.

New pages inherit shared containers, typography, cards and buttons automatically.
Reuse `.page-intro`, `.card-grid`, `.card`, `.split-section`, `.callout` and shared
panel tokens rather than copying page-specific overrides. Page styles only express
intentional composition or documented exceptions. Keep new layout rows content-sized.

## Verification and baseline review

The browser suite covers every page at 320, 375, 390, 430, 768, 1024, 1280 and
1440px. It checks overflow, clipped text, image geometry, containers, grid spacing,
button boundaries, navigation, About expansion, and form/payment state changes
without sending messages or opening payment services.

Full-page screenshots, including About expanded states and mobile menus, are
compared with committed baselines. Automatic geometry checks cannot judge whether
whitespace or a visual change is appropriate: inspect full-page comparisons and
CI difference artifacts. Never accept baseline changes merely to make CI green.
Baseline updates must be reviewed with the implementation by a human reviewer.
CI does not update baselines and blocks publication on visual or layout failures.

### Reproducible browser environment

`npm ci && npm run test:responsive` uses `/usr/bin/chromium` (override with
`CHROMIUM_PATH` only when deliberately refreshing the browser baseline).
CI uses Debian trixie and its immutable Snapshot binary archive for Chromium **154.0.8037.57**, Liberation **2.1.5**, Noto Core
**20201225**, and DejaVu **2.37**. `fontconfig.conf` fixes platform fallback names
for Arial, Georgia and Times New Roman to these fonts, without changing website
font declarations. Footer webfonts are loaded from the built artifact. Browser/font
upgrades are explicit baseline-review changes, not unpinned screenshot drift.

`npm run test:visual:update` is a deliberate local baseline authoring command.
CI only compares; it never updates. The workflow checks changed baseline files for
human approval of the current PR revision, including changes pushed via a merged
PR. Review the diff report, approve, and re-run the workflow. The only bootstrap
exception is the first addition preserving the published design at `1f0dc3d`.
`CODEOWNERS` requests the website owner's review for design and baseline changes;
GitHub branch protection remains repository administration policy.

Layout checks are engineering checks, not a replacement for human judgment about
whitespace, cropping or hierarchy. The PNG threshold permits antialiasing noise
(0.1% of pixels at a 0.2 channel threshold), not intentional design changes.
Screenshots include the entire page, expanded About text, monthly donation state,
and open responsive navigation. No request can reach the live inbox or payment
provider from the browser tests; contact status is a test-local mock.

### Remaining intentional component exceptions

- About preserves its sentence-aligned desktop image height, 82.5% overlay
  placement, inline desktop toggle, compact paragraph typography on phones, and
  approved .75rem transition to Foundation. These are content/design requirements.
- Mission retains the approved image-width formula and landscape crop for the
  closing photo on desktop. Stacked photographs keep natural proportions.
- Donate retains its optical headline correction, desktop motto footprint and
  hero alignment, payment-specific controls, natural form sizing, approved image
  crop, and payment anchor offset. No provider URL, amount, currency, submission
  destination, verification or consent behavior changes in this refactor.
- Header/footer retain their approved palette, local fonts, and compact five/three
  navigation arrangement with explicit narrow-width fit variants.

Removed Donate phone footprint variables were ineffective: below 56rem the final
rule already sets the motto minimum height to zero. Desktop optical exceptions
remain explicitly scoped and are not reusable layout standards.

### Token reference

| Area | Shared defaults |
| --- | --- |
| Content | `--content-max`: 78rem; `--page-gutter`: 1.5rem / 1rem on phones |
| Rhythm | `--space-xs` through `--space-4xl`: .25, .5, .75, 1, 1.5, 2, 3, 4rem |
| Sections | `--section-gap`: 1.5rem; `--section-space`: 4rem editorial tier |
| Panels/cards | `--panel-padding`: fluid 1.5–3rem; compact 1–1.5rem; cards 1.25–2.25rem |
| Grids | `--grid-gap`: 1.5rem; `--split-gap`: 4rem; Mission: approved 1.5rem columns |
| Typography | `--font-body`, `--font-heading`, `--font-editorial`; responsive heading clamps; `--body-leading`: 1.75 |
| Photographs | `--image-radius`: .5rem; `--landscape-ratio`: 1672/941; payment hero: .75rem and 4/3 |
| Borders | `--rule-width`: 1px; `--accent-width`: 2px; `--card-accent-width`: 3px; muted gold panel/section rules |
| Buttons | `--button-height`: 48px; `--touch-target`: 44px; padding 1rem × 1.5rem |

Page-specific dimensions are intentionally kept out of global defaults. Prefer
shared tokens; document any new exception with its design reason and browser test.

The baseline browser is installed by `scripts/install-visual-browser.py` from the
version-specific Debian Snapshot API. Its content-addressed SHA1 is verified and
the Debian package version is checked before installation; SHA256 is logged for
review. This preserves the exact browser after current mirrors retire older
packages. Installation runs only in the disposable CI container, not the website.
