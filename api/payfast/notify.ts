import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

function md5Signature(params: Record<string, string>, passPhrase?: string) {
  const data: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '' && k !== 'signature') data[k] = String(v);
  }
  const keys = Object.keys(data).sort();
  let qs = keys
    .map((k) => `${k}=${encodeURIComponent(data[k]).replace(/%20/g, '+')}`)
    .join('&');
  if (passPhrase) qs += `&passphrase=${encodeURIComponent(passPhrase).replace(/%20/g, '+')}`;
  return crypto.createHash('md5').update(qs).digest('hex').toLowerCase();
}

async function validateWithPayFast(rawBody: string, sandbox: boolean) {
  const url = sandbox
    ? 'https://sandbox.payfast.co.za/eng/query/validate'
    : 'https://www.payfast.co.za/eng/query/validate';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: rawBody,
  });
  const text = await res.text();
  return text.trim() === 'VALID';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    // PayFast posts application/x-www-form-urlencoded
    const rawBody =
      typeof req.body === 'string'
        ? req.body
        : new URLSearchParams(req.body as any).toString();
    const params = Object.fromEntries(new URLSearchParams(rawBody).entries()) as Record<string, string>;

    const passPhrase = process.env.PAYFAST_PASSPHRASE || '';
    const sandbox = process.env.PAYFAST_SANDBOX === 'true';

    // 1) Verify signature
    const expectedSig = md5Signature(params, passPhrase || undefined);
    const providedSig = String(params.signature || '').toLowerCase();
    if (!providedSig || expectedSig !== providedSig) {
      res.status(400).send('Invalid signature');
      return;
    }

    // 2) Validate with PayFast (server-to-server)
    const valid = await validateWithPayFast(rawBody, sandbox);
    if (!valid) {
      res.status(400).send('Invalid ITN');
      return;
    }

    // 3) Only treat COMPLETE as success
    const paymentStatus = (params.payment_status || '').toUpperCase();
    if (paymentStatus !== 'COMPLETE') {
      // PayFast still expects 200
      res.status(200).send('OK');
      return;
    }

    // 4) Update Supabase profile subscription tier/status
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !serviceKey) {
      // Don’t fail ITN: but log so you can fix env vars
      console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for PayFast ITN.');
      res.status(200).send('OK');
      return;
    }

    const userId = params.custom_str1 || '';
    const tier = (params.custom_str3 || '').toLowerCase();

    if (userId && tier) {
      const patch = {
        subscription_tier: tier,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      };

      await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(patch),
      });
    }

    // Optional: If you add a payments table later, you can insert a record here.
    res.status(200).send('OK');
  } catch (e: any) {
    console.error('PayFast notify error:', e);
    // Always 200 to avoid PayFast retry storms while you debug
    res.status(200).send('OK');
  }
}

