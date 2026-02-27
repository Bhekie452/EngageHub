import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../src/server-api/app.js';

export default async function(req: VercelRequest, res: VercelResponse) {
  return await handler(req, res);
}
