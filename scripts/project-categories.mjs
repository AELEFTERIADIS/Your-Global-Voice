// These are the existing cause identities, not additional projects or payments.
export const projectCategories=Object.freeze([
 {id:'human-rights-dignity',label:'Human Rights & Dignity',icon:'scales',project:'project-dignity-heading'},
 {id:'humanitarian-assistance',label:'Humanitarian Assistance & Relief',icon:'hand-heart'},
 {id:'animal-welfare',label:'Animal Welfare',icon:'paw'},
 {id:'environmental-conservation',label:'Environmental Protection',icon:'leaf'}
].map(category=>Object.freeze(category)));
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;');
const paths={
 scales:'<path d="M24 6v34M10 14h28M17 42h14M12 14 4 30h16l-8-16Zm24 0-8 16h16l-8-16Z"/><path d="M4 30a8 8 0 0 0 16 0m8 0a8 8 0 0 0 16 0"/><circle cx="24" cy="11" r="3"/>',
 'hand-heart':'<path d="M25 24c-4-3-11-7-11-13a7 7 0 0 1 12-4 7 7 0 0 1 12 4c0 6-8 11-13 14Z"/><path d="m4 33 8-8h10a4 4 0 0 1 0 8h-6m9-3 10-6a4 4 0 0 1 5 6L24 41H12l-8-8Z"/>',
 paw:'<ellipse cx="11" cy="15" rx="4" ry="6"/><ellipse cx="20" cy="10" rx="4" ry="6"/><ellipse cx="30" cy="10" rx="4" ry="6"/><ellipse cx="39" cy="16" rx="4" ry="6"/><path d="M12 33c0-7 6-15 12-15s13 8 13 15c0 5-4 8-8 6-3-2-6-2-10 0-4 2-7-1-7-6Z"/>',
 leaf:'<path d="M23 40C18 22 25 9 43 5c-1 20-6 30-20 30M23 40C18 28 9 27 5 14c14 0 22 6 20 16M23 40 36 15M23 33 12 21"/>'
};
export function renderProjectCategories() {
 return `<div class="project-cause-panels">${projectCategories.map(category=>{
  const label=escape(category.label);
  const action=`Explore Projects <span aria-hidden="true">&rarr;</span>`;
  return `<article class="project-cause-panel" id="projects-${category.id}" aria-labelledby="projects-${category.id}-title" tabindex="-1"><svg class="project-cause-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[category.icon]}</svg><h3 id="projects-${category.id}-title">${label}</h3>${category.project?`<a class="project-cause-action" href="#${category.project}" aria-label="Explore ${label} projects">${action}</a>`:`<details class="project-cause-empty"><summary class="project-cause-action" aria-label="Explore ${label} projects">${action}</summary><p>There are no published projects for this cause yet.</p></details>`}</article>`;
 }).join('')}</div>`;
}
