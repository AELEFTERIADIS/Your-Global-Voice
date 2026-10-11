import { randomBytes } from 'node:crypto';

export const categories = ['General Inquiries', 'Donations & Financial Support', 'Volunteering', 'Partnerships & Collaboration', 'Humanitarian Assistance', 'Animal Welfare', 'Environmental Protection', 'Other Inquiries'];
export const successMessage = 'Thank you for contacting Your Global Voice. Your message has been received, and our team will respond as soon as possible.';
export const recipientFor = (category) => category === 'Donations & Financial Support' ? 'support@ygvoice.org' : 'info@ygvoice.org';

export function validateInquiry(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 'Please provide your contact information.';
  if (typeof data.name !== 'string' || !data.name.trim() || data.name.length > 120 || /[\r\n\x00-\x1f\x7f]/.test(data.name)) return 'Please enter a valid full name.';
  if (typeof data.email !== 'string' || data.email.length > 254 || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(data.email)) return 'Please enter a valid email address.';
  if (!categories.includes(data.subject)) return 'Please choose an inquiry category.';
  if (typeof data.message !== 'string' || data.message.trim().length < 10 || data.message.length > 5000 || data.message.includes('\0')) return 'Please enter a message between 10 and 5,000 characters.';
  if (data.consent !== 'yes') return 'Please agree to the use of your information to respond.';
  return null;
}

export function providerTransport(env = process.env, request = fetch) {
  const key = env.CONTACT_MAIL_API_KEY;
  const from = env.CONTACT_MAIL_FROM;
  if (!key || !from || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(from)) return null;
  return async (data) => {
    const response = await request('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [recipientFor(data.subject)], reply_to: data.email,
        subject: `Your Global Voice: ${data.subject}`,
        text: `Full Name: ${data.name.trim()}\nEmail Address: ${data.email}\nInquiry Category: ${data.subject}\n\n${data.message.trim()}` })
    });
    const result = await response.json();
    if (!response.ok || typeof result.id !== 'string' || !result.id) throw new Error('Delivery service did not accept the message.');
    return result.id;
  };
}

export function createContactHandler({ send = providerTransport(), now = Date.now, siteOrigin = process.env.CONTACT_SITE_ORIGIN } = {}) {
  const sessions = new Map();
  const limits = new Map();
  const windowMs = 15 * 60 * 1000;
  const respond = (res, status, message, extra = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ message, ...extra }));
  };
  return async (req, res, path) => {
    if (!['/api/contact', '/api/contact/status'].includes(path)) return false;
    const ip = req.socket.remoteAddress;
    const time = now();
    for (const [token, session] of sessions) if (time - session.time > windowMs) sessions.delete(token);
    for (const [key, limit] of limits) if (time - limit.time > windowMs) limits.delete(key);
    if (path === '/api/contact/status' && req.method === 'GET') {
      if (!send) { respond(res, 503, 'Message delivery is not yet configured. Please use our email or WhatsApp contact.', { available: false }); return true; }
      const limit = limits.get(ip) || { time, attempts: 0, issued: 0 };
      if (limit.issued >= 20 || sessions.size >= 10000) { respond(res, 429, 'Please wait before trying again.'); return true; }
      limit.issued++; limits.set(ip, limit);
      const token = randomBytes(24).toString('hex'); sessions.set(token, { ip, time });
      respond(res, 200, 'You can send your message securely.', { available: true, token }); return true;
    }
    if (path !== '/api/contact' || req.method !== 'POST') { respond(res, 405, 'Method not allowed.'); return true; }
    const allowedOrigin = siteOrigin || (/^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host || '') ? `http://${req.headers.host}` : null);
    if (!allowedOrigin || req.headers.origin !== allowedOrigin) { respond(res, 403, 'This submission origin is not permitted.'); return true; }
    if (!send) { respond(res, 503, 'Message delivery is not yet configured. Please use our email or WhatsApp contact.'); return true; }
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) { respond(res, 415, 'Unsupported submission format.'); return true; }
    const limit = limits.get(ip) || { time, attempts: 0, issued: 0 };
    if (limit.attempts >= 5) { respond(res, 429, 'Too many attempts. Please wait 15 minutes before trying again.'); return true; }
    limit.attempts++; limits.set(ip, limit);
    try {
      const chunks = []; let bytes = 0;
      for await (const chunk of req) { bytes += chunk.length; if (bytes > 32768) { respond(res, 413, 'Your message is too large.'); return true; } chunks.push(chunk); }
      let data;
      try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { respond(res, 400, 'Invalid submission.'); return true; }
      const session = sessions.get(data?.token);
      if (!session || session.ip !== ip || time - session.time < 1000 || data.website) { respond(res, 400, 'Unable to verify this submission. Please refresh the page and try again.'); return true; }
      const error = validateInquiry(data);
      if (error) { respond(res, 400, error); return true; }
      sessions.delete(data.token);
      const accepted = await send(data);
      if (typeof accepted !== 'string' || !accepted) throw new Error('No acceptance identifier.');
      respond(res, 200, successMessage, { accepted: true });
    } catch { respond(res, 502, 'Your message could not be confirmed as received. Please retry or contact us by email.'); }
    return true;
  };
}
