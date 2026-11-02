// Stripe credentials and session creation remain exclusively in the Worker.
for (const giving of document.querySelectorAll('.project-giving')) {
  const custom = giving.querySelector('.project-custom');
  const summary = giving.querySelector('.project-giving-summary');
  let checkoutAvailable = false, paypalAvailable = false, busy = false;
  const card = giving.querySelector('.project-payment-pending button');
  const paypal = giving.querySelector('.project-payment-pending button:last-child');
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
    paypal.disabled = !paypalAvailable || busy || selectedCents() === null;
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
      if (!returning && !cancelled) status.textContent = checkoutAvailable
        ? (paypalAvailable ? 'Card and PayPal checkout are available.' : 'Card checkout is available. PayPal is not available for this project yet.')
        : 'Card checkout is not enabled on the payment service yet. Please contact us for assistance.';
    }).catch(() => {
      checkoutAvailable = false;
      status.textContent = 'Unable to connect to the card checkout service. Please try again later.';
    }).finally(updateProjectAmount);
  }
  const paypalEndpoint = endpoint?.replace(/\/checkout$/, '/paypal');
  let paypalRequestId, paypalRequestAmount;
  const returnParams = new URLSearchParams(window.location.search || '');
  const returning = returnParams.has('paypal_return');
  const cancelled = returnParams.has('paypal_cancelled');
  if (paypalEndpoint) {
    fetch(paypalEndpoint + '/status', { mode: 'cors', credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(15000) }).then(async response => {
      paypalAvailable = response.ok && (await response.json()).available === true;
      if (!returning && !cancelled && paypalAvailable) status.textContent = checkoutAvailable ? 'Card and PayPal checkout are available.' : 'PayPal checkout is available.';
    }).catch(() => { paypalAvailable = false; }).finally(updateProjectAmount);
  }
  if (returning || cancelled) {
    // Remove approval data from the address bar; never display it or send it to analytics.
    const clean = new URL(window.location.href);
    for (const key of ['paypal_return', 'paypal_cancelled', 'token', 'PayerID']) clean.searchParams.delete(key);
    window.history.replaceState(null, '', clean.href);
    if (cancelled) status.textContent = 'PayPal checkout was cancelled. No payment has been confirmed.';
    else if (paypalEndpoint) {
      busy = true; updateProjectAmount();
      const approval = { orderId: returnParams.get('token'), nonce: returnParams.get('paypal_return') };
      status.textContent = 'Confirming your PayPal payment. Please wait.';
      fetch(paypalEndpoint + '/capture', { method: 'POST', mode: 'cors', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(approval), signal: AbortSignal.timeout(25000) }).then(async response => {
        const data = await response.json();
        if (!response.ok || data.completed !== true) throw new Error('Not confirmed');
        status.textContent = 'Thank you. Your PayPal donation to Voices for Dignity has been completed successfully.';
      }).catch(() => { status.textContent = 'Your PayPal payment could not be confirmed. Please contact us before starting another donation.'; }).finally(() => { busy = false; updateProjectAmount(); });
    } else status.textContent = 'Your PayPal payment could not be confirmed. Please contact us for assistance.';
  }
  paypal.addEventListener('click', async () => {
    const amountCents = selectedCents();
    if (!paypalAvailable || busy || amountCents === null) return;
    if (!paypalRequestId || paypalRequestAmount !== amountCents) { paypalRequestId = crypto.randomUUID(); paypalRequestAmount = amountCents; }
    busy = true; updateProjectAmount();
    try {
      const response = await fetch(paypalEndpoint + '/orders', { method: 'POST', mode: 'cors', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amountCents, requestId: paypalRequestId }), signal: AbortSignal.timeout(25000) });
      const data = await response.json(); if (!response.ok) throw new Error('PayPal unavailable');
      const url = new URL(data.url);
      if (url.origin !== 'https://www.paypal.com' || !['/checkoutnow', '/checkoutnow/'].includes(url.pathname)) throw new Error('Invalid approval URL');
      window.location.assign(url.href);
    } catch { status.textContent = 'Unable to start PayPal checkout. No payment has been confirmed. Please try again.'; }
    finally { busy = false; updateProjectAmount(); }
  });
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
