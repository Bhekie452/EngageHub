// Vercel Cron API Route for YouTube Token Refresh
// This route is called by Vercel's cron job to refresh YouTube tokens
// Schedule: runs every hour (at minute 0)

import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Only allow cron requests
  const cronSecret = req.headers['x-vercel-cron'];
  if (cronSecret !== 'youtube-token-refresh') {
    console.log('Unauthorized cron request received');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zourlqrkoyugzymxkbgn.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    console.log('Starting YouTube token refresh cron job...');
    
    // Call the Supabase Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/youtube-token-refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    const data = await response.json();
    
    console.log('YouTube Token Refresh Result:', JSON.stringify(data, null, 2));
    
    return res.status(200).json({ 
      success: true, 
      message: 'YouTube tokens refreshed',
      result: data
    });
  } catch (error) {
    console.error('YouTube Token Refresh Error:', error);
    return res.status(500).json({ 
      error: 'Failed to refresh tokens',
      message: String(error)
    });
  }
}
