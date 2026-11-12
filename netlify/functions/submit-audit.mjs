export default async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const webhook = Netlify.env.get('AUDIT_WEBHOOK_URL');
  if (!webhook) return new Response('Form service unavailable', { status: 503 });
  let payload;
  try {
    const body = await request.text();
    if (body.length > 16384) return new Response('Request too large', { status: 413 });
    payload = JSON.parse(body);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error();
  } catch { return new Response('Invalid request', { status: 400 }); }
  try {
    const response = await fetch(webhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) });
    return response.ok ? new Response('OK') : new Response('Unable to send request', { status: 502 });
  } catch { return new Response('Unable to send request', { status: 502 }); }
};

export const config = { path: '/api/submit-audit', method: 'POST' };
