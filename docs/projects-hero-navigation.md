# Projects hero and cause-category panels

The hero uses a vertically recomposed, lossless 1774 × 887 WebP at its native
2:1 aspect ratio. At the same full container width this reduces its height by
approximately 11% compared with the original 1672 × 941 canvas. The original
PNG remains byte-identical. The compact artwork retains the four scenes,
heading, motto, icons, gold dividers and labels: Justice, Compassion, Protection
and Nature. The image scales uniformly without CSS cropping or distortion.
The four native, keyboard-accessible links retain their cause destinations;
their hit areas follow the compact icon row. Official cause names and cards
are unchanged. These links point directly to the real panels underneath
**Explore Our Projects**, without JavaScript.

| Panel label | Existing cause identity and panel ID | Explore Projects action |
| --- | --- | --- |
| Human Rights & Dignity | `human-rights-dignity` / `projects-human-rights-dignity` | Goes to Shape Our Future Together through the retained destination anchor |
| Humanitarian Assistance & Relief | `humanitarian-assistance` / `projects-humanitarian-assistance` | Native disclosure explains that no projects are published yet |
| Animal Welfare | `animal-welfare` / `projects-animal-welfare` | Native disclosure explains that no projects are published yet |
| Environmental Protection | `environmental-conservation` / `projects-environmental-conservation` | Native disclosure explains that no projects are published yet |

The cards preserve the four existing cause identities and their approved copy. The approved heading, divider and hero are unchanged. White cards with
gold borders use a two-column desktop grid and stack below 56rem. Three actions
stack within each card below 30rem, keeping targets at least 44px tall.

Each card has a decorative SVG icon, curved gold photo edge, gold heading accent,
and selectable HTML description. The Humanitarian Assistance description uses
the exact approved wording. The photo source is the original repository upload,
`public/Explore Our Impact Projects (1).png` (Git blob
`796c39d3493e5905e9a2b5ac23074e2607c35f9f`). The file is unmodified: inline SVG
viewports and clip paths reveal only its four photo regions and curved gold
edges. All titles, descriptions and actions remain separate HTML/SVG content,
so the reference's embedded wording and buttons are not used as interface text.
The previously recreated WebP is no longer referenced or published in the Pages
artifact. Proportional photo cropping adapts to each card's available space.

- Explore Projects goes to Shape Our Future Together or opens a native disclosure for a
  cause with no published project, including the existing contact destination.
- Support This Cause goes to `donate.html#giving-heading`, the existing giving
  arrangements. This does not claim to preselect a cause in the generic checkout,
  create a donation form, or enable the test ledger/checkout.
- Send a Message goes to `contact.html#message-heading`, the existing form.

The gold/navy wave closes the category cards before Shape Our Future Together. The uploaded reference is explicitly included in the existing
Pages artifact allowlist and local preview server.

Panel and project-heading targets accept keyboard focus and have a scroll margin
for the existing header. Native links, focus outlines, 44px actions and native
summary/disclosure behavior work without introducing new payment forms, remote
calls or a new navigation script. The existing hero fallback module remains as
a safeguard if a category is ever unavailable; it is inactive for all four
current targets because their panels exist at page load.

Tests cover unique IDs and cause identities, direct hero fragment links, all four
matching icons/actions, native empty-category feedback, and the new invitation
panel. The old project renderer and approved copy remain tested but unpublished. Existing payment tests remain in the
full suite. Desktop, tablet and mobile browser checks verify responsive layout,
keyboard navigation, disclosure actions, target focus, overflow and unchanged
hero dimensions.

## Shape Our Future Together

The former Voices for Dignity section and separate donation box are no longer
rendered on Projects. Shape Our Future Together is one rounded, full-width navy
and gold banner aligned exactly with the cards and closing sunset. No white
frame, padding or blank border from the visual reference surrounds the banner.
Normal page margins and inter-section spacing remain shared with its neighbors.

The heading, three-person unity icon, unchanged approved paragraph, vertical
gold accent and prominent gold motto are native HTML/SVG. The original approved upload, `public/11111111(1).png` from commit `7e1a5d4`, supplies only the clipped landscape and
gold curve. Its white margins and all embedded text are outside the photo clip;
a mask also excludes its embedded button. The original source file remains
unmodified (Git blob `749e12f0807324a348e5f71413759c7d03671219`).
The entire reference is never used as a banner background or interface. The
three balanced desktop paragraph lines retain the previously approved wording. The gold Share Your Ideas link is positioned beneath the sun in the
right landscape area and uses the existing `contact.html#message-heading` form.
On mobile, text sits above the landscape and button without horizontal overflow.
All lettering is upright, with visible keyboard focus and at least 48px action
height. Browser checks verify alignment, clipping, button hit testing and native
navigation at 1440, 1024, 390 and 320 pixel widths.

The legacy `project-dignity-heading` target stays on the focusable replacement
panel so the unchanged Human Rights card still has a working destination.
`content/project-dignity.json`, `scripts/project-dignity.mjs`, `public/projects.js`
and all Worker/payment integrations are retained. With no `.project-giving`
element, the retained frontend payment module makes no checkout requests.

### Layout and latest approved reference

The banner uses separate 60%/40% desktop grid columns. Text occupies reserved
navy space; the curve, original softer sunset and native contact action stay
inside the landscape column. The heading and gold motto remain single-line on
desktop, with the motto smaller, and paragraph lines end in “plans,”,
“participation”, and “world.” The third line is shortest. Mobile text wraps
naturally above the landscape, with no overlap or clipping.

The approved upload is named `public/11111111(1).png` (eight ones), rather than
the seven-one filename in the request. Its outer white frame and separate gold
mark above the banner are excluded. Only the photo is rendered from the upload;
its embedded control is masked and the small obscured patch is filled from a
forest-only region of that same source. All text, unity icon, gold accent,
motto underline and contact action are separate HTML/SVG. No cursor illustration
is rendered: the real link uses a pointer cursor and subtle gold hover feedback.

Typography and the shorter 2128:565 banner proportions follow the latest
reference. The overall width, rounded corners, contact destination, all other
sections and all payment integrations are preserved. Actual screenshots at
1440, 1024, 768 and 390px are inspected against the reference before commit;
browser checks cover line counts, text clearance, bounds, button placement,
keyboard focus, pointer cursor, click hit testing and overflow.
