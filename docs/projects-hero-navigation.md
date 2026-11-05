# Projects hero cause navigation

The hero keeps its original 1672 × 941 canvas, full container width and natural
height. Only the four icon/label groups are reduced to 80% of their prior size,
centered in their existing columns. The photographs, heading, motto, dividers,
gold bands and all pixels outside those four areas are unchanged.

`scripts/projects-hero.mjs` renders four native, labelled links over the artwork.
Their hit areas scale with the image and retain a minimum height of 44px. The
links have visible keyboard focus, follow the artwork's left-to-right order,
and do not duplicate the cause labels in the image's accessibility description.

The existing Projects page does not yet contain dedicated cause-category
sections. No empty or duplicate category sections are introduced. Until a real
destination exists, each link has a valid native fallback to the current
`#project-initiatives-heading` listing. With JavaScript/dialog support it explains
that the selected cause section is pending in one shared accessible dialog.
Escape or Close restores focus; View current projects focuses and reveals the
existing listing. Without JavaScript/dialog support, normal fragment navigation
still works. Modified clicks keep normal browser behavior.

When real category sections are approved, use these unique IDs. The separate
`projects-hero.js` module detects them at page load and makes the corresponding
hero link navigate directly, without the pending-category dialog:

| Existing cause identity | Future Projects section ID |
| --- | --- |
| `human-rights-dignity` | `projects-human-rights-dignity` |
| `humanitarian-assistance` | `projects-humanitarian-assistance` |
| `animal-welfare` | `projects-animal-welfare` |
| `environmental-conservation` | `projects-environmental-conservation` |

These are the existing four causes, not new donation designations. No registry,
project payment controls, checkout code, credentials or Worker changes are needed.
The hero module has no network or payment calls.

Validation includes unit tests for unique identities, valid native fragments,
pending notices, existing destinations and fallback behavior; the full 102-test
repository suite passes. Offline Chromium checks at 1440px, 390px and 320px verify
container alignment, aspect ratio, absence of horizontal overflow, minimum hit
areas, Tab order, focus outlines, Enter activation, Escape and focus restoration.
