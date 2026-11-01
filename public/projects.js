// Selection only: project payments deliberately have no destination or handler.
for (const giving of document.querySelectorAll('.project-giving')) {
  const custom = giving.querySelector('.project-custom');
  const summary = giving.querySelector('.project-giving-summary');
  function updateProjectAmount() {
    const choice = giving.querySelector('[name="dignity-amount"]:checked').value;
    custom.disabled = choice !== 'custom';
    if (choice === 'custom' && (!custom.value || !custom.checkValidity())) {
      summary.textContent = 'Enter a custom amount of $1 or more, with up to two decimal places.';
      return;
    }
    const amount = Number(choice === 'custom' ? custom.value : choice);
    summary.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount) + ' USD selected.';
  }
  giving.addEventListener('change', updateProjectAmount);
  custom.addEventListener('input', updateProjectAmount);
  updateProjectAmount();
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
