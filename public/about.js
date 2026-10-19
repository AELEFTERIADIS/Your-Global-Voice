const toggle = document.querySelector('.about-who-toggle');
const content = document.querySelector('#about-who-expanded');

toggle.addEventListener('click', () => {
  const expanded = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(expanded));
  toggle.textContent = expanded ? 'Read Less' : 'Read More';
  content.hidden = !expanded;
});
