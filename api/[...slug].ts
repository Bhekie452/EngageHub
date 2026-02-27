import { VercelRequest, VercelResponse } from '@vercel/node';
import appHandler from '../src/server-api/app.js';
import facebookAuthHandler from '../src/server-api/facebook-auth.js';
import utilsHandler from '../src/server-api/utils.js';

const mapping: Record<string, any> = {
  app: appHandler,
  'facebook-auth': facebookAuthHandler,
  facebook: facebookAuthHandler,
  utils: utilsHandler,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = req.query.slug as string[] | undefined;
  const primary = Array.isArray(slug) && slug.length > 0 ? slug[0] : (req.query.route as string) || (req.query.action as string) || (req.query.endpoint as string) || 'app';

  const handlerFunc = mapping[String(primary).toLowerCase()];
  
  if (!handlerFunc) {
    return res.status(404).json({ error: 'API route not found', requested: primary });
  }

  try {
    return await handlerFunc(req, res);
  } catch (err: any) {
    console.error('[catch-all] Error executing handler for', primary, err);
    return res.status(500).json({ error: 'Internal server error', details: err?.message });
  }
}
