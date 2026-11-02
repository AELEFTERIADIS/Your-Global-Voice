const root = '/api/projects/dignity/paypal';
const api = 'https://api-m.paypal.com';
const reply = (status, data) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const ready = env => env.PAYPAL_CHECKOUT_ENABLED === 'true' && !!env.PAYPAL_CLIENT_ID && !!env.PAYPAL_CLIENT_SECRET && !!env.CONTACT_LIMITS;
const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const orderId = value => typeof value === 'string' && /^[A-Z0-9]{10,32}$/.test(value);
class PayPalAuthError extends Error {
  constructor(reason) { super('PayPal authentication failed'); this.reason = reason; }
}
let cachedToken;
async function accessToken(env, transport) {
  if (cachedToken?.client === env.PAYPAL_CLIENT_ID && cachedToken.secret === env.PAYPAL_CLIENT_SECRET && cachedToken.expires > Date.now()) return cachedToken.token;
  const response = await transport(api + '/v1/oauth2/token', { method: 'POST', headers: { Authorization: 'Basic ' + btoa(env.PAYPAL_CLIENT_ID + ':' + env.PAYPAL_CLIENT_SECRET), 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials', signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new PayPalAuthError(response.status === 401 ? 'paypal_credentials_rejected' : response.status === 403 ? 'paypal_access_denied' : response.status >= 500 ? 'paypal_service_unavailable' : 'paypal_authentication_failed');
  let data; try { data = await response.json(); } catch { throw new PayPalAuthError('paypal_invalid_response'); }
  if (typeof data.access_token !== 'string' || !data.access_token || !(Number(data.expires_in) > 60)) throw new PayPalAuthError('paypal_invalid_response');
  cachedToken = { client: env.PAYPAL_CLIENT_ID, secret: env.PAYPAL_CLIENT_SECRET, token: data.access_token, expires: Date.now() + Math.min(Number(data.expires_in) - 60, 300) * 1000 };
  return data.access_token;
}
async function readBody(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) throw new Error('Invalid request');
  const reader = request.body?.getReader(); if (!reader) throw new Error('Invalid request');
  let size = 0, text = ''; const decoder = new TextDecoder();
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 1024) { await reader.cancel(); throw new Error('Invalid request'); } text += decoder.decode(value, { stream: true }); }
  return JSON.parse(text + decoder.decode());
}
export function paypalApprovalURL(value) {
  const url = new URL(value);
  if (url.origin !== 'https://www.paypal.com' || !['/checkoutnow', '/checkoutnow/'].includes(url.pathname)) throw new Error('Invalid approval URL');
  return url.href;
}
export async function paypalRequest(request, env, transport = fetch) {
  const origin = request.headers.get('Origin');
  const allowed = (env.CONTACT_SITE_ORIGINS || env.CONTACT_SITE_ORIGIN || '').split(',').map(s => s.trim());
  if (!origin || !allowed.includes(origin)) return reply(403, { message: 'Origin not permitted.' });
  let result;
  try {
    const path = new URL(request.url).pathname;
    if (request.method === 'OPTIONS') result = new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
    else if (path === root + '/status' && request.method === 'GET') {
      const missing = [];
      if (env.PAYPAL_CHECKOUT_ENABLED !== 'true') missing.push('PAYPAL_CHECKOUT_ENABLED');
      if (!env.PAYPAL_CLIENT_ID) missing.push('PAYPAL_CLIENT_ID');
      if (!env.PAYPAL_CLIENT_SECRET) missing.push('PAYPAL_CLIENT_SECRET');
      if (!env.CONTACT_LIMITS) missing.push('CONTACT_LIMITS');
      if (missing.length) result = reply(200, { available: false, reason: 'configuration_incomplete', missing });
      else {
        try { await accessToken(env, transport); result = reply(200, { available: true }); }
        catch (error) { result = reply(200, { available: false, reason: error instanceof PayPalAuthError ? error.reason : 'paypal_unreachable' }); }
      }
    } else if (request.method !== 'POST' || ![root + '/orders', root + '/capture'].includes(path)) result = reply(405, { message: 'Method not allowed.' });
    else if (!ready(env)) result = reply(503, { message: 'PayPal checkout is not available yet.' });
    else {
      let data; try { data = await readBody(request); } catch { return withCors(reply(400, { message: 'Invalid request.' }), origin); }
      if (path.endsWith('/capture')) {
        if (!orderId(data?.orderId) || !uuid(data?.nonce)) result = reply(400, { message: 'Invalid approval.' });
        else result = await env.CONTACT_LIMITS.get(env.CONTACT_LIMITS.idFromName('paypal-order:' + data.orderId)).fetch(new Request('https://internal/paypal/capture', { method: 'POST', body: JSON.stringify(data) }));
      } else {
        if (!Number.isSafeInteger(data?.amountCents) || data.amountCents < 100 || data.amountCents > 1000000 || !uuid(data?.requestId)) result = reply(400, { message: 'Choose $1–$10,000 USD.' });
        else {
          const ip = request.headers.get('CF-Connecting-IP');
          if (!ip) result = reply(403, { message: 'Unable to verify request.' });
          else {
            const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.PAYPAL_CLIENT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
            const hash = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip));
            const name = 'paypal-ip:' + Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
            result = await env.CONTACT_LIMITS.get(env.CONTACT_LIMITS.idFromName(name)).fetch(new Request('https://internal/paypal/create', { method: 'POST', body: JSON.stringify(data) }));
          }
        }
      }
    }
  } catch { result = reply(502, { message: 'Unable to confirm PayPal checkout. Please try again.' }); }
  return withCors(result, origin);
}
function withCors(response, origin) { const result = new Response(response.body, response); result.headers.set('Access-Control-Allow-Origin', origin); result.headers.set('Vary', 'Origin'); return result; }
export async function paypalDurable(request, env, storage, transport = fetch) {
  const path = new URL(request.url).pathname, now = Date.now();
  const data = await request.json();
  if (path === '/paypal/store') {
    if (await storage.get('paypal-order')) return reply(409, { message: 'Order already exists.' });
    await storage.put('paypal-order', data); await storage.setAlarm(data.expires); return reply(200, { stored: true });
  }
  if (path === '/paypal/create') {
    let rate = await storage.get('paypal-rate'); if (!rate || now - rate.start >= 900000) rate = { start: now, count: 0 };
    if (rate.count >= 5) return reply(429, { message: 'Please wait 15 minutes before trying again.' });
    rate.count++; await storage.put('paypal-rate', rate); await storage.setAlarm(rate.start + 900000);
    // Persist the request identity and nonce before contacting PayPal so retries are stable.
    let attempt = await storage.get('paypal-attempt:' + data.requestId);
    if (attempt && attempt.amountCents !== data.amountCents) return reply(409, { message: 'Please start a new donation.' });
    if (attempt?.url) return reply(200, { url: attempt.url });
    if (!attempt) { attempt = { amountCents: data.amountCents, nonce: crypto.randomUUID() }; await storage.put('paypal-attempt:' + data.requestId, attempt); }
    try {
      const token = await accessToken(env, transport);
      const amount = (data.amountCents / 100).toFixed(2);
      const response = await transport(api + '/v2/checkout/orders', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'PayPal-Request-Id': data.requestId, Prefer: 'return=representation' }, body: JSON.stringify({ intent: 'CAPTURE', purchase_units: [{ reference_id: 'voices-for-dignity', custom_id: 'voices-for-dignity', description: 'Voices for Dignity donation', amount: { currency_code: 'USD', value: amount } }], payment_source: { paypal: { experience_context: { user_action: 'PAY_NOW', shipping_preference: 'NO_SHIPPING', return_url: 'https://ygvoice.org/projects.html?paypal_return=' + attempt.nonce, cancel_url: 'https://ygvoice.org/projects.html?paypal_cancelled=1' } } } }), signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('PayPal unavailable');
      const order = await response.json(); if (!orderId(order.id)) throw new Error('Invalid order');
      const url = paypalApprovalURL(order.links?.find(link => ['payer-action', 'approve'].includes(link.rel))?.href);
      if (new URL(url).searchParams.get('token') !== order.id) throw new Error('Invalid order link');
      const stored = await env.CONTACT_LIMITS.get(env.CONTACT_LIMITS.idFromName('paypal-order:' + order.id)).fetch(new Request('https://internal/paypal/store', { method: 'POST', body: JSON.stringify({ orderId: order.id, nonce: attempt.nonce, amount, expires: now + 86400000, captureId: crypto.randomUUID(), attempts: 0 }) }));
      if (!stored.ok && stored.status !== 409) throw new Error('Order storage failed');
      attempt.url = url; await storage.put('paypal-attempt:' + data.requestId, attempt);
      return reply(200, { url });
    } catch { return reply(502, { message: 'Unable to start PayPal checkout. Please try again.' }); }
  }
  if (path === '/paypal/capture') {
    const order = await storage.get('paypal-order');
    if (!order || order.orderId !== data.orderId || order.nonce !== data.nonce || order.expires <= now) return reply(403, { message: 'Approval is invalid or expired.' });
    if (order.completed) return reply(200, { completed: true });
    if (order.attempts >= 5) return reply(429, { message: 'Unable to confirm this payment. Please contact us before retrying.' });
    order.attempts++; await storage.put('paypal-order', order);
    try {
      const token = await accessToken(env, transport);
      const response = await transport(api + '/v2/checkout/orders/' + order.orderId + '/capture', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'PayPal-Request-Id': order.captureId, Prefer: 'return=representation' }, body: '{}', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Not confirmed');
      const result = await response.json(), units = result.purchase_units;
      const captures = units?.[0]?.payments?.captures;
      if (result.id !== order.orderId || result.status !== 'COMPLETED' || units?.length !== 1 || units[0].reference_id !== 'voices-for-dignity' || captures?.length !== 1 || captures[0].status !== 'COMPLETED' || captures[0].amount?.currency_code !== 'USD' || captures[0].amount.value !== order.amount) throw new Error('Not confirmed');
      order.completed = true; await storage.put('paypal-order', order);
      return reply(200, { completed: true });
    } catch { return reply(502, { message: 'Payment could not be confirmed. Please contact us before starting another donation.' }); }
  }
  return reply(404, { message: 'Not found.' });
}
