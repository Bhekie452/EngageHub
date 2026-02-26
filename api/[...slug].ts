import { VercelRequest, VercelResponse } from '@vercel/node';

const mapping: Record<string, string> = {
  app: '../src/server-api/app',
  'facebook-auth': '../src/server-api/facebook-auth',
  inbox: '../src/server-api/inbox',
  oauth: '../src/server-api/oauth',
  utils: '../src/server-api/utils',
  facebook: '../src/server-api/facebook-auth',
  'tiktok-callback-redirect': '../src/server-api/tiktok-callback-redirect',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = req.query.slug as string[] | undefined;
  const primary = Array.isArray(slug) && slug.length > 0 ? slug[0] : (req.query.route as string) || (req.query.action as string) || (req.query.endpoint as string) || 'app';

  const modulePath = mapping[String(primary).toLowerCase()];
  if (!modulePath) {
    return res.status(404).json({ error: 'API route not found', requested: primary });
  }

  try {
    const mod = await import(modulePath);
    if (mod && typeof mod.default === 'function') {
      return await mod.default(req, res);
    }
    return res.status(500).json({ error: 'Handler did not export default function' });
  } catch (err: any) {
    console.error('[catch-all] Error loading handler for', primary, err);
    return res.status(500).json({ error: 'Internal server error', details: err?.message });
  }
}
