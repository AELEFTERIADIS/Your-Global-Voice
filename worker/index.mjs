import { providerTransport, validateInquiry, successMessage } from '../scripts/contact-delivery.mjs';

const unavailable = 'Message delivery is unavailable. Please use our email or WhatsApp contact.';
const json = (status, message, extra = {}) => Response.json({ message, ...extra }, { status, headers: { 'Cache-Control': 'no-store' } });

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (!['/api/contact', '/api/contact/status'].includes(path)) return json(404, 'Not found.');
    // The browser never receives credentials; deny every other website origin.
    const origin = request.headers.get('Origin');
    const allowedOrigins = new Set((env.CONTACT_SITE_ORIGINS || env.CONTACT_SITE_ORIGIN || '').split(',').map(value => value.trim()).filter(Boolean));
    if (!origin || !allowedOrigins.has(origin)) return json(403, 'This submission origin is not permitted.');
    const cors = { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin', 'Cache-Control': 'no-store' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
    let response;
    try {
      if (!env.RESEND_API_KEY || !env.CONTACT_MAIL_FROM) response = json(503, unavailable, { available: false });
      else {
        // Hash Cloudflare's trusted client address. Never trust user-supplied forwarded headers.
        const ip = request.headers.get('CF-Connecting-IP');
        if (!ip) return json(403, 'Unable to verify this submission.');
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.RESEND_API_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const hash = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip));
        const id = env.CONTACT_LIMITS.idFromName(Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join(''));
        response = await env.CONTACT_LIMITS.get(id).fetch(request);
      }
    } catch { response = json(502, 'Your message could not be confirmed as received. Please retry or contact us by email.'); }
    const result = new Response(response.body, response);
    for (const [name, value] of Object.entries(cors)) result.headers.set(name, value);
    return result;
  }
};

export class ContactLimits {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch(request) {
    // Persist rate limits and single-use tokens across restarts, serializing submissions.
    return this.state.blockConcurrencyWhile(async () => {
      const now = Date.now();
      const storage = this.state.storage;
      let record = await storage.get('window');
      if (!record || now - record.start >= 900000) record = { start: now, attempts: 0, issued: 0, tokens: {} };
      const path = new URL(request.url).pathname;
      if (path === '/api/contact/status' && request.method === 'GET') {
        if (record.issued >= 20 || record.attempts >= 5) return json(429, 'Please wait 15 minutes before trying again.');
        const token = crypto.randomUUID(); record.tokens[token] = now; record.issued++;
        await storage.put('window', record); await storage.setAlarm(record.start + 900000);
        return json(200, 'You can send your message securely.', { available: true, token });
      }
      if (path !== '/api/contact' || request.method !== 'POST') return json(405, 'Method not allowed.');
      if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) return json(415, 'Unsupported submission format.');
      if (record.attempts >= 5) return json(429, 'Too many attempts. Please wait 15 minutes before trying again.');
      record.attempts++; await storage.put('window', record); await storage.setAlarm(record.start + 900000);
      const reader = request.body?.getReader(); const chunks = []; let size = 0;
      if (!reader) return json(400, 'Invalid submission.');
      while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 32768) { await reader.cancel(); return json(413, 'Your message is too large.'); } chunks.push(value); }
      const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      let data; try { data = JSON.parse(new TextDecoder().decode(bytes)); } catch { return json(400, 'Invalid submission.'); }
      const issued = record.tokens[data?.token];
      if (typeof issued !== 'number' || now - issued < 1000 || now - issued >= 900000 || data.website) return json(400, 'Unable to verify this submission. Please refresh the page and try again.');
      const error = validateInquiry(data); if (error) return json(400, error);
      delete record.tokens[data.token]; await storage.put('window', record);
      const send = providerTransport({ CONTACT_MAIL_API_KEY: this.env.RESEND_API_KEY, CONTACT_MAIL_FROM: this.env.CONTACT_MAIL_FROM });
      if (!send) return json(503, unavailable);
      try { await send(data); return json(200, successMessage, { accepted: true }); }
      catch { return json(502, 'Your message could not be confirmed as received. Please retry or contact us by email.'); }
    });
  }
  async alarm() { await this.state.storage.deleteAll(); }
}
