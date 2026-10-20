const toggle = document.querySelector('.about-who-toggle');
const content = document.querySelector('#about-who-expanded');
const copy = document.querySelector('.about-who-copy');
const secondParagraph = copy.querySelectorAll('p')[1];
const mobile = window.matchMedia('(max-width: 42rem)');
const desktop = window.matchMedia('(min-width: 64.0625rem)');

function placeSecondParagraph() {
  copy.append(toggle);
  if (mobile.matches) {
    content.prepend(secondParagraph);
  } else {
    copy.insertBefore(secondParagraph, toggle);
    if (desktop.matches) secondParagraph.append(toggle);
  }
}

mobile.addEventListener('change', placeSecondParagraph);
desktop.addEventListener('change', placeSecondParagraph);
placeSecondParagraph();


toggle.addEventListener('click', () => {
  const expanded = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(expanded));
  toggle.textContent = expanded ? 'Read Less' : 'Read More';
  content.hidden = !expanded;
});

const image = document.querySelector('.about-who-image');

function alignImageBottom() {
  if (!desktop.matches) {
    image.style.removeProperty('--about-image-height');
    image.style.removeProperty('--about-image-offset');
    return;
  }
  const text = secondParagraph.firstChild;
  const start = text.textContent.indexOf('As an independent, nonpartisan organization');
  const range = document.createRange();
  range.setStart(text, start);
  range.setEnd(text, start + 'As an independent, nonpartisan organization'.length);
  const line = range.getClientRects()[0];
  const statement = copy.querySelector('.about-who-statement');
  const statementSpace = statement.getBoundingClientRect().height + parseFloat(getComputedStyle(statement).marginBottom);
  const frameTop = image.parentElement.getBoundingClientRect().top;
  const height = line.top - frameTop - statementSpace;
  const firstLine = document.createRange();
  const firstText = copy.querySelector('p').firstChild;
  firstLine.setStart(firstText, 0);
  firstLine.setEnd(firstText, 'Your Global Voice, Inc.'.length);
  image.style.setProperty('--about-image-offset', `${firstLine.getClientRects()[0].top - frameTop}px`);
  if (height > 0) image.style.setProperty('--about-image-height', `${height}px`);
}

new ResizeObserver(alignImageBottom).observe(copy);
desktop.addEventListener('change', alignImageBottom);
window.addEventListener('load', alignImageBottom);
document.fonts.ready.then(alignImageBottom);
alignImageBottom();

document.querySelectorAll('.about-leadership-toggle').forEach(biographyToggle => {
  const biographyExpanded = document.getElementById(biographyToggle.getAttribute('aria-controls'));
  biographyToggle.addEventListener('click', () => {
    const expanded = biographyToggle.getAttribute('aria-expanded') !== 'true';
    biographyToggle.setAttribute('aria-expanded', String(expanded));
    biographyToggle.textContent = expanded ? 'Read Less' : 'Read More';
    biographyExpanded.hidden = !expanded;
  });
});
