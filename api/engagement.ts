import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Engagement API Proxy - Forwards to consolidated /api/app
 * Maintains backward compatibility with existing frontend code
 * 
 * All engagement functionality is now handled in /api/app.ts
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Forward to consolidated handler
  const { default: appHandler } = await import('./app.js');
  
  // Inject action=engagement parameter
  req.query = { ...req.query, action: 'engagement' };
  
  return appHandler(req, res);
}