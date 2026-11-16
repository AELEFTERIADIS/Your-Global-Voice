import {renderProjectsReferenceArtwork} from './projects-reference-artwork.mjs';
import { renderProjectCategories } from './project-categories.mjs';

export function renderProjectsOverview() {
 return `<section class="project-initiatives" aria-labelledby="project-initiatives-heading">
<h2 id="project-initiatives-heading"><svg class="projects-intro-sprig" viewBox="0 0 55 55" aria-hidden="true"><path d="M4 49Q29 33 49 6" fill="none" stroke="#23771E" stroke-width="2"/><path d="M14 43Q-1 31 3 22q18 2 19 14M27 32Q9 19 16 10q17 7 17 16M39 20Q26 5 33 0q15 6 13 14M17 41q17-18 27-8-10 12-27 8M32 27q12-18 22-10-8 12-22 10" fill="#21801D"/></svg><span class="projects-current-heading">Explore Our Projects</span><span class="projects-approved-heading">Making a Difference Where It Matters Most</span><svg class="projects-intro-sprig" viewBox="0 0 55 55" aria-hidden="true"><path d="M4 49Q29 33 49 6" fill="none" stroke="#23771E" stroke-width="2"/><path d="M14 43Q-1 31 3 22q18 2 19 14M27 32Q9 19 16 10q17 7 17 16M39 20Q26 5 33 0q15 6 13 14M17 41q17-18 27-8-10 12-27 8M32 27q12-18 22-10-8 12-22 10" fill="#21801D"/></svg></h2><p class="projects-approved-introduction">Our projects turn compassion into real action. We create and support practical initiatives that protect rights, provide assistance, care for animals, and safeguard our planet.</p>
${renderProjectsReferenceArtwork('8 630 1008 40','projects-intro-cards-wave')}
${renderProjectCategories()}
</section>`;
}
