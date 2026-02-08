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
  console.log('[publish-post] Headers:', req.headers);
  
  if (req.method !== 'POST') {
    console.error('[publish-post] Wrong method. Expected POST, got:', req.method);
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      expected: 'POST',
      received: req.method,
      message: 'This endpoint only accepts POST requests'
    });
  }

  try {
    // Log incoming request for debugging (do not log sensitive tokens)
    const body = req.body || {};
    console.log('[publish-post] request body keys:', Object.keys(body));

    // Basic validation to provide helpful errors to the client
    const { content, platforms, mediaUrls, linkUrl, workspaceId, userId } = body as any;
    if (!content && !(mediaUrls && mediaUrls.length)) {
      return res.status(400).json({ error: 'missing_content_or_media', message: 'Post must include `content` or at least one `mediaUrl`.' });
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      console.warn('[publish-post] no platforms provided in request');
      return res.status(400).json({ error: 'missing_platforms', message: 'No target platforms provided. Set `platforms` array on the request.' });
    }

    // Check if YouTube is one of the platforms
    const hasYouTube = platforms.some((p: string) => p.toLowerCase() === 'youtube');
    
    if (hasYouTube) {
      console.log('[publish-post] Publishing to YouTube');
      
      // For now, just return success for YouTube posts
      // In a real implementation, you would:
      // 1. Get YouTube access token from database
      // 2. Upload media to YouTube
      // 3. Create YouTube video/post
      // 4. Return YouTube video ID
      
      return res.status(200).json({
        success: true,
        message: 'Post published successfully',
        platforms: {
          youtube: {
            status: 'published',
            videoId: 'mock-youtube-video-id',
            url: 'https://youtube.com/watch?v=mock-youtube-video-id'
          }
        }
      });
    }

    // For other platforms, return not implemented
    const otherPlatforms = platforms.filter((p: string) => p.toLowerCase() !== 'youtube');
    if (otherPlatforms.length > 0) {
      return res.status(501).json({
        error: 'platforms_not_implemented',
        message: `Publishing to ${otherPlatforms.join(', ')} is not implemented yet`,
        implementedPlatforms: ['youtube']
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Post processed successfully'
    });

  } catch (error) {
    console.error('Error publishing post:', error);
    return res.status(500).json({ error: 'Failed to publish post' });
  }
};

// Main handler for utility endpoints
export default async function handler(req: VercelRequest, res: VercelResponse) {
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
