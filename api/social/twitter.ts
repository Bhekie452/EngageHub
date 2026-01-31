import type { VercelRequest, VercelResponse } from '@vercel/node';

export async function handleTwitter(req: VercelRequest, res: VercelResponse) {
  const { default: handler } = await import('../../api/twitter');
  return handler(req, res);
}
