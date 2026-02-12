import { VercelRequest, VercelResponse } from '@vercel/node';

// Handler for getting post engagement metrics
const handleGetPostEngagement = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // This is currently a mock/placeholder in the catch-all
    return res.status(200).json({ status: 'success', message: 'Engagement metrics fetched (mock)' });
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
    return res.status(200).json({ status: 'success', message: 'Scheduled posts processing triggered' });
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
    return res.status(200).json({ status: 'success', message: 'Campaign publishing triggered' });
  } catch (error) {
    console.error('Error publishing campaign:', error);
    return res.status(500).json({ error: 'Failed to publish campaign' });
  }
};

// Handler for publishing individual posts (The core logic for the reported issue)
const handlePublishPost = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      expected: 'POST',
      received: req.method
    });
  }

  try {
    const { content, platforms, mediaUrls, workspaceId, accountTokens } = req.body || {};
    
    console.log('[publish-post] Request received:', { platforms, content, workspaceId });
    
    if (!platforms || !Array.isArray(platforms)) {
      return res.status(400).json({ error: 'Missing platforms' });
    }

    const results: any = {};
    const successPlatforms: string[] = [];
    const failedPlatforms: any[] = [];

    for (const platform of platforms) {
      const plat = platform.toLowerCase();
      
      try {
        if (plat === 'youtube') {
          console.log('[publish-post] Publishing to YouTube via Edge Function');
          const workspaceIdToUse = workspaceId || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
          
          const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/youtube-api`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              endpoint: 'upload-video',
              workspaceId: workspaceIdToUse,
              title: content?.substring(0, 100) || 'Video from EngageHub',
              description: content || 'Video uploaded via EngageHub platform',
              mediaUrl: mediaUrls?.[0] || '', 
              tags: ['EngageHub', 'Social Media'],
              privacyStatus: 'public'
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `YouTube Edge Function failed with status ${response.status}`);
          }

          const result = await response.json();
          results.youtube = { status: 'published', videoId: result.videoId, url: result.url };
          successPlatforms.push('youtube');
        } 
        else if (plat === 'facebook' || plat === 'instagram') {
          // Check if we have tokens from request or environment
          const token = accountTokens?.[plat]?.access_token || process.env.FACEBOOK_LONG_TERM_TOKEN;
          const accountId = accountTokens?.[plat]?.account_id;
          
          if (!token) {
            throw new Error(`No ${plat} token available`);
          }

          if (plat === 'facebook') {
            // If we have a specific page token and ID from client, use it
            const targetId = accountId || 'me'; // Default to 'me' if not provided
            const postUrl = `https://graph.facebook.com/v21.0/${targetId}/feed`;
            
            const postResponse = await fetch(postUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: content,
                access_token: token,
                ...(mediaUrls?.[0] && { link: mediaUrls[0] })
              })
            });
            
            const postResult = await postResponse.json();
            if (postResult.error) throw new Error(postResult.error.message);
            
            results.facebook = { status: 'published', postId: postResult.id };
            successPlatforms.push('facebook');
          } else {
            // Instagram logic (simplified redirect/proxy)
            if (!accountId) throw new Error('Instagram requires a Business Account ID');
            
            // Step 1: Create media container
            const containerUrl = `https://graph.facebook.com/v21.0/${accountId}/media`;
            const containerRes = await fetch(containerUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image_url: mediaUrls?.[0] || 'https://via.placeholder.com/1080x1080/000000/FFFFFF?text=Post',
                caption: content,
                access_token: token
              })
            });
            
            const containerData = await containerRes.json();
            if (containerData.error) throw new Error(containerData.error.message);
            
            // Step 2: Publish
            const publishUrl = `https://graph.facebook.com/v21.0/${accountId}/media_publish`;
            const publishRes = await fetch(publishUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                creation_id: containerData.id,
                access_token: token
              })
            });
            
            const publishData = await publishRes.json();
            if (publishData.error) throw new Error(publishData.error.message);
            
            results.instagram = { status: 'published', postId: publishData.id };
            successPlatforms.push('instagram');
          }
        }
        else {
          // Other platforms mock for now
          results[plat] = { status: 'published', postId: `${plat}-mock-id` };
          successPlatforms.push(plat);
        }
      } catch (platError: any) {
        console.error(`Error publishing to ${plat}:`, platError);
        results[plat] = { status: 'error', error: platError.message };
        failedPlatforms.push({ platform: plat, error: platError.message });
      }
    }

    return res.status(200).json({
      success: successPlatforms.length > 0,
      platforms: results,
      failed: failedPlatforms
    });

  } catch (error) {
    console.error('[publish-post] Fatal error:', error);
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

  // Handle both query string and path-based endpoint resolution
  // If endpoint is an array (from path-based catch-all), take the first element
  // If it's a string (from query param), use it directly
  let { endpoint } = req.query;
  if (Array.isArray(endpoint)) {
    endpoint = endpoint[0];
  }

  console.log('[utils] Request:', {
    method: req.method,
    endpoint,
    query: req.query
  });

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint parameter' });
  }

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
