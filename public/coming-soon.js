// Keep permanent cause identities in URLs without creating separate placeholder pages.
const causes = new Set(['human-rights-dignity', 'humanitarian-assistance', 'animal-welfare', 'environmental-conservation']);
const cause = new URLSearchParams(location.search).get('cause');
const back = document.querySelector('.coming-soon-back');
if (back) {
 if (causes.has(cause)) back.href = 'projects.html#projects-' + cause;
 back.addEventListener('click', event => {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  let previous;
  try { previous = new URL(document.referrer); } catch { return; }
  if (previous.origin === location.origin && /\/projects(?:\.html)?\/?$/.test(previous.pathname) && history.length > 1) {
   event.preventDefault();
   history.back();
  }
 });
}
