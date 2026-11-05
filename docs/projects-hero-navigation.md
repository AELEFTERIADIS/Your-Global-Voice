# Projects hero and cause-category panels

The approved hero artwork, its 1672 × 941 canvas, full container width, height,
imagery, smaller icons, alignment, spacing and gold dividers are unchanged.
Only the four hero labels now read Justice, Compassion, Protection and
Nature in the existing order. A clipped overlay replaces just their four
text rectangles; the approved base PNG remains byte-identical, so no icon or
other hero artwork is replaced. The overlay scales with the original canvas.
The hero links use the new labels and retain the same cause destinations.
Official cause names and the four cards are unchanged. Its four
native, keyboard-accessible links now point directly to real panels underneath
**Explore Our Projects**. No JavaScript is needed for these fragment links.

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
gold accent and prominent gold motto are native HTML/SVG. The original approved upload, `public/ChatGPT Image Nov 5, 2026,
05_43_26 PM.png` from commit `52113a9`, supplies only the clipped landscape and
gold curve. Its white margins and all embedded text are outside the photo clip;
a mask also excludes its embedded button. The original source file remains
unmodified (Git blob `e0b889b94fd5da4c3c90944af655edb02e876244`).
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

### Desktop line-fit correction

Desktop heading and gold motto stay on one line, using sizes based on the
banner container rather than the viewport. The content area uses 68% of the
banner width, with all rendered text checked to stay clear of the gold curve.
The unchanged paragraph has three desktop lines: the first ends in “plans,”,
the second ends in “participation”, and the third is shortest and ends in
“world.” Below 60rem, the spans become inline text and wrap naturally.
The gold contact action has a defined border, shadow, navy lettering and a
visible bottom gap (28–36px at the verified desktop sizes; 24px on mobile).
Actual desktop screenshots at 1024, 1280, 1440 and 1920px were checked against
the approved reference, including a same-width visual comparison.
