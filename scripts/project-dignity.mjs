const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// No project prose is supplied by default: publication requires approved copy.
export function renderDignityProject(paragraphs) {
  if (!Array.isArray(paragraphs) || !paragraphs.length || paragraphs.some(text => typeof text !== 'string' || !text.trim())) {
    throw new Error('Approved Voices for Dignity text is required before publishing.');
  }
  return `<section class="project-initiatives" aria-labelledby="project-initiatives-heading">
<h2 id="project-initiatives-heading"><span>Our Projects &amp; Initiatives</span></h2>
<div class="project-dignity-layout">
<article class="project-dignity-info" aria-labelledby="project-dignity-heading"><p class="eyebrow project-purpose-label">HUMAN RIGHTS &amp; DIGNITY PROJECT</p><h3 id="project-dignity-heading"><svg class="project-scales-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M24 5v35M8 13h32M18 43h12M24 40l-5 3m5-3 5 3M10 14 3 29h14l-7-15Zm28 0-7 15h14l-7-15Z"/><path d="M3 29a7 7 0 0 0 14 0m14 0a7 7 0 0 0 14 0" fill="currentColor"/><circle cx="24" cy="10" r="3" fill="currentColor"/></svg><span>Voices for Dignity</span></h3>
<p>${escape(paragraphs[0])}</p>
<details class="project-read-more" open><summary><span class="project-read-more-label">Read More</span><span class="project-read-less-label">Read Less</span></summary>${paragraphs.slice(1).map(text => `<p>${escape(text)}</p>`).join('')}</details>
<p class="project-dignity-slogan">Together, We Can Make Every Voice Count</p>
<div class="project-contact"><p>Want to learn more or get involved?</p><a class="text-link" href="contact.html#message-heading">Send Us a Message<svg class="project-contact-arrow" viewBox="0 0 16 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m4 4 8 8-8 8"/></svg></a></div></article>
<aside class="project-giving" aria-labelledby="project-giving-heading"><h3 id="project-giving-heading">Support Voices for Dignity</h3>
<fieldset><legend>Choose an amount (USD)</legend><div class="project-amounts">${[25, 50, 100, 250].map(amount => `<label><input type="radio" name="dignity-amount" value="${amount}"${amount === 25 ? ' checked' : ''}><span>$${amount}</span></label>`).join('')}<label><input type="radio" name="dignity-amount" value="custom"><span>Custom amount</span></label></div>
<label class="project-custom-label" for="dignity-custom">Custom amount in USD</label><input id="dignity-custom" class="project-custom" type="number" placeholder="Enter amount" min="1" max="1000000" step="0.01" inputmode="decimal" disabled aria-describedby="dignity-amount-note"><p id="dignity-amount-note" class="project-giving-note">For a custom amount, enter $1 or more with up to two decimal places.</p></fieldset>
<p class="project-giving-summary" role="status" aria-live="polite">$25.00 USD selected.</p>
<div class="project-payment-pending" role="group" aria-label="Project payment methods" aria-describedby="dignity-payment-status"><button type="button" disabled><svg class="project-card-icon" viewBox="0 0 24 18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><rect x="1" y="1" width="22" height="16" rx="2"/><path d="M1 6h22M5 12h4m3 0h3"/></svg>Credit or Debit Card</button><button type="button" disabled><img class="project-paypal-logo" src="paypal-logo.svg" width="101" height="32" alt="PayPal" loading="lazy" decoding="async"></button></div>
<p id="dignity-payment-status" class="project-giving-note">Online donations for this project are not available yet.</p></aside>
</div></section>`;
}
