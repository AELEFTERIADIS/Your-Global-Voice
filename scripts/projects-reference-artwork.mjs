// Immutable approved artwork regions; page copy and interactive controls remain HTML.
export const projectsReference='Our Projects_ Compassion in Action (2).png';
export function renderProjectsReferenceArtwork(box, className, label='', reference=projectsReference, sourceWidth=1024, sourceHeight=1536) {
 const [x,y,width,height]=box.split(' ').map(Number);
 return `<svg class="projects-reference-artwork ${className}" viewBox="${x} ${y} ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" ${label?`role="img" aria-label="${label}"`:'aria-hidden="true"'} focusable="false"><image href="${reference}" width="${sourceWidth}" height="${sourceHeight}"/></svg>`;
}
