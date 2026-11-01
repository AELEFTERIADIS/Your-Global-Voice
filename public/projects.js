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
