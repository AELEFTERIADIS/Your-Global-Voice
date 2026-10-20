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

const leadershipProfiles = [...document.querySelectorAll('.about-leadership-profile')];

function alignLeadershipDividers() {
  leadershipProfiles.slice(1).forEach((profile, index) => {
    const previous = leadershipProfiles[index];
    const visibleContent = [...previous.querySelectorAll('.about-leadership-portrait, h3, .about-leadership-position, .about-leadership-biography')]
      .map(element => element.getBoundingClientRect())
      .filter(rect => rect.width && rect.height);
    const previousBottom = Math.max(...visibleContent.map(rect => rect.bottom));
    const nextTop = profile.querySelector('.about-leadership-portrait').getBoundingClientRect().top;
    const dividerTop = (previousBottom + nextTop - 1) / 2;
    profile.style.setProperty('--leadership-divider-offset', `${dividerTop - profile.getBoundingClientRect().top}px`);
  });
}

const leadershipDividerObserver = new ResizeObserver(alignLeadershipDividers);
leadershipProfiles.forEach(profile => leadershipDividerObserver.observe(profile));
document.fonts.ready.then(alignLeadershipDividers);
window.addEventListener('load', alignLeadershipDividers);
alignLeadershipDividers();

// Keep the original desktop destination; compact screens open the existing message form.
const messageLink = document.querySelector('.about-final-actions > a:first-child');
const originalMessageDestination = messageLink.getAttribute('href');
const compactMessageNavigation = window.matchMedia('(max-width: 64rem)');
function updateMessageDestination() {
  messageLink.setAttribute('href', compactMessageNavigation.matches
    ? 'contact.html#message-heading'
    : originalMessageDestination);
}
compactMessageNavigation.addEventListener('change', updateMessageDestination);
updateMessageDestination();
