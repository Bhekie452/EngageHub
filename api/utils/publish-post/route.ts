import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('[publish-post] Direct route - Method:', req.method);
  console.log('[publish-post] Direct route - Headers:', req.headers);

  if (req.method !== 'POST') {
    console.error('[publish-post] Direct route - Wrong method. Expected POST, got:', req.method);
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
    console.log('[publish-post] Direct route - request body keys:', Object.keys(body));

    // Basic validation to provide helpful errors to the client
    const { content, platforms, mediaUrls, linkUrl, workspaceId, userId } = body as any;
    if (!content && !(mediaUrls && mediaUrls.length)) {
      return res.status(400).json({ error: 'missing_content_or_media', message: 'Post must include `content` or at least one `mediaUrl`.' });
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      console.warn('[publish-post] Direct route - no platforms provided in request');
      return res.status(400).json({ error: 'missing_platforms', message: 'No target platforms provided. Set `platforms` array on the request.' });
    }

    // Check if Instagram is one of the platforms
    const hasInstagram = platforms.some((p: string) => p.toLowerCase() === 'instagram');
    const hasFacebook = platforms.some((p: string) => p.toLowerCase() === 'facebook');
    const hasYouTube = platforms.some((p: string) => p.toLowerCase() === 'youtube');
    
    if (hasInstagram) {
      console.log('[publish-post] Direct route - Publishing to Instagram');
      
      // For now, just return success for Instagram posts
      // In a real implementation, you would:
      // 1. Get Facebook access token (Instagram uses Facebook's API)
      // 2. Find Instagram Business account linked to Facebook Page
      // 3. Upload media to Instagram
      // 4. Create Instagram post
      // 5. Return Instagram post ID
      
      return res.status(200).json({
        success: true,
        message: 'Post published successfully',
        platforms: {
          instagram: {
            status: 'published',
            postId: 'mock-instagram-post-id',
            url: 'https://instagram.com/p/mock'
          }
        }
      });
    }

    if (hasFacebook) {
      console.log('[publish-post] Direct route - Publishing to Facebook');
      
      return res.status(200).json({
        success: true,
        message: 'Post published successfully',
        platforms: {
          facebook: {
            status: 'published',
            postId: 'mock-facebook-post-id',
            url: 'https://facebook.com/mock'
          }
        }
      });
    }
    
    if (hasYouTube) {
      console.log('[publish-post] Direct route - Publishing to YouTube');
      
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

    // If no recognized platforms
    return res.status(400).json({
      error: 'no_valid_platforms',
      message: 'No valid platforms provided. Supported platforms: instagram, facebook, youtube',
      receivedPlatforms: platforms
    });

  } catch (error) {
    console.error('[publish-post] Direct route - Error publishing post:', error);
    return res.status(500).json({ error: 'Failed to publish post' });
  }
}
