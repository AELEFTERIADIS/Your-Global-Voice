// These are the existing cause identities, not additional projects or payments.
export const projectCategories=Object.freeze([
 {id:'human-rights-dignity',label:'Human Rights & Dignity',icon:'scales',photo:'rights',alt:'A white dove rises above open hands at sunset.',description:'Stand against persecution and discrimination and help protect the rights and dignity of every individual.',project:'project-dignity-heading'},
 {id:'humanitarian-assistance',label:'Humanitarian Assistance & Relief',icon:'hand-heart',photo:'relief',alt:'A humanitarian volunteer gives an aid box to a young girl.',description:'Providing emergency relief and essential assistance to individuals and communities affected by disasters, crises, and hardship.'},
 {id:'animal-welfare',label:'Animal Welfare',icon:'paw',photo:'animals',alt:'A woman gently embraces a dog and a cat outdoors.',description:'Promote the protection, care, and humane treatment of all animals and support efforts that prevent cruelty and abandonment.'},
 {id:'environmental-conservation',label:'Environmental Protection',icon:'leaf',photo:'environment',alt:'Sunlight falls over a forested mountain valley and winding river.',description:'Help preserve our planet and its natural resources and support conservation and reforestation efforts for future generations.'}
].map(category=>Object.freeze(category)));
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;');
const paths={
 scales:'<path d="M24 6v34M10 14h28M17 42h14M12 14 4 30h16l-8-16Zm24 0-8 16h16l-8-16Z"/><path d="M4 30a8 8 0 0 0 16 0m8 0a8 8 0 0 0 16 0"/><circle cx="24" cy="11" r="3"/>',
 'hand-heart':'<path d="M24 23 10 12a7 7 0 0 1 14-7 7 7 0 0 1 14 7L24 23Z"/><path fill="currentColor" stroke-width="1" d="M19 44H9V31C4 27 2 22 3 17c1-3 4-3 5 1l3 8 7 6c2 2 1 5 1 12ZM29 44h10V31c5-4 7-9 6-14-1-3-4-3-5 1l-3 8-7 6c-2 2-1 5-1 12Z"/>',
 paw:'<ellipse fill="currentColor" cx="11" cy="15" rx="4" ry="6"/><ellipse fill="currentColor" cx="20" cy="10" rx="4" ry="6"/><ellipse fill="currentColor" cx="30" cy="10" rx="4" ry="6"/><ellipse fill="currentColor" cx="39" cy="16" rx="4" ry="6"/><path fill="currentColor" d="M12 33c0-7 6-15 12-15s13 8 13 15c0 5-4 8-8 6-3-2-6-2-10 0-4 2-7-1-7-6Z"/>',
 leaf:'<path fill="currentColor" d="M23 40C18 22 25 9 43 5c-1 20-6 30-20 30M23 40C18 28 9 27 5 14c14 0 22 6 20 16M23 40 36 15M23 33 12 21"/>'
};
// Use the original uploaded image as an immutable source. SVG viewports expose
// only its photo regions; headings, descriptions and actions remain real HTML.
export const projectDesignReference='Explore Our Impact Projects (1).png';
const photoRegions={
 rights:{x:17,y:145,width:320,height:283,edge:'M0 0H234C310 70 334 178 276 283H0Z'},
 relief:{x:779,y:145,width:320,height:283,edge:'M0 0H234C310 70 334 178 276 283H0Z'},
 animals:{x:17,y:530,width:320,height:252,edge:'M0 0H234C302 58 352 165 292 252H0Z'},
 environment:{x:779,y:530,width:320,height:252,edge:'M0 0H234C302 58 352 165 292 252H0Z'}
};
function renderPhoto(category) {
 const crop=photoRegions[category.photo];
 const clip=`project-photo-${category.id}`;
 return `<div class="project-cause-photo" role="img" aria-label="${escape(category.alt)}"><svg viewBox="0 0 ${crop.width} ${crop.height}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs><clipPath id="${clip}"><path d="${crop.edge}"/></clipPath></defs><g clip-path="url(#${clip})"><image href="${projectDesignReference}" x="${-crop.x}" y="${-crop.y}" width="1536" height="1024"/></g></svg></div>`;
}
const smallIcon=kind=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${kind==='heart'?'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>':'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7M3 18l6-6m12 6-6-6"/>'}</svg>`;
export function renderProjectCategories() {
 return `<div class="project-cause-panels">${projectCategories.map(category=>{
  const label=escape(category.label);
  const explore=`Explore Projects <span aria-hidden="true">&rarr;</span>`;
  const exploreAction=category.project?`<a class="project-cause-action project-cause-explore" href="#${category.project}" aria-label="Explore ${label} projects">${explore}</a>`:`<details class="project-cause-empty"><summary class="project-cause-action project-cause-explore" aria-label="Explore ${label} projects">${explore}</summary><p>There are no published projects for this cause yet. <a href="contact.html#message-heading">Contact us to get involved.</a></p></details>`;
  return `<article class="project-cause-panel" id="projects-${category.id}" aria-labelledby="projects-${category.id}-title" tabindex="-1"><div class="project-cause-overview">${renderPhoto(category)}<div class="project-cause-copy"><div class="project-cause-heading"><svg class="project-cause-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[category.icon]}</svg><h3 id="projects-${category.id}-title">${label}</h3></div><svg class="project-cause-accent" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 18Q150-16 300 18Q150 2 0 18Z" fill="currentColor"/></svg><p class="project-cause-description">${escape(category.description)}</p></div></div><div class="project-cause-actions">${exploreAction}<a class="project-cause-action project-cause-support" href="donate.html#giving-heading" aria-label="Support ${label}: giving arrangements">${smallIcon('heart')}<span>Support This Cause</span></a><a class="project-cause-action project-cause-message" href="contact.html#message-heading" aria-label="Send a message about ${label}">${smallIcon('mail')}<span>Send a Message</span></a></div></article>`;
 }).join('')}</div><svg class="project-categories-wave" viewBox="0 0 1440 64" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs><linearGradient id="project-wave-gold"><stop stop-color="#ffda53"/><stop offset=".5" stop-color="#d49b0b"/><stop offset="1" stop-color="#ffcf35"/></linearGradient></defs><path d="M0 12C260-24 420 64 720 32S1160-12 1440 20V58C1160 24 970 30 720 51S260 20 0 64Z" fill="#081b50"/><path d="M0 12C260-24 420 64 720 32S1160-12 1440 20V35C1160 3 970 13 720 46S260-9 0 28Z" fill="url(#project-wave-gold)"/></svg>`;
}
