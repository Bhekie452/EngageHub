// Vercel Cron: Process Scheduled Posts
// Runs once daily at 06:00 UTC to publish any due scheduled posts.
// The frontend also triggers this on page load for more immediate scheduling.

import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const origin = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://engage-hub-ten.vercel.app';

    console.log('[cron/process-scheduled-posts] Triggering...');

    const response = await fetch(`${origin}/api/utils?endpoint=process-scheduled-posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json().catch(() => ({}));
    console.log('[cron/process-scheduled-posts] Result:', JSON.stringify(data));

    return res.status(200).json({ success: true, result: data });
  } catch (error) {
    console.error('[cron/process-scheduled-posts] Error:', error);
    return res.status(500).json({ error: String(error) });
  }
}
