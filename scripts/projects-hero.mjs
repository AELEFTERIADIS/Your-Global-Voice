// Reuse the existing four cause identities; these are navigation labels only.
export const projectHeroCauses=Object.freeze([
 {id:'human-rights-dignity',label:'Justice'},
 {id:'humanitarian-assistance',label:'Compassion'},
 {id:'animal-welfare',label:'Protection'},
 {id:'environmental-conservation',label:'Nature'}
].map(cause=>Object.freeze(cause)));
// Recompose vertical whitespace in the artwork; preserve its native aspect ratio.
export const projectHeroArtwork=Object.freeze({src:'projects-hero-compact.webp',width:1774,height:887});
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;');

export function renderProjectsHero() {
 return `<section class="page-intro projects-hero"><h1 class="projects-hero-title">Our Projects</h1><div class="projects-hero-frame"><img class="projects-hero-image" src="${projectHeroArtwork.src}" width="${projectHeroArtwork.width}" height="${projectHeroArtwork.height}" alt="Our Projects. Every Action Matters, Every Life Deserves Dignity." fetchpriority="high" decoding="async"><nav class="projects-hero-causes" aria-label="Project causes">${projectHeroCauses.map(cause=>`<a class="projects-hero-cause" href="#projects-${cause.id}" data-cause-target="projects-${cause.id}" data-cause-label="${escape(cause.label)}" aria-label="${escape(cause.label)} projects"></a>`).join('')}</nav></div><dialog class="projects-cause-notice" aria-labelledby="projects-cause-notice-title"><h2 id="projects-cause-notice-title">Project category</h2><p class="projects-cause-notice-copy"></p><div class="projects-cause-notice-actions"><a href="#project-initiatives-heading">View current projects</a><button type="button">Close</button></div></dialog></section>`;
}
