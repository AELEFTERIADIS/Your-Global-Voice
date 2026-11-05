// Reuse the existing four cause identities; these are navigation labels only.
export const projectHeroCauses=Object.freeze([
 {id:'human-rights-dignity',label:'Justice'},
 {id:'humanitarian-assistance',label:'Compassion'},
 {id:'animal-welfare',label:'Protection'},
 {id:'environmental-conservation',label:'Sustainability'}
].map(cause=>Object.freeze(cause)));
// Only these text rectangles may be replaced. The approved base image keeps
// every icon, divider, photograph and all other hero pixels unchanged.
export const projectHeroLabelRegions=Object.freeze([
 {x:190,y:719,width:265,height:94},
 {x:553,y:719,width:270,height:94},
 {x:918,y:719,width:220,height:94},
 {x:1248,y:719,width:292,height:94}
].map(region=>Object.freeze(region)));
const renderLabelArtwork=()=>`<svg class="projects-hero-label-artwork" viewBox="0 0 1672 941" aria-hidden="true" focusable="false"><defs><clipPath id="projects-hero-label-regions">${projectHeroLabelRegions.map(region=>`<rect x="${region.x}" y="${region.y}" width="${region.width}" height="${region.height}"/>`).join('')}</clipPath><filter id="projects-hero-label-soft-edge" x="-10%" y="-25%" width="120%" height="150%"><feGaussianBlur stdDeviation="2"/></filter><mask id="projects-hero-label-blend" maskUnits="userSpaceOnUse" x="0" y="0" width="1672" height="941">${projectHeroLabelRegions.map(region=>`<rect x="${region.x+3}" y="${region.y+3}" width="${region.width-6}" height="${region.height-6}" fill="white" filter="url(#projects-hero-label-soft-edge)"/>`).join('')}</mask></defs><image href="projects-hero-value-labels.webp" width="1672" height="941" preserveAspectRatio="none" clip-path="url(#projects-hero-label-regions)" mask="url(#projects-hero-label-blend)"/></svg>`;
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;');

export function renderProjectsHero() {
 return `<section class="page-intro projects-hero"><h1 class="projects-hero-title">Our Projects</h1><div class="projects-hero-frame"><img class="projects-hero-image" src="2E318DBA-71A7-4D42-9FC2-5E723868F9CC.png" width="1672" height="941" alt="Our Projects. Every Action Matters, Every Life Deserves Dignity." fetchpriority="high" decoding="async">${renderLabelArtwork()}<nav class="projects-hero-causes" aria-label="Project causes">${projectHeroCauses.map(cause=>`<a class="projects-hero-cause" href="#projects-${cause.id}" data-cause-target="projects-${cause.id}" data-cause-label="${escape(cause.label)}" aria-label="${escape(cause.label)} projects"></a>`).join('')}</nav></div><dialog class="projects-cause-notice" aria-labelledby="projects-cause-notice-title"><h2 id="projects-cause-notice-title">Project category</h2><p class="projects-cause-notice-copy"></p><div class="projects-cause-notice-actions"><a href="#project-initiatives-heading">View current projects</a><button type="button">Close</button></div></dialog></section>`;
}
