import { renderProjectCategories } from './project-categories.mjs';

// The legacy target preserves existing card links without publishing the old
// project donation box. Its renderer and payment integrations remain retained.
export function renderProjectsOverview() {
  return `<section class="project-initiatives" aria-labelledby="project-initiatives-heading">
<h2 id="project-initiatives-heading"><span>Explore Our Projects</span></h2>
${renderProjectCategories()}
</section><section class="projects-future" id="project-dignity-heading" aria-labelledby="projects-future-heading" tabindex="-1">
<div class="projects-future-panel">
<h2 id="projects-future-heading"><svg class="projects-unity-icon" viewBox="0 0 48 32" aria-hidden="true" focusable="false"><g fill="#1884b9"><circle cx="24" cy="6" r="5"/><path d="M15 23v-5a9 9 0 0 1 18 0v5Z"/></g><g fill="#f5c535"><circle cx="11" cy="10" r="4"/><circle cx="37" cy="10" r="4"/><path d="M2 25v-5a8 8 0 0 1 15-4v8ZM31 24v-8a8 8 0 0 1 15 4v5Z"/><path d="M1 32c12-12 27-5 46-8-11 12-26 1-46 8Z"/></g></svg><span>Shape Our Future Together</span></h2>
<p class="projects-future-copy"><span class="projects-future-copy-line">From active projects to developing initiatives and future plans,</span> <span class="projects-future-copy-line">Your Global Voice welcomes your ideas and participation</span> <span class="projects-future-copy-line">in creating meaningful change for a better world.</span></p>
<p class="projects-future-motto">My Voice + Your Voice = Our Voice</p>
<svg class="projects-future-swash" viewBox="0 0 500 30" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 28C160-35 300 68 500 5C340 58 205-1 0 28Z" fill="#f3c438"/></svg>
</div>
<div class="projects-future-scene"><svg class="projects-future-landscape" aria-hidden="true" viewBox="1245 0 800 565" preserveAspectRatio="xMidYMid slice" focusable="false"><defs><clipPath id="future-landscape-crop"><path d="M1450 0H2128V565H850C1110 530 1175 460 1230 350C1310 180 1360 70 1450 0Z"/></clipPath><clipPath id="future-reference-edge"><rect x="1" y="1" width="2126" height="563" rx="30"/></clipPath><clipPath id="future-original-control-area"><rect x="1354" y="410" width="514" height="97" rx="48"/></clipPath><mask id="future-landscape-no-controls" maskUnits="userSpaceOnUse" x="0" y="0" width="2128" height="565"><rect width="2128" height="565" fill="white"/><rect x="1354" y="410" width="514" height="97" rx="48" fill="black"/></mask></defs><g clip-path="url(#future-reference-edge)"><g clip-path="url(#future-original-control-area)"><svg x="1354" y="410" width="514" height="97" viewBox="1354 510 514 55" preserveAspectRatio="none"><image href="11111111(1).png" x="-22" y="-78" width="2172" height="724"/></svg></g><image href="11111111(1).png" x="-22" y="-78" width="2172" height="724" clip-path="url(#future-landscape-crop)" mask="url(#future-landscape-no-controls)"/></g></svg><svg class="projects-future-divider" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 0H100C60 25 35 70 0 100Z" fill="#f3c438"/><path d="M0 0H82C42 25 20 70 0 96Z" fill="#01213f"/></svg><a class="projects-future-action" href="contact.html#message-heading">Share Your Ideas <span aria-hidden="true">&rarr;</span></a></div>
</section>`;
}
