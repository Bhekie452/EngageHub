import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Publish Post API Proxy - Forwards to consolidated /api/app
 * All publishing functionality is now handled in /api/app.ts
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Forward to consolidated handler
  const { default: appHandler } = await import('./app.js');
  
  // Inject action=publish parameter
  req.query = { ...req.query, action: 'publish' };
  
  return appHandler(req, res);
}