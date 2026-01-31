import type { VercelRequest, VercelResponse } from '@vercel/node';

export async function handleTikTok(req: VercelRequest, res: VercelResponse) {
  // Import the original handler
  const { default: handler } = await import('../../api/tiktok');
  return handler(req, res);
}
