import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      expected: 'POST',
      received: req.method
    });
  }

  try {
    const { content, platforms, mediaUrls } = req.body || {};
    
    console.log('[publish-post] Request received:', {
      method: req.method,
      body: req.body,
      platforms,
      content
    });
    
    if (!platforms || !Array.isArray(platforms)) {
      return res.status(400).json({ error: 'Missing platforms' });
    }

    const hasFacebook = platforms.some((p: string) => p.toLowerCase() === 'facebook');
    const hasInstagram = platforms.some((p: string) => p.toLowerCase() === 'instagram');
    const hasYouTube = platforms.some((p: string) => p.toLowerCase() === 'youtube');

    const results: any = {};

    if (hasFacebook) {
      results.facebook = { status: 'published', postId: 'fb-mock-id' };
    }
    if (hasInstagram) {
      results.instagram = { status: 'published', postId: 'ig-mock-id' };
    }
    if (hasYouTube) {
      results.youtube = { status: 'published', videoId: 'yt-mock-id' };
    }

    console.log('[publish-post] Response:', {
      success: true,
      platforms: results
    });

    return res.status(200).json({
      success: true,
      platforms: results
    });

  } catch (error) {
    console.error('[publish-post] Error:', error);
    return res.status(500).json({ error: 'Publish failed' });
  }
}
