import {renderDesktopHomeFooter} from './desktop-home.mjs';
import {renderProjectsReferenceArtwork} from './projects-reference-artwork.mjs';
const reference='Our Voice Creates Change Footer.png';
const artwork=(box,cls,label='')=>renderProjectsReferenceArtwork(box,cls,label,reference,1717,916);
export function renderProjectsClosing(){
 return `${artwork('0 0 1717 73','projects-invitation-closing-wave')}<section class="projects-approved-closing" data-projects-reference-closing aria-labelledby="projects-approved-closing-heading"><h2 id="projects-approved-closing-heading">Our Voice Creates Change</h2>${artwork('0 73 1717 483','projects-approved-closing-scene','Our Voice Creates Change. Six community members stand together overlooking a coastal sunset.')}</section>`;
}
export function renderProjectsFooter(contact){
 // Reuse the actual shared footer markup and stored destinations. Only Projects
 // receives the approved reference artwork and scoped desktop presentation.
 return renderDesktopHomeFooter(contact)
  .replace('class="desktop-home-footer"','class="desktop-home-footer" data-projects-approved-footer')
  .replace(/<svg class="desktop-home-crop desktop-home-footer-wave"[\s\S]*?<\/svg>/,artwork('0 817 1717 99','projects-approved-footer-wave'));
}
