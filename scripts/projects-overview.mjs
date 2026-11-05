import { renderProjectCategories } from './project-categories.mjs';

// The legacy target preserves existing card links without publishing the old
// project donation box. Its renderer and payment integrations remain retained.
export function renderProjectsOverview() {
  return `<section class="project-initiatives" aria-labelledby="project-initiatives-heading">
<h2 id="project-initiatives-heading"><span>Explore Our Projects</span></h2>
${renderProjectCategories()}
</section><section class="projects-future" id="project-dignity-heading" aria-labelledby="projects-future-heading" tabindex="-1">
<svg class="projects-future-curve" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 0H72C64 25 65 74 57 88C54 95 51 98 46 100H0Z" fill="#f3c438"/><path d="M0 0H70C62 25 63 74 55 88C52 95 49 98 44 100H0Z" fill="#06243f"/></svg>
<div class="projects-future-panel">
<h2 id="projects-future-heading"><svg class="projects-unity-icon" viewBox="0 0 48 32" aria-hidden="true" focusable="false"><g fill="#1884b9"><circle cx="24" cy="6" r="5"/><path d="M15 23v-5a9 9 0 0 1 18 0v5Z"/></g><g fill="#f5c535"><circle cx="11" cy="10" r="4"/><circle cx="37" cy="10" r="4"/><path d="M2 25v-5a8 8 0 0 1 15-4v8ZM31 24v-8a8 8 0 0 1 15 4v5Z"/><path d="M1 32c12-12 27-5 46-8-11 12-26 1-46 8Z"/></g></svg><span>Shape Our Future Together</span></h2>
<p class="projects-future-copy">From active projects to developing initiatives and future plans, Your Global Voice welcomes your ideas and participation in creating meaningful change for a better world.</p>
<p class="projects-future-motto">My Voice + Your Voice = Our Voice</p>
</div><div class="projects-future-scene"><a class="projects-future-action" href="contact.html#message-heading">Share Your Ideas <span aria-hidden="true">&rarr;</span></a></div>
</section>`;
}
