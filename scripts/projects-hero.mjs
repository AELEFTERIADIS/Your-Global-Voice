// Reuse the existing four cause identities; these are navigation labels only.
export const projectHeroCauses=Object.freeze([
 {id:'animal-welfare',label:'Protection'},
 {id:'humanitarian-assistance',label:'Compassion'},
 {id:'environmental-conservation',label:'Nature'},
 {id:'human-rights-dignity',label:'Justice'}
].map(cause=>Object.freeze(cause)));
// Recompose vertical whitespace in the artwork; preserve its native aspect ratio.
export const projectHeroArtwork=Object.freeze({src:'projects-hero-compact.webp',width:1774,height:887});
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;');


// Recolor the existing artwork pixels, preserving icon contours and all other pixels.
const iconColorFilter=(id,r,g,b)=>`<filter id="hero-icon-${id}" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="${r} 0 0 0 0  0 ${g} 0 0 0  ${b} 0 0 0 0  4 0 -4 0 0"/></filter>`;
// Move the existing icon/label pixels without resizing or regenerating their shapes.
const heroRowRegions=Object.freeze([
 {id:'justice',x:260,width:180,offset:1122},
 {id:'paw',x:968,width:235,offset:-736},
 {id:'leaves',x:1360,width:190,offset:-363}
]);
function renderHeroIconColors() {
 const recolor=(id)=>id==='justice'?'':`<g clip-path="url(#hero-${id}-area)"><image href="${projectHeroArtwork.src}" width="1774" height="887" filter="url(#hero-icon-${id})"/></g>`;
 return `<svg class="projects-hero-icon-colors" viewBox="0 0 1774 887" aria-hidden="true" focusable="false"><defs>${iconColorFilter('heart',.72,.55,.42)}${iconColorFilter('paw',.68,.52,.28)}${iconColorFilter('leaves',.32,.65,.24)}<filter id="hero-glyph-alpha" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  4 0 0 0 -1.2"/></filter><mask id="hero-glyph-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1774" height="887"><image href="${projectHeroArtwork.src}" width="1774" height="887" filter="url(#hero-glyph-alpha)"/></mask><filter id="hero-row-feather"><feGaussianBlur stdDeviation="10 5"/></filter><mask id="hero-row-background-mask" maskUnits="userSpaceOnUse" x="200" y="580" width="1400" height="220"><g fill="white" filter="url(#hero-row-feather)">${heroRowRegions.map(r=>`<rect x="${r.x-15}" y="605" width="${r.width+30}" height="165"/>`).join('')}</g></mask>${heroRowRegions.map(r=>`<clipPath id="hero-source-${r.id}"><rect x="${r.x-15}" y="605" width="${r.width+30}" height="165"/></clipPath>`).join('')}<clipPath id="hero-row-background-limit"><rect x="200" y="600" width="1400" height="180"/></clipPath><clipPath id="hero-heart-area"><path d="M680 622H756V646L719 675 680 649Z"/></clipPath><clipPath id="hero-paw-area"><rect x="1028" y="618" width="104" height="90"/></clipPath><clipPath id="hero-leaves-area"><rect x="1390" y="618" width="130" height="92"/></clipPath></defs><g clip-path="url(#hero-row-background-limit)"><image href="projects-hero-row-background.webp" width="1774" height="887" mask="url(#hero-row-background-mask)"/></g>${heroRowRegions.map(r=>`<g transform="translate(${r.offset} 0)"><g clip-path="url(#hero-source-${r.id})" mask="url(#hero-glyph-mask)"><image href="${projectHeroArtwork.src}" width="1774" height="887"/>${recolor(r.id)}</g></g>`).join('')}<g clip-path="url(#hero-heart-area)"><image href="${projectHeroArtwork.src}" width="1774" height="887" filter="url(#hero-icon-heart)"/></g></svg>`;
}

export function renderProjectsHero() {
 return `<section class="page-intro projects-hero"><h1 class="projects-hero-title">Our Projects</h1><div class="projects-hero-frame"><img class="projects-hero-image" src="${projectHeroArtwork.src}" width="${projectHeroArtwork.width}" height="${projectHeroArtwork.height}" alt="Our Projects. Making a Difference Where It Matters Most." fetchpriority="high" decoding="async"><svg class="projects-hero-slogan" viewBox="0 0 1774 887" aria-hidden="true" focusable="false"><defs><filter id="hero-slogan-feather" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="2"/></filter><mask id="hero-slogan-repair" maskUnits="userSpaceOnUse" x="300" y="526" width="1185" height="100"><rect x="310" y="542" width="1170" height="70" fill="white" filter="url(#hero-slogan-feather)"/></mask></defs><image href="projects-hero-slogan-repair.webp" width="1774" height="887" mask="url(#hero-slogan-repair)"/><text x="887" y="587" text-anchor="middle" fill="#ffda65" font-family="Georgia, 'Times New Roman', serif" font-size="48" font-weight="600" font-style="normal">Making a Difference Where It Matters Most</text></svg>${renderHeroIconColors()}<nav class="projects-hero-causes" aria-label="Project causes">${projectHeroCauses.map(cause=>`<a class="projects-hero-cause" href="#projects-${cause.id}" data-cause-target="projects-${cause.id}" data-cause-label="${escape(cause.label)}" aria-label="${escape(cause.label)} projects"></a>`).join('')}</nav></div><dialog class="projects-cause-notice" aria-labelledby="projects-cause-notice-title"><h2 id="projects-cause-notice-title">Project category</h2><p class="projects-cause-notice-copy"></p><div class="projects-cause-notice-actions"><a href="#project-initiatives-heading">View current projects</a><button type="button">Close</button></div></dialog></section>`;
}
