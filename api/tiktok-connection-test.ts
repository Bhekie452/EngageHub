// TikTok Connection Test Script
// Tests if TikTok OAuth is properly configured
import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * TikTok Connection Test API Proxy - Forwards to consolidated /api/app
 * All test functionality is now handled in /api/app.ts
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Forward to consolidated handler
  const { default: appHandler } = await import('./app.js');
  
  // Inject action=test-tiktok parameter
  req.query = { ...req.query, action: 'test-tiktok' };
  
  return appHandler(req, res);
}