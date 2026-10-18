const selector = document.querySelector('.donation-selector');
const custom = document.querySelector('#giving-custom');
const summary = document.querySelector('#giving-summary');
function updateSelection() {
  const amount = selector.querySelector('[name="giving-amount"]:checked').value;
  const frequency = selector.querySelector('[name="giving-frequency"]:checked').value;
  custom.disabled = amount !== 'custom';
  if (amount === 'custom' && (!custom.value || !custom.checkValidity())) {
    summary.textContent = 'Enter a custom amount of $1 or more, with up to two decimal places.';
    return;
  }
  const value = Number(amount === 'custom' ? custom.value : amount);
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  summary.textContent = `Your choice: ${formatted} USD · ${frequency === 'monthly' ? 'Monthly Donation' : 'One-Time Donation'}.`;
}
selector.addEventListener('change', updateSelection);
custom.addEventListener('input', updateSelection);
updateSelection();

// Keep anchored payment navigation clear of the responsive header.
const paymentSection = document.querySelector('#donation-payment');
const siteHeader = document.querySelector('.site-header');
const paymentHash = '#donation-payment';
function updateHeaderOffset() {
  document.documentElement.style.setProperty('--donation-header-offset', `${siteHeader.getBoundingClientRect().height + 8}px`);
}
function landOnPayment() {
  if (location.hash !== paymentHash) return;
  updateHeaderOffset();
  requestAnimationFrame(() => paymentSection.scrollIntoView({ block: 'start' }));
}
new ResizeObserver(updateHeaderOffset).observe(siteHeader);
window.addEventListener('load', landOnPayment);
window.addEventListener('pageshow', landOnPayment);
window.addEventListener('hashchange', landOnPayment);
document.querySelectorAll('a[href="donate.html#donation-payment"]').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('.mobile-menu')?.removeAttribute('open');
    requestAnimationFrame(landOnPayment);
  });
});
updateHeaderOffset();
landOnPayment();
