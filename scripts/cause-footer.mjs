export const causeReturnLink='<a class="cause-footer-return" href="causes.html"><span aria-hidden="true">←</span> Back to Our Causes</a>';

// Individual cause pages reuse the shared footer with this one contextual link.
export function addCauseFooterReturn(html){
 return html.replace(/(<section class="desktop-home-social">[\s\S]*?)(<\/section>)/,(_match,content,end)=>content+causeReturnLink+end);
}
