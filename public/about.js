const toggle = document.querySelector('.about-who-toggle');
const content = document.querySelector('#about-who-expanded');
const copy = document.querySelector('.about-who-copy');
const secondParagraph = copy.querySelectorAll('p')[1];
const design = getComputedStyle(document.documentElement);
const mobile = window.matchMedia(`(max-width: ${design.getPropertyValue('--breakpoint-phone').trim()})`);
const desktop = window.matchMedia(`(min-width: ${design.getPropertyValue('--breakpoint-editorial-start').trim()})`);

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
    return;
  }
  const text = secondParagraph.firstChild;
  const start = text.textContent.indexOf('As an independent, nonpartisan organization');
  const range = document.createRange();
  range.setStart(text, start);
  range.setEnd(text, start + 'As an independent, nonpartisan organization'.length);
  const line = range.getClientRects()[0];
  const height = line.top - image.getBoundingClientRect().top;
  if (height > 0) image.style.setProperty('--about-image-height', `${height}px`);
}

new ResizeObserver(alignImageBottom).observe(copy);
desktop.addEventListener('change', alignImageBottom);
window.addEventListener('load', alignImageBottom);
document.fonts.ready.then(alignImageBottom);
alignImageBottom();
