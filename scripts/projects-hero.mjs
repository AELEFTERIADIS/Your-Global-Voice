// Reuse the existing four cause identities; these are navigation labels only.
export const projectHeroCauses=Object.freeze([
 {id:'human-rights-dignity',label:'Human Rights & Dignity'},
 {id:'humanitarian-assistance',label:'Humanitarian Aid'},
 {id:'animal-welfare',label:'Animal Welfare'},
 {id:'environmental-conservation',label:'Environmental Protection'}
].map(cause=>Object.freeze(cause)));
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;');

export function renderProjectsHero() {
 return `<section class="page-intro projects-hero"><h1 class="projects-hero-title">Our Projects</h1><div class="projects-hero-frame"><img class="projects-hero-image" src="2E318DBA-71A7-4D42-9FC2-5E723868F9CC.png" width="1672" height="941" alt="Our Projects. Every Action Matters, Every Life Deserves Dignity." fetchpriority="high" decoding="async"><nav class="projects-hero-causes" aria-label="Project causes">${projectHeroCauses.map(cause=>`<a class="projects-hero-cause" href="#projects-${cause.id}" data-cause-target="projects-${cause.id}" data-cause-label="${escape(cause.label)}" aria-label="${escape(cause.label)} projects"></a>`).join('')}</nav></div><dialog class="projects-cause-notice" aria-labelledby="projects-cause-notice-title"><h2 id="projects-cause-notice-title">Project category</h2><p class="projects-cause-notice-copy"></p><div class="projects-cause-notice-actions"><a href="#project-initiatives-heading">View current projects</a><button type="button">Close</button></div></dialog></section>`;
}
