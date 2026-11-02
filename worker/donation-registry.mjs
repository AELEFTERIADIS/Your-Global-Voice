// Server-owned attribution. IDs are stable accounting identifiers, not page URLs.
export function validateRegistry(entries) {
  if (!Array.isArray(entries)) throw new TypeError('Invalid designation registry.');
  const ids = new Map();
  for (const entry of entries) {
    if (!entry || !/^[a-z][a-z0-9-]{1,63}$/.test(entry.id || '') || typeof entry.name !== 'string' || !entry.name.trim() || !['general', 'cause', 'project'].includes(entry.kind) || ids.has(entry.id)) throw new TypeError('Invalid or duplicate designation.');
    ids.set(entry.id, entry);
  }
  if (entries.filter(entry => entry.kind === 'general').length !== 1) throw new TypeError('One general designation is required.');
  for (const entry of entries) {
    if (entry.kind === 'project' ? ids.get(entry.causeId)?.kind !== 'cause' : entry.causeId != null) throw new TypeError('Invalid cause/project relationship.');
  }
  return Object.freeze(entries.map(entry => Object.freeze({ ...entry })));
}
export const donationRegistry = validateRegistry([
  { id: 'general-support', kind: 'general', name: 'General Support' },
  { id: 'human-rights-dignity', kind: 'cause', name: 'Human Rights & Dignity' },
  { id: 'humanitarian-assistance', kind: 'cause', name: 'Humanitarian Assistance and Relief' },
  { id: 'animal-welfare', kind: 'cause', name: 'Animal Welfare' },
  { id: 'environmental-conservation', kind: 'cause', name: 'Environmental Conservation and Sustainability' },
  { id: 'voices-for-dignity', kind: 'project', causeId: 'human-rights-dignity', name: 'Voices for Dignity' }
]);
export function resolveDesignation(id) {
  const entry = donationRegistry.find(item => item.id === id);
  if (!entry) throw new TypeError('Unknown donation designation.');
  return Object.freeze({ designationId: entry.id, kind: entry.kind, causeId: entry.kind === 'cause' ? entry.id : entry.causeId || null, projectId: entry.kind === 'project' ? entry.id : null });
}
