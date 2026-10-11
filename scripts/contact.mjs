const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export function contactEndpoint(config) {
  if (!config.formEndpoint) return null;
  const url = new URL(config.formEndpoint);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error('Contact form endpoint must be an HTTPS URL without credentials or a fragment.');
  return url;
}

export function renderContact(config) {
  const endpoint = contactEndpoint(config);
  const emails = config.emails.map(({ label, address }) => {
    if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(address)) throw new Error('Invalid contact email address.');
    return `<p><strong>${escape(label)}</strong><br><a class="text-link" href="mailto:${escape(address)}">${escape(address)}</a></p>`;
  }).join('');
  let whatsapp = '<button class="button" type="button" disabled aria-describedby="whatsapp-status">Chat on WhatsApp</button><p id="whatsapp-status" class="contact-note">WhatsApp contact details are awaiting verification.</p>';
  if (config.whatsappNumber) {
    if (!/^\+[1-9]\d{6,14}$/.test(config.whatsappNumber)) throw new Error('WhatsApp number must include a + and international country code.');
    whatsapp = `<p>${escape(config.whatsappNumber)}</p><a class="button" href="https://wa.me/${config.whatsappNumber.slice(1)}" target="_blank" rel="noopener noreferrer">Chat on WhatsApp <span class="contact-note">(opens a new tab)</span></a>`;
  }
  const address = config.mailingAddress.length ? `<address>${config.mailingAddress.map(escape).join('<br>')}</address>` : '<p>Our verified mailing address will be published here when available.</p>';
  return `<section class="page-intro"><p class="eyebrow">Your Global Voice, Inc.</p><h1>Contact Us</h1><p class="lead">A place to connect around our shared purposes.</p></section>
  <div class="card-grid"><section class="card"><p class="eyebrow">Email</p><h2>Write to us</h2>${emails || '<p>Contact email addresses are awaiting verification.</p>'}<p>Please use verified organizational contact channels for general inquiries, participation, and donation questions.</p></section>
  <section class="card"><p class="eyebrow">Stay connected</p><h2>WhatsApp</h2><p>Use our approved WhatsApp contact for general inquiries once it is available.</p>${whatsapp}</section>
  <section class="card"><p class="eyebrow">Correspondence</p><h2>Mailing address</h2>${address}<p>Please confirm acceptance arrangements before sending checks, goods, clothing, or supplies. A mailing address alone does not confirm that donations can be received.</p></section>
  <section class="card"><p class="eyebrow">Before you contact us</p><h2>How we can help</h2><p>You may wish to ask about our purposes, future participation opportunities, or contribution arrangements. No active project services or emergency response are announced.</p><a class="text-link" href="donate.html">Read donation guidance &rarr;</a></section></div>
  <section class="content-panel contact-message" aria-labelledby="message-heading"><h2 id="message-heading">Send a message</h2><p id="contact-status" role="status">${endpoint ? 'Your message will be submitted securely to our contact service. Please do not include sensitive personal or financial information.' : 'Message delivery is not yet configured. You can prepare a message here, but sending is unavailable and nothing is transmitted.'}</p>
  <form class="contact-form" method="post"${endpoint ? ` action="${escape(endpoint.href)}"` : ''} aria-describedby="contact-status contact-privacy">
  <div class="contact-fields"><div><label for="contact-name">Name <span>(required)</span></label><input id="contact-name" name="name" autocomplete="name" required maxlength="120"></div><div><label for="contact-email">Email <span>(required)</span></label><input id="contact-email" name="email" type="email" autocomplete="email" required maxlength="254"></div></div>
  <label for="contact-topic">Subject <span>(required)</span></label><select id="contact-topic" name="subject" required><option value="">Choose a subject</option><option>General inquiry</option><option>Volunteering and participation</option><option>Collaboration</option><option>Donation question</option><option>Other</option></select>
  <label for="contact-message">Message <span>(required; up to 5,000 characters)</span></label><textarea id="contact-message" name="message" rows="7" required minlength="10" maxlength="5000" aria-describedby="contact-privacy"></textarea>
  <p id="contact-privacy" class="contact-note">Share only the information needed for your inquiry. Do not include identity documents, payment details, medical records, or other sensitive information.</p>
  <label class="contact-consent"><input type="checkbox" name="consent" value="yes" required> <span>I agree that my name, email, and message may be used to respond to this inquiry.</span></label>
  ${endpoint ? '' : '<fieldset disabled class="contact-send"><legend class="contact-note">Sending unavailable until secure delivery is configured</legend>'}<button class="button" type="submit"${endpoint ? '' : ' disabled'}>Send message</button>${endpoint ? '' : '</fieldset>'}
  </form></section><section class="content-panel"><h2>Care with personal information</h2><p>Please do not send identity documents, financial details, or sensitive information to an unverified contact. This site does not provide an emergency response channel.</p></section>`;
}
