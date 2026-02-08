import type { VercelRequest, VercelResponse } from '@vercel/node';

// Handler for getting post engagement metrics
const handleGetPostEngagement = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Your existing get-post-engagement logic here
    // ...
    return res.status(200).json({ /* your response data */ });
  } catch (error) {
    console.error('Error getting post engagement:', error);
    return res.status(500).json({ error: 'Failed to get post engagement' });
  }
};

// Handler for processing scheduled posts
const handleProcessScheduledPosts = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Your existing process-scheduled-posts logic here
    // ...
    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error processing scheduled posts:', error);
    return res.status(500).json({ error: 'Failed to process scheduled posts' });
  }
};

// Handler for publishing campaigns
const handlePublishCampaign = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Your existing publish-campaign logic here
    // ...
    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error publishing campaign:', error);
    return res.status(500).json({ error: 'Failed to publish campaign' });
  }
};

// Handler for publishing individual posts
const handlePublishPost = async (req: VercelRequest, res: VercelResponse) => {
  console.log('[publish-post] Method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      expected: 'POST',
      received: req.method
    });
  }

  try {
    const { content, platforms, mediaUrls } = req.body || {};
    
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

    return res.status(200).json({
      success: true,
      platforms: results
    });

  } catch (error) {
    return res.status(500).json({ error: 'Publish failed' });
  }
};

// Main handler for utility endpoints
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { endpoint } = req.query;
  
  console.log('[utils] Request:', {
    method: req.method,
    endpoint,
    query: req.query,
    hasBody: !!req.body
  });

  try {
    switch (endpoint) {
      case 'post-engagement':
        return await handleGetPostEngagement(req, res);
      case 'process-scheduled-posts':
        return await handleProcessScheduledPosts(req, res);
      case 'publish-campaign':
        return await handlePublishCampaign(req, res);
      case 'publish-post':
        return await handlePublishPost(req, res);
      default:
        return res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error(`Error in utils API (${endpoint}):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
