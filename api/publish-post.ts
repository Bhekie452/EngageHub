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

    // REAL FACEBOOK PUBLISHING
    if (hasFacebook) {
      try {
        const FACEBOOK_LONG_TERM_TOKEN = process.env.FACEBOOK_LONG_TERM_TOKEN;
        
        if (!FACEBOOK_LONG_TERM_TOKEN) {
          results.facebook = { 
            status: 'error', 
            error: 'No Facebook token available',
            details: 'FACEBOOK_LONG_TERM_TOKEN environment variable not set'
          };
        } else {
          // Get user's Facebook Pages
          const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${FACEBOOK_LONG_TERM_TOKEN}`;
          const pagesResponse = await fetch(pagesUrl);
          const pagesData = await pagesResponse.json();
          
          if (pagesData.error) {
            results.facebook = { 
              status: 'error', 
              error: 'Failed to fetch pages',
              details: pagesData.error.message
            };
          } else {
            const pages = pagesData.data || [];
            if (pages.length === 0) {
              results.facebook = { 
                status: 'error', 
                error: 'No Facebook Pages available',
                details: 'User needs to create a Facebook Page'
              };
            } else {
              // Use first available page
              const page = pages[0];
              
              // Post to Facebook Page
              const postUrl = `https://graph.facebook.com/v21.0/${page.id}/feed`;
              const postData = {
                message: content,
                access_token: page.access_token
              };
              
              const postResponse = await fetch(postUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
              });
              
              const postResult = await postResponse.json();
              
              if (postResult.error) {
                results.facebook = { 
                  status: 'error', 
                  error: 'Failed to publish to Facebook',
                  details: postResult.error.message
                };
              } else {
                results.facebook = { 
                  status: 'published', 
                  postId: postResult.id,
                  pageName: page.name
                };
              }
            }
          }
        }
      } catch (error: any) {
        results.facebook = { 
          status: 'error', 
          error: 'Facebook publishing failed',
          details: error.message
        };
      }
    }

    // Instagram (mock for now - needs Instagram Business Account setup)
    if (hasInstagram) {
      results.instagram = { 
        status: 'error', 
        error: 'Instagram publishing not implemented',
        details: 'Requires Instagram Business Account setup'
      };
    }

    // YouTube (mock for now - needs YouTube API setup)
    if (hasYouTube) {
      results.youtube = { 
        status: 'error', 
        error: 'YouTube publishing not implemented',
        details: 'Requires YouTube Data API setup'
      };
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
