// Native disclosure controls retain keyboard access and real checkbox semantics.
const applicationForm = document.querySelector('[data-application]');
const dropdowns = [...applicationForm.querySelectorAll('.application-multiselect')];
function updateApplicationSelections() {
  for (const dropdown of dropdowns) {
    const selected = [...dropdown.querySelectorAll('input:checked')].map(input => input.value);
    dropdown.querySelector('.application-selected').textContent = selected.join(', ') || 'Select one or more';
  }
  const other = applicationForm.querySelector('.application-other');
  const enabled = applicationForm.querySelector('[name="interests"][value="Other"]').checked;
  other.hidden = !enabled;
  other.querySelector('input').disabled = !enabled;
}
applicationForm.addEventListener('change', updateApplicationSelections);
applicationForm.addEventListener('reset', () => {
  for (const dropdown of dropdowns) dropdown.open = false;
  // The reset event fires before the browser restores checkbox defaults.
  setTimeout(updateApplicationSelections, 0);
});
for (const dropdown of dropdowns) {
  dropdown.addEventListener('toggle', () => {
    if (dropdown.open) for (const sibling of dropdowns) if (sibling !== dropdown) sibling.open = false;
  });
  dropdown.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      dropdown.open = false;
      dropdown.querySelector('summary').focus();
      event.preventDefault();
    }
  });
}
document.addEventListener('click', event => {
  for (const dropdown of dropdowns) if (!dropdown.contains(event.target)) dropdown.open = false;
});
updateApplicationSelections();
