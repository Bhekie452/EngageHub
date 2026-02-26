// Vercel Cron API Route for Processing Scheduled Posts
// Runs once daily to publish any posts whose scheduled_for time has passed.
// For more granular scheduling, the frontend also triggers processing on page load.

import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const origin = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://engage-hub-ten.vercel.app';

    console.log('[cron/process-scheduled-posts] Triggering scheduled post processing...');

    const response = await fetch(`${origin}/api/utils?endpoint=process-scheduled-posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json().catch(() => ({}));
    console.log('[cron/process-scheduled-posts] Result:', JSON.stringify(data));

    return res.status(200).json({
      success: true,
      message: 'Scheduled posts processed',
      result: data,
    });
  } catch (error) {
    console.error('[cron/process-scheduled-posts] Error:', error);
    return res.status(500).json({
      error: 'Failed to process scheduled posts',
      message: String(error),
    });
  }
}
