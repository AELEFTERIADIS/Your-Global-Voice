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
const submit = form.querySelector('[type="submit"]');
let token;
// The source page also works when served without Pages artifact metadata.
const pagesApiOrigin = location.hostname === 'aelefteriadis.github.io'
  ? 'https://ygvoice-contact.andyelft.workers.dev' : '';
const apiOrigin = document.querySelector('meta[name="ygv-contact-api"]')?.content || pagesApiOrigin;
const apiUrl = (path) => apiOrigin ? apiOrigin + '/' + path : path;
async function prepare() {
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
    token = result.token; submit.disabled = false;
    status.textContent = result.message;
    return true;
  } catch {
    submit.disabled = true;
    status.textContent = unavailableMessage;
    return false;
  }
}
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!token || submit.disabled || !form.reportValidity()) return;
  submit.disabled = true; form.setAttribute('aria-busy', 'true');
  status.textContent = 'Sending your message…';
  let failureMessage = 'Your message could not be confirmed as received. Please retry or contact us by email.';
  try {
    const response = await fetch(apiUrl('api/contact'), { method: 'POST', signal: AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...Object.fromEntries(new FormData(form)), token }) });
    const result = await response.json();
    if (!response.ok || result.accepted !== true) {
      if (typeof result.message === 'string') failureMessage = result.message;
      throw new Error();
    }
    status.textContent = result.message;
    form.reset(); token = null;
    const message = status.textContent;
    await prepare(); status.textContent = message;
  } catch {
    await prepare(); status.textContent = failureMessage;
  } finally { form.removeAttribute('aria-busy'); }
});
prepare();
