const causes = ['Humanitarian Assistance', 'Human Rights & Dignity', 'Animal Welfare', 'Environmental Protection'];
const interests = ['One-time donations', 'Monthly donations', 'Project sponsorship', 'In-kind donations', 'Volunteering', 'Humanitarian activities', 'Human rights advocacy', 'Animal welfare', 'Environmental protection', 'Leadership', 'Project management', 'Professional expertise', 'Legal assistance', 'Fundraising', 'Grant writing', 'Marketing', 'Technology', 'Translation', 'Events', 'Community representation', 'Partnerships', 'International collaboration', 'Project proposals', 'Advisory roles', 'Other'];
const checks = (name, values) => values.map(value => `<label><input type="checkbox" name="${name}" value="${value}"><span>${value}</span></label>`).join('');
const dropdown = (name, label, values) => `<fieldset><legend id="application-${name}-label">${label}</legend><details class="application-multiselect" data-selection="${name}"><summary aria-labelledby="application-${name}-label application-${name}-selected"><span id="application-${name}-selected" class="application-selected">Select one or more</span></summary><div class="application-checks">${checks(name, values)}</div></details></fieldset>`;
export const renderApplication = () => `<section class="involvement-application" id="application" aria-labelledby="application-heading">
<h2 id="application-heading">Ready to Get Involved? <span class="application-heading-note">(Application Form)</span></h2>
<div class="card application-box"><h2>Your Journey With Us Starts Here</h2>
<p>Whether you wish to volunteer, share your ideas, or contribute to our initiatives, we welcome you to be part of our community.</p>
<p id="contact-status" role="status"></p>
<form class="contact-form" data-application method="post" action="api/contact" aria-describedby="contact-status contact-privacy">
<div class="application-fields">
<div><label for="application-name">Full Name (required)</label><input id="application-name" name="name" autocomplete="name" required maxlength="120"></div>
<div><label for="application-email">Email Address (required)</label><input id="application-email" name="email" type="email" autocomplete="email" required maxlength="254"></div>
<div><label for="application-phone">Phone Number (optional)</label><input id="application-phone" name="phone" type="tel" autocomplete="tel" maxlength="50"></div>
<div><label for="application-location">Country / Location</label><input id="application-location" name="location" autocomplete="country-name" maxlength="120"></div>
</div>
${dropdown('causes', 'Our Causes', causes)}
${dropdown('interests', 'How Would You Like to Get Involved?', interests)}
<div class="application-other" hidden><label for="application-other">Other — please specify</label><input id="application-other" name="other" maxlength="200" disabled></div>
<label for="application-message">Your Message</label><textarea id="application-message" name="message" rows="5" maxlength="3000"></textarea>
<p id="contact-privacy" class="application-note">Please share only information needed for your application. Do not include identity documents, payment details, medical records, or other sensitive information.</p>
<label class="application-consent"><input type="checkbox" name="consent" value="yes" required><span>I agree that Your Global Voice may use the information I provide to review my application and contact me about my involvement. (required)</span></label>
<div class="application-trap" aria-hidden="true"><label for="application-website">Leave this field empty</label><input id="application-website" name="website" tabindex="-1" autocomplete="off"></div>
<button class="button" type="submit" disabled>Submit Application</button>
<noscript><p>JavaScript is required for secure application submission. Please contact info@ygvoice.org for assistance.</p></noscript>
</form><p id="contact-result" role="status" aria-live="polite" aria-atomic="true"></p></div></section>`;
