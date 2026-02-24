import { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = [
  'https://engage-hub-ten.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || '';

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}
