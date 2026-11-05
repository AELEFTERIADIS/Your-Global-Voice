// Server-owned attribution. IDs are stable accounting identifiers, not page URLs.
export const approvedCauseIds = Object.freeze([
  'human-rights-dignity',
  'humanitarian-assistance',
  'animal-welfare',
  'environmental-conservation'
]);
// Published identities cannot disappear, change kind, or acquire a new parent.
// Keep this history when adding projects; display names can evolve separately.
const establishedDesignations = Object.freeze([
  { id:'general-support', kind:'general' },
  ...approvedCauseIds.map(id => ({ id, kind:'cause' })),
  { id:'voices-for-dignity', kind:'project', causeId:'human-rights-dignity' }
].map(entry => Object.freeze(entry)));

export function validateRegistry(entries, previousEntries = establishedDesignations) {
  if (!Array.isArray(entries)) throw new TypeError('Invalid designation registry.');
  const ids = new Map();
  for (const entry of entries) {
    if (!entry || !/^[a-z][a-z0-9-]{1,63}$/.test(entry.id || '') || typeof entry.name !== 'string' || !entry.name.trim() || !['general', 'cause', 'project'].includes(entry.kind) || ids.has(entry.id)) throw new TypeError('Invalid or duplicate designation.');
    ids.set(entry.id, entry);
  }
  if (entries.filter(entry => entry.kind === 'general').length !== 1) throw new TypeError('One general designation is required.');
  const causes=entries.filter(entry => entry.kind === 'cause');
  if(causes.length!==approvedCauseIds.length || causes.some(entry=>!approvedCauseIds.includes(entry.id)))throw new TypeError('Exactly the four approved causes are required.');
  for (const entry of entries) {
    if (entry.kind === 'project' ? ids.get(entry.causeId)?.kind !== 'cause' : entry.causeId != null) throw new TypeError('Invalid cause/project relationship.');
  }
  for(const previous of [...establishedDesignations,...previousEntries]) {
    const entry=ids.get(previous.id);
    if(!entry || entry.kind!==previous.kind || (entry.causeId || null)!==(previous.causeId || null))throw new TypeError('Registered designation identity and parent cause are permanent.');
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
// Grouped view for cause selection/reporting. Each cause remains directly
// donatable by its own ID; projects retain their independent designation IDs.
// The legacy flat registry/order above is preserved for existing runs and APIs.
export const donationCauses = Object.freeze(donationRegistry.filter(entry => entry.kind === 'cause').map(cause => Object.freeze({
  ...cause,
  projects:Object.freeze(donationRegistry.filter(entry => entry.kind === 'project' && entry.causeId === cause.id))
})));
export const generalSupportDesignation = donationRegistry.find(entry => entry.kind === 'general');
export function resolveDesignation(id) {
  const entry = donationRegistry.find(item => item.id === id);
  if (!entry) throw new TypeError('Unknown donation designation.');
  return Object.freeze({ designationId: entry.id, kind: entry.kind, causeId: entry.kind === 'cause' ? entry.id : entry.causeId || null, projectId: entry.kind === 'project' ? entry.id : null });
}
