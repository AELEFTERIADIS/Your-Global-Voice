// These derivative assets contain only unobstructed approved decoration.
// No source screenshot, printed UI, masks, or concealing overlays are rendered.
const backgrounds={giving:'projects-invitation-sunrise.png',message:'projects-invitation-leaves.png'};
export function renderProjectsInvitationBackground(kind) {
 if(!Object.hasOwn(backgrounds,kind))throw new Error('Unknown invitation background');
 return `<img class="projects-invitation-background" src="${backgrounds[kind]}" width="744" height="410" alt="" aria-hidden="true" decoding="async">`;
}
