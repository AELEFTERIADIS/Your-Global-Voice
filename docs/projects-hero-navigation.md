# Projects hero and cause-category panels

The approved hero artwork, its 1672 × 941 canvas, full container width, height,
imagery, smaller icons, alignment, spacing and gold dividers are unchanged.
Only the four hero labels now read Justice, Compassion, Protection and
Nature in the existing order. A clipped overlay replaces just their four
text rectangles; the approved base PNG remains byte-identical, so no icon or
other hero artwork is replaced. The overlay scales with the original canvas.
The hero links use the new labels and retain the same cause destinations.
Official cause names and all content below the hero are unchanged. Its four
native, keyboard-accessible links now point directly to real panels underneath
**Explore Our Projects**. No JavaScript is needed for these fragment links.

| Panel label | Existing cause identity and panel ID | Explore Projects action |
| --- | --- | --- |
| Human Rights & Dignity | `human-rights-dignity` / `projects-human-rights-dignity` | Goes to the single existing Voices for Dignity project |
| Humanitarian Assistance & Relief | `humanitarian-assistance` / `projects-humanitarian-assistance` | Native disclosure explains that no projects are published yet |
| Animal Welfare | `animal-welfare` / `projects-animal-welfare` | Native disclosure explains that no projects are published yet |
| Environmental Protection | `environmental-conservation` / `projects-environmental-conservation` | Native disclosure explains that no projects are published yet |

The cards preserve the four existing cause identities and the single existing
project. The approved heading, divider and hero are unchanged. White cards with
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

- Explore Projects goes to Voices for Dignity or opens a native disclosure for a
  cause with no published project, including the existing contact destination.
- Support This Cause goes to `donate.html#giving-heading`, the existing giving
  arrangements. This does not claim to preselect a cause in the generic checkout,
  create a donation form, or enable the test ledger/checkout.
- Send a Message goes to `contact.html#message-heading`, the existing form.

The gold/navy wave closes the category cards before the unchanged Voices for
Dignity section. The uploaded reference is explicitly included in the existing
Pages artifact allowlist and local preview server.

Panel and project-heading targets accept keyboard focus and have a scroll margin
for the existing header. Native links, focus outlines, 44px actions and native
summary/disclosure behavior work without introducing new payment forms, remote
calls or a new navigation script. The existing hero fallback module remains as
a safeguard if a category is ever unavailable; it is inactive for all four
current targets because their panels exist at page load.

Tests cover unique IDs and cause identities, direct hero fragment links, all four
matching icons/actions, native empty-category feedback, and a single preserved
Voices for Dignity project/payment panel. Existing payment tests remain in the
full suite. Desktop, tablet and mobile browser checks verify responsive layout,
keyboard navigation, disclosure actions, target focus, overflow and unchanged
hero dimensions.
