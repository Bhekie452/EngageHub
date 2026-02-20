const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Handler for publishing posts (main function)
async function handlePublishPost(req, res) {
  try {
    console.log('[publish-post] request body keys:', Object.keys(req.body));

    const { content, platforms, mediaUrls, workspaceId, postId, accountTokens } = req.body;
    console.log('[publish-post] Workspace ID from request:', workspaceId);

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ error: 'missing_platforms', message: 'No target platforms provided.' });
    }

    const hasYouTube = platforms.some((p) => p.toLowerCase() === 'youtube');

    if (hasYouTube) {
      console.log('[publish-post] Publishing to YouTube');

      // Check if YouTube is connected, if not, skip YouTube but continue with other platforms
      const workspaceIdToUse = workspaceId || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

      try {
        const response = await fetch('https://zourlqrkoyugzymxkbgn.functions.supabase.co/youtube-api', {
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
            mediaUrl: mediaUrls?.[0],
            tags: ['EngageHub', 'Social Media'],
            privacyStatus: 'public',
            postId: postId
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.log('Supabase Edge Function response:', {
            status: response.status,
            statusText: response.statusText,
            errorData: errorData
          });

          // If YouTube account not connected, skip YouTube but continue with success
          if (errorData.error === 'YouTube account not connected') {
            console.log('YouTube not connected, skipping YouTube upload but continuing with success');
            return res.status(200).json({
              success: true,
              message: 'Post published successfully (YouTube skipped - not connected)',
              platforms: {
                youtube: {
                  status: 'skipped',
                  reason: 'YouTube account not connected'
                }
              }
            });
          }
          throw new Error(errorData.error || `YouTube upload failed (${response.status}: ${response.statusText})`);
        }

        const result = await response.json();

        return res.status(200).json({
          success: true,
          message: 'Post published successfully',
          platforms: {
            youtube: {
              status: 'published',
              videoId: result.videoId,
              url: result.url
            }
          }
        });
      } catch (youtubeError) {
        console.error('YouTube upload failed:', youtubeError);
        console.error('Error details:', {
          message: youtubeError.message,
          stack: youtubeError.stack,
          workspaceId: workspaceIdToUse,
          mediaUrl: mediaUrls?.[0]
        });

        // If YouTube fails, still return success but note the error
        return res.status(200).json({
          success: true,
          message: 'Post published successfully (YouTube upload failed)',
          platforms: {
            youtube: {
              status: 'failed',
              error: youtubeError.message
            }
          }
        });
      }
    }

    const otherPlatforms = platforms.filter((p) => p.toLowerCase() !== 'youtube');
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
}

