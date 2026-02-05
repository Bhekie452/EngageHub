import express from 'express';
import cors from 'cors';
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Handler for publishing posts (main function)
async function handlePublishPost(req, res) {
  try {
    console.log('[publish-post] request body keys:', Object.keys(req.body));

    const { content, platforms, mediaUrls, linkUrl, workspaceId, userId } = req.body;

    if (!content && !(mediaUrls && mediaUrls.length)) {
      return res.status(400).json({ error: 'missing_content_or_media', message: 'Post must include `content` or at least one `mediaUrl`.' });
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ error: 'missing_platforms', message: 'No target platforms provided.' });
    }

    const hasYouTube = platforms.some((p) => p.toLowerCase() === 'youtube');
    
    if (hasYouTube) {
      console.log('[publish-post] Publishing to YouTube');
      
      try {
        // Use real YouTube upload via Supabase Edge Function
        const workspaceIdToUse = workspaceId || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
        
        // Call Supabase Edge Function directly
        const response = await fetch('https://zourlqrkoyugzymxkbgn.functions.supabase.co/youtube-api', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXJxcXJrb3l1Z3p5bXhrYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0ODE1MDAsImV4cCI6MjA1MjA1NzUwMH0.YMIWzqzG_hxI_3xuJcIqKQfZdYVQh6R9cLgZdYVQh6R'}`
          },
          body: JSON.stringify({
            endpoint: 'upload-video',
            workspaceId: workspaceIdToUse,
            title: content?.substring(0, 100) || 'Video from EngageHub',
            description: content || 'Video uploaded via EngageHub platform',
            mediaUrl: mediaUrls?.[0],
            tags: ['EngageHub', 'Social Media'],
            privacyStatus: 'public'
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'YouTube upload failed');
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
        return res.status(500).json({ 
          error: 'youtube_upload_failed', 
          message: 'Failed to upload to YouTube: ' + youtubeError.message 
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

// Handler for query endpoints (supports both formats)
app.all('/api/utils', (req, res) => {
  const { endpoint } = req.query;

  switch (endpoint) {
    case 'publish-post':
      if (req.method === 'POST') {
        return handlePublishPost(req, res);
      } else {
        return res.status(405).json({ error: 'Method Not Allowed' });
      }
    default:
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
    case 'publish-post':
      return res.status(405).json({ error: 'Method Not Allowed' });
    default:
      return res.status(404).json({ error: 'Endpoint not found' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Local API server running on http://localhost:${PORT}`);
  console.log('📡 Available endpoints:');
  console.log('  POST /api/utils?endpoint=publish-post');
  console.log('  POST /api/utils/publish-post');
  console.log('  GET  /api/utils/:endpoint');
});
