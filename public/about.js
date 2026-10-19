const toggle = document.querySelector('.about-who-toggle');
const content = document.querySelector('#about-who-expanded');
const copy = document.querySelector('.about-who-copy');
const secondParagraph = copy.querySelectorAll('p')[1];
const mobile = window.matchMedia('(max-width: 42rem)');

function placeSecondParagraph() {
  if (mobile.matches) {
    content.prepend(secondParagraph);
  } else {
    copy.insertBefore(secondParagraph, toggle);
  }
}

mobile.addEventListener('change', placeSecondParagraph);
placeSecondParagraph();


toggle.addEventListener('click', () => {
  const expanded = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(expanded));
  toggle.textContent = expanded ? 'Read Less' : 'Read More';
  content.hidden = !expanded;
});
