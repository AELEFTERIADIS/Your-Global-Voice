import { renderProjectCategories } from './project-categories.mjs';

export function renderProjectsOverview() {
 return `<section class="project-initiatives" aria-labelledby="project-initiatives-heading">
<h2 id="project-initiatives-heading"><span>Explore Our Projects</span></h2>
${renderProjectCategories()}
</section>`;
}
