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
      content,
      mediaUrls: mediaUrls || 'none'
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

    // REAL INSTAGRAM PUBLISHING
    if (hasInstagram) {
      try {
        const FACEBOOK_LONG_TERM_TOKEN = process.env.FACEBOOK_LONG_TERM_TOKEN;
        
        if (!FACEBOOK_LONG_TERM_TOKEN) {
          results.instagram = { 
            status: 'error', 
            error: 'No Facebook token available',
            details: 'FACEBOOK_LONG_TERM_TOKEN environment variable not set'
          };
        } else {
          // Get user's Facebook Pages with Instagram Business accounts
          const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${FACEBOOK_LONG_TERM_TOKEN}`;
          const pagesResponse = await fetch(pagesUrl);
          const pagesData = await pagesResponse.json();
          
          if (pagesData.error) {
            results.instagram = { 
              status: 'error', 
              error: 'Failed to fetch pages',
              details: pagesData.error.message
            };
          } else {
            const pages = pagesData.data || [];
            const pagesWithInstagram = pages.filter((page: any) => page.instagram_business_account);
            
            if (pagesWithInstagram.length === 0) {
              results.instagram = { 
                status: 'error', 
                error: 'No Instagram Business accounts found',
                details: 'User needs to link Instagram to Facebook Page'
              };
            } else {
              // Use first available page with Instagram
              const page = pagesWithInstagram[0];
              const instagramBusinessAccountId = page.instagram_business_account.id;
              
              // Check if media URLs are provided
              if (!mediaUrls || mediaUrls.length === 0) {
                results.instagram = { 
                  status: 'error', 
                  error: 'Media ID is not available',
                  details: 'No media URLs provided for Instagram post. Instagram requires media (image/video) to be uploaded first.'
                };
                return;
              }
              
              // Use the first media URL for Instagram
              const mediaUrl = mediaUrls[0];
              console.log('📸 Instagram media URL:', mediaUrl);
              
              // Create media container first
              const mediaContainerUrl = `https://graph.facebook.com/v21.0/${instagramBusinessAccountId}/media`;
              const mediaContainerData = {
                image_url: mediaUrl,
                caption: content,
                access_token: page.access_token
              };
              
              const mediaContainerResponse = await fetch(mediaContainerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mediaContainerData)
              });
              
              const mediaContainerResult = await mediaContainerResponse.json();
              console.log('📸 Instagram media container response:', mediaContainerResult);
              
              if (mediaContainerResult.error) {
                results.instagram = { 
                  status: 'error', 
                  error: 'Failed to create Instagram media',
                  details: mediaContainerResult.error.message
                };
              } else if (!mediaContainerResult.id) {
                results.instagram = { 
                  status: 'error', 
                  error: 'Media ID is not available',
                  details: 'Instagram media container was created but no media ID was returned. This could be due to invalid media URL or insufficient permissions.'
                };
              } else {
                // Publish the media container
                const publishUrl = `https://graph.facebook.com/v21.0/${instagramBusinessAccountId}/media_publish`;
                const publishData = {
                  creation_id: mediaContainerResult.id,
                  access_token: page.access_token
                };
                
                const publishResponse = await fetch(publishUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(publishData)
                });
                
                const publishResult = await publishResponse.json();
                
                if (publishResult.error) {
                  results.instagram = { 
                    status: 'error', 
                    error: 'Failed to publish to Instagram',
                    details: publishResult.error.message
                  };
                } else {
                  results.instagram = { 
                    status: 'published', 
                    postId: publishResult.id,
                    pageName: page.name
                  };
                }
              }
            }
          }
        }
      } catch (error: any) {
        results.instagram = { 
          status: 'error', 
          error: 'Instagram publishing failed',
          details: error.message
        };
      }
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
