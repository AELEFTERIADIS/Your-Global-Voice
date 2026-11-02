const reply = (status, data) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export const checkoutReady = env => env.STRIPE_CHECKOUT_ENABLED === 'true' && !!env.STRIPE_SECRET_KEY;
export async function checkoutRequest(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = (env.CONTACT_SITE_ORIGINS || env.CONTACT_SITE_ORIGIN || '').split(',').map(s => s.trim());
  if (!origin || !allowed.includes(origin)) return reply(403, { message: 'Origin not permitted.' });
  const cors = { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
  let response;
  try {
    if (request.method === 'OPTIONS') response = new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
    else if (new URL(request.url).pathname.endsWith('/status') && request.method === 'GET') response = reply(200, { available: checkoutReady(env) });
    else if (request.method !== 'POST' || new URL(request.url).pathname.endsWith('/status')) response = reply(405, { message: 'Method not allowed.' });
    else if (!checkoutReady(env)) response = reply(503, { message: 'Project checkout is not available yet.' });
    else {
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip) response = reply(403, { message: 'Unable to verify request.' });
      else {
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.STRIPE_SECRET_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip));
        const name = 'checkout:' + Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
        response = await env.CONTACT_LIMITS.get(env.CONTACT_LIMITS.idFromName(name)).fetch(request);
      }
    }
  } catch { response = reply(502, { message: 'Unable to start checkout. Please try again.' }); }
  const result = new Response(response.body, response);
  for (const [key, value] of Object.entries(cors)) result.headers.set(key, value);
  return result;
}
export async function createProjectSession(request, env, storage, transport = fetch) {
  if (!checkoutReady(env)) return reply(503, { message: 'Project checkout is not available yet.' });
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) return reply(415, { message: 'JSON required.' });
  const now = Date.now(); let rate = await storage.get('checkout-rate');
  if (!rate || now - rate.start >= 900000) rate = { start: now, count: 0 };
  if (rate.count >= 5) return reply(429, { message: 'Please wait 15 minutes before trying again.' });
  rate.count++; await storage.put('checkout-rate', rate); await storage.setAlarm(now + 900000);
  const reader = request.body?.getReader(); if (!reader) return reply(400, { message: 'Invalid request.' });
  let text = ''; const decoder = new TextDecoder(); let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 1024) { await reader.cancel(); return reply(413, { message: 'Request too large.' }); } text += decoder.decode(value, { stream: true }); }
  let data; try { data = JSON.parse(text + decoder.decode()); } catch { return reply(400, { message: 'Invalid request.' }); }
  if (!Number.isSafeInteger(data?.amountCents) || data.amountCents < 100 || data.amountCents > 1000000 || !/^[a-f0-9-]{36}$/i.test(data.requestId || '')) return reply(400, { message: 'Choose an amount between $1 and $10,000 USD.' });
  const params = new URLSearchParams({ mode: 'payment', 'line_items[0][quantity]': '1', 'line_items[0][price_data][currency]': 'usd', 'line_items[0][price_data][unit_amount]': String(data.amountCents), 'line_items[0][price_data][product_data][name]': 'Voices for Dignity donation', 'metadata[project]': 'voices-for-dignity', 'payment_intent_data[metadata][project]': 'voices-for-dignity', success_url: 'https://ygvoice.org/projects.html', cancel_url: 'https://ygvoice.org/projects.html' });
  try {
    const result = await transport('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': `voices-for-dignity:${data.requestId}` }, body: params.toString(), signal: AbortSignal.timeout(15000) });
    if (!result.ok) return reply(502, { message: 'Unable to start checkout. Please try again.' });
    const session = await result.json(); const url = new URL(session.url);
    if (url.origin !== 'https://checkout.stripe.com' || !session.id?.startsWith('cs_')) throw new Error('Invalid checkout');
    return reply(200, { url: url.href });
  } catch { return reply(502, { message: 'Unable to start checkout. Please try again.' }); }
}
