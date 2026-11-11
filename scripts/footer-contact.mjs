const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const icon=type=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${type==='mail'?'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 5 9 7 9-7"/>':type==='whatsapp'?'<path d="M21 11.5a9 9 0 0 1-13.3 7.9L2 21l1.6-5.5A9 9 0 1 1 21 11.5Z"/><path d="M8 6.5 6.8 8c.3 4.5 3.7 7.7 8 8l1.7-1.5-3-1.5-1 1c-1.8-.7-3-1.9-3.8-3.7l1-1Z"/>':'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.8"/>'}</svg>`;
export function renderFooterContact(contact){
 const email=contact.emails.find(e=>e.label==='General Inquiries').address;
 const address=contact.mailingAddress.slice(1);
 const maps='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(address.join(', '));
 return `<section class="desktop-home-footer-contact footer-contact-links"><h2>Contact Us</h2><a class="footer-contact-email" href="mailto:${escape(email)}">${icon('mail')}<span>${escape(email)}</span></a><a class="footer-contact-whatsapp" href="https://wa.me/${contact.whatsappNumber.replace(/\D/g,'')}">${icon('whatsapp')}<span>WhatsApp</span></a><a class="footer-contact-address" href="${escape(maps)}" target="_blank" rel="noopener noreferrer">${icon('pin')}<span>${address.map(escape).join('<br>')}</span></a></section>`;
}