// Handler for consolidated /api/app endpoint
async function handleApp(req, res) {
  console.log('--- HANDLE APP HIT ---', req.url);
  const { action, method: actionMethod, workspaceId, platformPostId, platform } = req.query;
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL || 'https://zourlqrkoyugzymxkbgn.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXJscXJrb3l1Z3p5bXhrYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIxMTM2MiwiZXhwIjoyMDgzNzg3MzYyfQ.ic8p6qw_KJw5QtojcZwpIJ7ISJo3bxz9ef5RQA1wzfM'
  );

  console.log(`[App API] Action: ${action}, Method: ${actionMethod}, Platform: ${platform}`);

  try {
    if (action === 'engagement') {
      if (actionMethod === 'aggregates') {
        const { data, error } = await supabase
          .from('engagement_aggregates')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('platform', platform?.toLowerCase())
          .eq('platform_post_id', platformPostId)
          .single();

        return res.status(200).json({
          success: true,
          aggregates: data || {
            total_likes: 0, total_comments: 0, total_shares: 0, total_views: 0
          }
        });
      }

      if (actionMethod === 'list') {
        // Fetch local EngageHub events
        const { data: actions } = await supabase
          .from('engagement_actions')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('platform', platform?.toLowerCase())
          .eq('platform_post_id', platformPostId)
          .order('created_at', { ascending: false });

        let results = actions || [];

        // Special case: Fetch live YouTube comments using API Key if platform is youtube
        if (platform === 'youtube' && platformPostId) {
          try {
            const apiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
            const ytResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${platformPostId}&maxResults=20&key=${apiKey}`
            );
            const ytData = await ytResponse.json();

            if (ytData.items) {
              const ytComments = ytData.items.map(item => ({
                id: item.id,
                type: 'comment',
                platform: 'youtube',
                user: item.snippet.topLevelComment.snippet.authorDisplayName,
                avatar: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
                text: item.snippet.topLevelComment.snippet.textDisplay,
                occurred_at: item.snippet.topLevelComment.snippet.publishedAt,
                time: 'Just now'
              }));
              results = [...results, ...ytComments];
            }
          } catch (ytErr) {
            console.error('[App API] YouTube comments fetch failed:', ytErr.message);
          }
        }

        return res.status(200).json({
          success: true,
          actions: results
        });
      }
    }

    return res.status(400).json({ error: 'Invalid action or method' });
  } catch (error) {
    console.error('[App API] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

app.all('/api/app', handleApp);

// Handler for query endpoints (supports both formats)
app.all('/api/utils', (req, res) => {
  console.log(`[API] ${req.method} request to /api/utils`);
  console.log(`[API] Query params:`, req.query);
  console.log(`[API] Headers:`, req.headers);

  const { endpoint } = req.query;

  switch (endpoint) {
    case 'publish-post':
      console.log(`[API] Handling publish-post with method: ${req.method}`);
      if (req.method === 'POST') {
        return handlePublishPost(req, res);
      } else {
        console.log(`[API] Method ${req.method} not allowed for publish-post`);
        return res.status(405).json({ error: 'Method Not Allowed' });
      }
    default:
      console.log(`[API] Endpoint not found: ${endpoint}`);
      return res.status(404).json({ error: 'Endpoint not found' });
  }
});

// Handler for publishing posts (direct path)
app.post('/api/utils/publish-post', (req, res) => {
  return handlePublishPost(req, res);
});

// Handler for query endpoints (legacy)
app.get('/api/utils/:endpoint', (req, res) => {
  const { endpoint } = req.params;

  switch (endpoint) {
    case 'health':
      return res.status(200).json({ status: 'ok', message: 'API server is running' });
    default:
      return res.status(404).json({ error: 'Endpoint not found' });
  }
});

const PORT = process.env.PORT || 3002;

// ============================================
// Facebook OAuth Handler for Local Development
// ============================================
async function handleFacebookAuth(req, res) {
  const { workspaceId, action } = req.query;

  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = 'http://localhost:3000/#/pages/auth/facebook/callback';

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: 'Facebook credentials not configured',
      details: 'FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not set in environment variables'
    });
  }

  // Handle token exchange (callback)
  if (action === 'callback') {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    try {
      // Exchange authorization code for access token
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `client_id=${clientId}&` +
        `client_secret=${clientSecret}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `code=${code}`
      );

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return res.status(400).json({ error: tokenData.error.message });
      }

      // Exchange short-lived token for long-lived token
      const longTermResponse = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${clientId}&` +
        `client_secret=${clientSecret}&` +
        `fb_exchange_token=${tokenData.access_token}`
      );

      const longTermData = await longTermResponse.json();

      if (longTermData.error) {
        return res.status(400).json({ error: longTermData.error.message });
      }

      // Get Facebook Pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?` +
        `fields=id,name,access_token,instagram_business_account&` +
        `access_token=${longTermData.access_token}`
      );

      const pagesData = await pagesResponse.json();

      // Get user profile
      const profileResponse = await fetch(
        `https://graph.facebook.com/v19.0/me?` +
        `fields=id,name,email&` +
        `access_token=${longTermData.access_token}`
      );

      const profileData = await profileResponse.json();

      return res.status(200).json({
        success: true,
        accessToken: longTermData.access_token,
        expiresIn: longTermData.expires_in,
        user: profileData,
        pages: pagesData.data || []
      });

    } catch (error) {
      console.error('Facebook token exchange failed:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Handle auth initiation
  const scopes = 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish';
  const state = JSON.stringify({ workspaceId: workspaceId || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9' });

  const facebookAuthUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  facebookAuthUrl.searchParams.set('client_id', clientId);
  facebookAuthUrl.searchParams.set('redirect_uri', redirectUri);
  facebookAuthUrl.searchParams.set('scope', scopes);
  facebookAuthUrl.searchParams.set('state', state);
  facebookAuthUrl.searchParams.set('response_type', 'code');

  console.log('[facebook-auth] Redirecting to Facebook OAuth');
  console.log('[facebook-auth] Redirect URI:', redirectUri);

  // Redirect to Facebook
  return res.redirect(facebookAuthUrl.toString());
}

// Add auth route handler
app.get('/api/auth', async (req, res) => {
  const { provider, action } = req.query;

  console.log(`[API] Auth request: provider=${provider}, action=${action}`);

  if (provider === 'facebook') {
    return handleFacebookAuth(req, res);
  }

  return res.status(404).json({ error: 'Provider not found' });
});

app.post('/api/auth', async (req, res) => {
  const { provider, action } = req.query;

  console.log(`[API] Auth POST request: provider=${provider}, action=${action}`);

  if (provider === 'facebook' && action === 'token') {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    const clientId = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = 'http://localhost:3000/#/pages/auth/facebook/callback';

    try {
      // Exchange authorization code for access token
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `client_id=${clientId}&` +
        `client_secret=${clientSecret}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `code=${code}`
      );

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return res.status(400).json({ error: tokenData.error.message });
      }

      // Exchange short-lived token for long-lived token
      const longTermResponse = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${clientId}&` +
        `client_secret=${clientSecret}&` +
        `fb_exchange_token=${tokenData.access_token}`
      );

      const longTermData = await longTermResponse.json();

      if (longTermData.error) {
        return res.status(400).json({ error: longTermData.error.message });
      }

      // Get Facebook Pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?` +
        `fields=id,name,access_token,instagram_business_account&` +
        `access_token=${longTermData.access_token}`
      );

      const pagesData = await pagesResponse.json();

      // Get user profile
      const profileResponse = await fetch(
        `https://graph.facebook.com/v19.0/me?` +
        `fields=id,name,email&` +
        `access_token=${longTermData.access_token}`
      );

      const profileData = await profileResponse.json();

      return res.status(200).json({
        success: true,
        accessToken: longTermData.access_token,
        expiresIn: longTermData.expires_in,
        user: profileData,
        pages: pagesData.data || []
      });

    } catch (error) {
      console.error('Facebook token exchange failed:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(404).json({ error: 'Action not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Local API server running on http://localhost:${PORT}`);
  console.log('📡 Available endpoints:');
  console.log('  POST /api/utils?endpoint=publish-post');
  console.log('  POST /api/utils/publish-post');
  console.log('  GET  /api/utils/:endpoint');
});
