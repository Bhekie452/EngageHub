import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Allowed origins for CORS.
 * Add your production domain(s) here.
 */
const ALLOWED_ORIGINS = [
  'https://engage-hub-ten.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

/**
 * Sets CORS headers on the response.
 * Returns true if the request is a preflight OPTIONS request (caller should return early).
 */
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || '';
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV !== 'production') {
    // In development, allow any origin
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
