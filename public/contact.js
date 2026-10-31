const copyButton = document.querySelector('#copy-address');
copyButton?.addEventListener('click', async () => {
  const address = document.querySelector('#mailing-address');
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(address.innerText);
    status.textContent = 'Mailing address copied.';
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(address);
    selection.removeAllRanges(); selection.addRange(range);
    status.textContent = 'Address selected. Press Command+C on Mac or Ctrl+C to copy.';
  }
});
const form = document.querySelector('.contact-form');
const status = document.querySelector('#contact-status');
const resultStatus = document.querySelector('#contact-result');
const submit = form.querySelector('[type="submit"]');
let token;
// The source page also works when served without Pages artifact metadata.
const pagesApiOrigin = ['aelefteriadis.github.io', 'ygvoice.org', 'www.ygvoice.org'].includes(location.hostname)
  ? 'https://ygvoice-contact.andyelft.workers.dev' : '';
const apiOrigin = document.querySelector('meta[name="ygv-contact-api"]')?.content || pagesApiOrigin;
const apiUrl = (path) => apiOrigin ? apiOrigin + '/' + path : path;
async function prepare(enableSubmit = true) {
  token = null;
  submit.disabled = true;
  if (location.protocol === 'file:') {
    status.textContent = 'Sending requires the configured website server. Please use our email or WhatsApp contact when viewing this page locally.';
    return false;
  }
  if (!apiOrigin && (document.querySelector('meta[name="ygv-hosting"][content="static"]') || location.hostname === 'aelefteriadis.github.io')) {
    status.textContent = 'Message delivery is unavailable. Please use our email or WhatsApp contact.';
    return false;
  }
  let unavailableMessage = 'Unable to connect to the message service. Please use our email or WhatsApp contact.';
  try {
    const response = await fetch(apiUrl('api/contact/status'), { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    const errors = {
      403: 'The message service could not authorize this website. Please use our email or WhatsApp contact.',
      429: 'Too many attempts. Please wait 15 minutes before trying again, or contact us by email.',
      503: 'The message service is not configured. Please use our email or WhatsApp contact.',
      502: 'The message service could not initialize. Please use our email or WhatsApp contact.'
    };
    unavailableMessage = errors[response.status] || unavailableMessage;
    const result = await response.json();
    if (!response.ok || result.available !== true || typeof result.token !== 'string' || !result.token) throw new Error();
    token = result.token; submit.disabled = !enableSubmit;
    status.textContent = '';
    return true;
  } catch {
    submit.disabled = true;
    status.textContent = unavailableMessage;
    return false;
  }
}
// Applications use the same validated inquiry endpoint and security checks.
function submissionData() {
  const fields = new FormData(form);
  const data = Object.fromEntries(fields);
  if (form.hasAttribute?.('data-application')) {
    data.subject = 'Volunteering Opportunities';
    data.message = [
      'Get Involved Application',
      'International Dialing Code: ' + (fields.get('dialCode') ? fields.get('dialCode') + ' (' + fields.get('dialCountry') + ')' : 'Not selected'),
      'Phone Number: ' + (fields.get('phone') ? ((fields.get('dialCode') && !fields.get('phone').trim().startsWith('+') ? fields.get('dialCode') + ' ' : '') + fields.get('phone')) : 'Not provided'),
      'Country / Location: ' + (fields.get('location') === 'Other' ? fields.get('locationOther') : fields.get('location') || 'Not provided'),
      'Our Causes: ' + (fields.getAll('causes').join(', ') || 'Not selected'),
      'Opportunities to Make a Difference: ' + (fields.getAll('interests').join(', ') || 'Not selected'),
      'Other: ' + (fields.get('other') || 'Not provided'),
      'Your Message: ' + (fields.get('message') || 'Not provided')
    ].join('\n\n');
  }
  return data;
}
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!token || submit.disabled || !form.reportValidity()) return;
  submit.disabled = true; form.setAttribute('aria-busy', 'true');
  resultStatus.className = '';
  resultStatus.textContent = 'Sending your message…';
  let failureMessage = 'Your message could not be confirmed as received. Please retry or contact us by email.';
  try {
    // Refresh expired/IP-bound tokens without retrying an ambiguous mail submission.
    if (!await prepare(false)) throw new Error('Verification unavailable.');
    // Preserve the backend minimum completion time for the freshly issued token.
    await new Promise(resolve => setTimeout(resolve, 1100));
    const response = await fetch(apiUrl('api/contact'), { method: 'POST', signal: AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...submissionData(), token }) });
    const result = await response.json();
    if (!response.ok || result.accepted !== true) {
      if (typeof result.message === 'string') failureMessage = result.message;
      throw new Error();
    }
    resultStatus.className = 'contact-success';
    resultStatus.textContent = form.hasAttribute?.('data-application')
      ? 'Thank you for your interest in Your Global Voice. Your application has been submitted successfully. We will review it and respond as soon as possible.'
      : 'Thank you for contacting Your Global Voice. Your message has been sent successfully. We will respond as soon as possible.';
    form.reset(); token = null;
    await prepare();
  } catch {
    await prepare();
    resultStatus.className = 'contact-error';
    resultStatus.textContent = failureMessage;
  } finally { form.removeAttribute('aria-busy'); }
});
prepare();
