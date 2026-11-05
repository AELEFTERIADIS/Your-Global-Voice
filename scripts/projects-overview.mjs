import { renderProjectCategories } from './project-categories.mjs';

// The legacy target preserves existing card links without publishing the old
// project donation box. Its renderer and payment integrations remain retained.
export function renderProjectsOverview() {
  return `<section class="project-initiatives" aria-labelledby="project-initiatives-heading">
<h2 id="project-initiatives-heading"><span>Explore Our Projects</span></h2>
${renderProjectCategories()}
</section><section class="projects-future" id="project-dignity-heading" aria-labelledby="projects-future-heading" tabindex="-1">
<h2 id="projects-future-heading"><svg class="projects-unity-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="16" cy="7" r="3"/><path d="M10 22v-5a6 6 0 0 1 12 0v5"/><g stroke="#b1842a"><circle cx="6" cy="12" r="2.5"/><circle cx="26" cy="12" r="2.5"/><path d="M2 25v-5a4 4 0 0 1 7-2m21 7v-5a4 4 0 0 0-7-2M6 28l5 2 5-4 5 4 5-2"/></g></svg><span>Shape Our Future Together</span></h2>
<div class="projects-future-panel">
<p class="projects-future-copy">From active projects to developing initiatives and future plans, Your Global Voice welcomes your ideas and participation in creating meaningful change for a better world.</p>
<p class="projects-future-motto">My Voice + Your Voice = Our Voice.</p>
<a class="projects-future-action" href="contact.html#message-heading">Share Your Ideas</a>
</div></section>`;
}
