// Vertical whitespace only. Every photograph, letter, symbol, laurel and wave
// is sampled from the immutable approved source at the original horizontal scale.
// The complete j descender stays with the title. Tiny clip runs separate
// overlapping laurel/text bounds without recoloring
// pixels. Added empty space samples an unobstructed ivory row from the same PNG.
const source='Our Projects_ Compassion in Action (2).png';
const image=()=>`<image href="${source}" width="1024" height="1536"/>`;
const laurelRuns="M734 370h1v1h-1ZM732 371h3v1h-3ZM730 372h5v1h-5ZM729 373h4v1h-4ZM729 374h3v1h-3ZM730 375h1v1h-1Z";
const sloganRuns="M290 365h5v1h-5ZM290 366h5v1h-5ZM290 367h5v1h-5ZM290 368h5v1h-5ZM290 369h5v1h-5ZM290 370h5v1h-5ZM290 371h5v1h-5ZM290 372h5v1h-5ZM290 373h5v1h-5ZM290 374h5v1h-5ZM290 375h5v1h-5ZM290 376h5v1h-5ZM290 377h5v1h-5ZM290 378h5v1h-5ZM290 379h5v1h-5ZM290 380h5v1h-5ZM725 365h10v1h-10ZM725 366h10v1h-10ZM725 367h10v1h-10ZM725 368h10v1h-10ZM725 369h10v1h-10ZM725 370h9v1h-9ZM725 371h7v1h-7ZM725 372h5v1h-5ZM725 373h4v1h-4ZM733 373h2v1h-2ZM725 374h4v1h-4ZM732 374h3v1h-3ZM725 375h5v1h-5ZM731 375h4v1h-4ZM725 376h10v1h-10ZM725 377h10v1h-10ZM725 378h10v1h-10ZM725 379h10v1h-10ZM725 380h10v1h-10Z";
export function renderProjectsSpacedHeroArtwork(){
 return `<svg class="projects-reference-artwork projects-reference-hero" viewBox="8 10 1008 552" width="1008" height="552" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Our Projects. Compassion in Action. Hope for Every Life. Protection, Compassion, Justice, and Nature." focusable="false"><defs>
 <clipPath id="projects-spacing-photo-title" clipPathUnits="userSpaceOnUse"><rect x="8" y="10" width="1008" height="355"/><rect x="560" y="365" width="28" height="6"/><rect x="240" y="365" width="50" height="16"/><rect x="735" y="365" width="45" height="16"/><path d="${laurelRuns}"/></clipPath>
 <clipPath id="projects-spacing-slogan" clipPathUnits="userSpaceOnUse"><rect x="295" y="365" width="265" height="33"/><rect x="588" y="365" width="137" height="33"/><rect x="560" y="371" width="28" height="27"/><rect x="290" y="381" width="5" height="17"/><rect x="725" y="381" width="10" height="17"/><path d="${sloganRuns}"/></clipPath>
 <clipPath id="projects-spacing-symbols" clipPathUnits="userSpaceOnUse"><rect x="8" y="398" width="1008" height="88"/><rect x="98" y="384" width="147" height="14"/><rect x="811" y="384" width="105" height="14"/></clipPath>
 <clipPath id="projects-spacing-lower-wave" clipPathUnits="userSpaceOnUse"><rect x="8" y="486" width="1008" height="38"/></clipPath>
 </defs><svg x="8" y="365" width="1008" height="197" viewBox="8 480 1008 6" preserveAspectRatio="none" aria-hidden="true">${image()}</svg>
 <g transform="translate(0 10)"><g clip-path="url(#projects-spacing-slogan)">${image()}</g></g>
 <g clip-path="url(#projects-spacing-photo-title)">${image()}</g>
 <g transform="translate(0 26)"><g clip-path="url(#projects-spacing-symbols)">${image()}</g></g>
 <g transform="translate(0 38)"><g clip-path="url(#projects-spacing-lower-wave)">${image()}</g></g></svg>`;
}
