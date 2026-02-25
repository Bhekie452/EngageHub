import crypto from 'crypto';

function safeStringify(value) {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return '{}';
  }
}

function extractSignature(req) {
  return (
    req.headers['x-tiktok-signature'] ||
    req.headers['x-tiktok-signature-v1'] ||
    req.headers['x-signature'] ||
    ''
  ).toString();
}

function verifySignature(req, body, secret) {
  if (!secret) return { verified: true, reason: 'no-secret-configured' };

  const received = extractSignature(req).replace(/^sha256=/i, '').trim();
  if (!received) return { verified: false, reason: 'missing-signature-header' };

  const payload = typeof body === 'string' ? body : safeStringify(body);
  const computed = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const verified = crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(received));
  return { verified, reason: verified ? 'ok' : 'signature-mismatch' };
}

export default async function handler(req, res) {
  try {
    const method = (req.method || 'GET').toUpperCase();

    if (method === 'GET') {
      const challenge = req.query?.challenge || req.query?.challenge_code || req.query?.echo;
      if (challenge) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(200).send(String(challenge));
      }
      return res.status(200).json({ ok: true, message: 'TikTok webhook endpoint active' });
    }

    if (method === 'POST') {
      const secret = process.env.TIKTOK_WEBHOOK_SECRET || '';
      const verification = verifySignature(req, req.body, secret);

      if (!verification.verified) {
        console.warn('[tiktok-webhook] Signature verification failed:', verification.reason);
        return res.status(401).json({ ok: false, error: 'Invalid signature' });
      }

      const payload = req.body || {};
      const eventType = payload.event_type || payload.type || payload.event || 'unknown';
      console.log('[tiktok-webhook] Event received:', {
        eventType,
        hasData: !!payload.data,
        verification: verification.reason
      });

      return res.status(200).json({ ok: true, received: true });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('[tiktok-webhook] Error:', error);
    return res.status(500).json({ ok: false, error: 'Webhook processing failed' });
  }
}
