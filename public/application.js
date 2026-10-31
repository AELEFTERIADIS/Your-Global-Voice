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

// Searchable single-choice country control; the hidden location field is submitted.
const countryField = applicationForm.querySelector('.application-country');
const countrySearch = countryField.querySelector('[role="combobox"]');
const countryValue = countryField.querySelector('[name="location"]');
const countryList = countryField.querySelector('[role="listbox"]');
const countryToggle = countryField.querySelector('.country-toggle');
const countryOptions = [...countryList.querySelectorAll('[role="option"]')];
const countryManual = countryField.querySelector('.country-manual');
const countryOther = countryManual.querySelector('input');
const normalizeCountry = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en');
let activeCountry = -1;
let visibleCountries = countryOptions;

function closeCountries() {
  countryList.hidden = true;
  countrySearch.setAttribute('aria-expanded', 'false');
  countryToggle.setAttribute('aria-expanded', 'false');
  countrySearch.removeAttribute('aria-activedescendant');
  activeCountry = -1;
}
function markCountry(index) {
  activeCountry = index;
  for (const option of countryOptions) option.classList.remove('country-active');
  const option = visibleCountries[index];
  if (option) {
    option.classList.add('country-active');
    countrySearch.setAttribute('aria-activedescendant', option.id);
    option.scrollIntoView({ block: 'nearest' });
  } else countrySearch.removeAttribute('aria-activedescendant');
}
function showCountries(showAll = false) {
  const query = showAll ? '' : normalizeCountry(countrySearch.value.trim());
  let matches = 0;
  for (const option of countryOptions) {
    const match = normalizeCountry(option.dataset.country).includes(query);
    option.hidden = !match && option.dataset.country !== 'Other';
    if (match && option.dataset.country !== 'Other') matches++;
  }
  visibleCountries = countryOptions.filter(option => !option.hidden);
  countryList.querySelector('.country-no-results').hidden = matches > 0 || !query || query === 'other';
  countryList.hidden = false;
  countrySearch.setAttribute('aria-expanded', 'true');
  countryToggle.setAttribute('aria-expanded', 'true');
  markCountry(-1);
}
function updateManualCountry() {
  const other = countryValue.value === 'Other';
  countryManual.hidden = !other;
  countryOther.disabled = !other;
  countryOther.required = other;
}
function selectCountry(option) {
  countryValue.value = option.dataset.country;
  countrySearch.value = countryValue.value;
  countrySearch.setCustomValidity('');
  for (const item of countryOptions) item.setAttribute('aria-selected', String(item === option));
  updateManualCountry();
  closeCountries();
}
countrySearch.addEventListener('focus', () => showCountries(countrySearch.value === countryValue.value));
countrySearch.addEventListener('input', () => {
  const exact = countryOptions.find(option => normalizeCountry(option.dataset.country) === normalizeCountry(countrySearch.value.trim()));
  countryValue.value = exact ? exact.dataset.country : '';
  for (const item of countryOptions) item.setAttribute('aria-selected', String(item === exact));
  countrySearch.setCustomValidity(countrySearch.value.trim() && !exact ? 'Please select a country from the list, or choose Other.' : '');
  updateManualCountry();
  showCountries();
});
countrySearch.addEventListener('blur', event => {
  if (event.relatedTarget === countryToggle) return;
  const exact = countryOptions.find(option => normalizeCountry(option.dataset.country) === normalizeCountry(countrySearch.value.trim()));
  if (exact) selectCountry(exact);
});
countrySearch.addEventListener('keydown', event => {
  if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
    event.preventDefault();
    if (countryList.hidden) showCountries(true);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    markCountry(activeCountry < 0 ? (step > 0 ? 0 : visibleCountries.length - 1) : (activeCountry + step + visibleCountries.length) % visibleCountries.length);
  } else if (event.key === 'Enter' && !countryList.hidden) {
    event.preventDefault();
    if (activeCountry >= 0) selectCountry(visibleCountries[activeCountry]);
    else if (visibleCountries.length === 1) selectCountry(visibleCountries[0]);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closeCountries();
  } else if (event.key === 'Tab') closeCountries();
});
countryToggle.addEventListener('click', () => {
  if (!countryList.hidden) closeCountries();
  else { countrySearch.focus(); showCountries(true); }
});
countryList.addEventListener('mousedown', event => event.preventDefault());
countryList.addEventListener('click', event => {
  const option = event.target.closest('[role="option"]');
  if (option) selectCountry(option);
});
document.addEventListener('click', event => {
  if (!countryField.contains(event.target)) closeCountries();
});
document.addEventListener('focusin', event => {
  if (!countryField.contains(event.target)) closeCountries();
});
applicationForm.addEventListener('reset', () => setTimeout(() => {
  countrySearch.value = '';
  countrySearch.setCustomValidity('');
  countryValue.value = '';
  for (const option of countryOptions) option.setAttribute('aria-selected', 'false');
  updateManualCountry();
  closeCountries();
}, 0));
updateManualCountry();
closeCountries();
