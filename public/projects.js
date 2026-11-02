// Stripe credentials and session creation remain exclusively in the Worker.
for (const giving of document.querySelectorAll('.project-giving')) {
  const custom = giving.querySelector('.project-custom');
  const summary = giving.querySelector('.project-giving-summary');
  let checkoutAvailable = false, busy = false;
  const card = giving.querySelector('.project-payment-pending button');
  const status = giving.querySelector('#dignity-payment-status');
  const api = document.querySelector('meta[name="ygv-contact-api"]')?.content;
  const endpoint = api && /^https:\/\/[a-z0-9.-]+\.workers\.dev$/.test(api) ? api + '/api/projects/dignity/checkout' : null;
  function selectedCents() {
    const choice = giving.querySelector('[name="dignity-amount"]:checked').value;
    const value = choice === 'custom' ? custom.value : choice;
    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
    const [whole, fraction = ''] = value.split('.');
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    return Number.isSafeInteger(cents) && cents >= 100 && cents <= 1000000 ? cents : null;
  }
  function updateProjectAmount() {
    card.disabled = !checkoutAvailable || busy || selectedCents() === null;
    const choice = giving.querySelector('[name="dignity-amount"]:checked').value;
    custom.disabled = choice !== 'custom';
    if (choice === 'custom' && (!custom.value || !custom.checkValidity() || selectedCents() === null)) {
      summary.textContent = 'Enter $1–$10,000 USD, with up to two decimal places.';
      return;
    }
    const amount = Number(choice === 'custom' ? custom.value : choice);
    summary.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount) + ' USD selected.';
  }
  giving.addEventListener('change', updateProjectAmount);
  custom.addEventListener('input', updateProjectAmount);
  updateProjectAmount();
  if (!endpoint) {
    status.textContent = 'Card checkout connection is not configured. Please contact us for assistance.';
  } else {
    fetch(endpoint + '/status', { mode: 'cors', credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(10000) }).then(async response => {
      if (!response.ok) {
        status.textContent = `Card checkout availability check failed (HTTP ${response.status}). Please try again later.`;
        return;
      }
      let data;
      try { data = await response.json(); } catch {
        status.textContent = 'The card checkout service returned an invalid response. Please try again later.';
        return;
      }
      if (typeof data?.available !== 'boolean') {
        status.textContent = 'The card checkout service returned an invalid response. Please try again later.';
        return;
      }
      checkoutAvailable = data.available === true;
      status.textContent = checkoutAvailable
        ? 'Card checkout is available. PayPal is not available for this project yet.'
        : 'Card checkout is not enabled on the payment service yet. Please contact us for assistance.';
    }).catch(() => {
      checkoutAvailable = false;
      status.textContent = 'Unable to connect to the card checkout service. Please try again later.';
    }).finally(updateProjectAmount);
  }
  card.addEventListener('click', async () => {
    const amountCents = selectedCents();
    if (!checkoutAvailable || busy || amountCents === null) return;
    busy = true; updateProjectAmount();
    try {
      const response = await fetch(endpoint, { method: 'POST', mode: 'cors', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amountCents, requestId: crypto.randomUUID() }), signal: AbortSignal.timeout(20000) });
      const data = await response.json();
      if (!response.ok) throw new Error('Checkout unavailable');
      const url = new URL(data.url);
      if (url.origin !== 'https://checkout.stripe.com') throw new Error('Invalid checkout');
      window.location.assign(url.href);
    } catch { status.textContent = 'Unable to start checkout. No payment has been confirmed. Please try again.'; }
    finally { busy = false; updateProjectAmount(); }
  });
}

// Full description on larger screens; phones retain an optional disclosure.
const projectPhoneLayout = window.matchMedia('(max-width: 42rem)');
for (const details of document.querySelectorAll('.project-read-more')) {
  let phoneExpanded = false;
  function syncProjectDescription() { details.open = !projectPhoneLayout.matches || phoneExpanded; }
  details.addEventListener('toggle', () => { if (projectPhoneLayout.matches) phoneExpanded = details.open; });
  projectPhoneLayout.addEventListener('change', syncProjectDescription);
  syncProjectDescription();
}
