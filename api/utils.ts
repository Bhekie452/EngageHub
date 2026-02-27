import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../src/server-api/utils.js';

export default async function(req: VercelRequest, res: VercelResponse) {
  return await handler(req, res);
}
