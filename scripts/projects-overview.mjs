import { renderProjectCategories } from './project-categories.mjs';

// The legacy target preserves existing card links without publishing the old
// project donation box. Its renderer and payment integrations remain retained.
export function renderProjectsOverview() {
  return `<section class="project-initiatives" aria-labelledby="project-initiatives-heading">
<h2 id="project-initiatives-heading"><span>Explore Our Projects</span></h2>
${renderProjectCategories()}
</section><section class="projects-future" id="project-dignity-heading" aria-labelledby="projects-future-heading" tabindex="-1">
<div class="projects-future-scene" aria-hidden="true"><svg class="projects-future-landscape" viewBox="0 0 2074 624" preserveAspectRatio="none" focusable="false"><defs><clipPath id="future-landscape-crop"><path d="M1425 0Q1375 35 1363 65Q1320 125 1296 165Q1268 225 1248 265Q1227 322 1204 365Q1185 425 1137 465Q1086 530 1001 565Q925 605 833 624H2074V0Z"/></clipPath><clipPath id="future-reference-edge"><rect x="1" y="1" width="2072" height="622" rx="27"/></clipPath><mask id="future-landscape-no-controls" maskUnits="userSpaceOnUse" x="0" y="0" width="2074" height="624"><rect width="2074" height="624" fill="white"/><rect x="1368" y="468" width="542" height="94" rx="47" fill="black"/></mask></defs><g clip-path="url(#future-reference-edge)"><image href="ChatGPT Image Nov 5, 2026, 05_43_26 PM.png" x="-35" y="-35" width="2145" height="733" clip-path="url(#future-landscape-crop)" mask="url(#future-landscape-no-controls)"/></g></svg></div>
<div class="projects-future-panel">
<h2 id="projects-future-heading"><svg class="projects-unity-icon" viewBox="0 0 48 32" aria-hidden="true" focusable="false"><g fill="#1884b9"><circle cx="24" cy="6" r="5"/><path d="M15 23v-5a9 9 0 0 1 18 0v5Z"/></g><g fill="#f5c535"><circle cx="11" cy="10" r="4"/><circle cx="37" cy="10" r="4"/><path d="M2 25v-5a8 8 0 0 1 15-4v8ZM31 24v-8a8 8 0 0 1 15 4v5Z"/><path d="M1 32c12-12 27-5 46-8-11 12-26 1-46 8Z"/></g></svg><span>Shape Our Future Together</span></h2>
<p class="projects-future-copy"><span class="projects-future-copy-line">From active projects to developing initiatives and future plans,</span> <span class="projects-future-copy-line">Your Global Voice welcomes your ideas and participation</span> <span class="projects-future-copy-line">in creating meaningful change for a better world.</span></p>
<p class="projects-future-motto">My Voice + Your Voice = Our Voice</p>
</div><a class="projects-future-action" href="contact.html#message-heading">Share Your Ideas <span aria-hidden="true">&rarr;</span></a>
</section>`;
}
