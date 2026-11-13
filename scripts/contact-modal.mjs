// Reuse the generated shared contact section and its existing delivery script.
export function renderContactModal(contactHtml){
 const section=contactHtml.match(/<section class="card content-panel contact-message"[\s\S]*?<\/section>/)?.[0];
 if(!section)throw new Error('Shared contact form was not generated.');
 return `<dialog class="shared-contact-modal" aria-labelledby="message-heading"><button class="shared-contact-close" type="button" aria-label="Close message form">Close ×</button>${section}</dialog>`;
}
