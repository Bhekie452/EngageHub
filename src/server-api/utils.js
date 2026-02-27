import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://zourlqrkoyugzymxkbgn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXJscXJrb3l1Z3p5bXhrYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIxMTM2MiwiZXhwIjoyMDgzNzg3MzYyfQ.ic8p6qw_KJw5QtojcZwpIJ7ISJo3bxz9ef5RQA1wzfM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function handlePublishPost(req, res) {
  try {
    const { content, platforms, mediaUrls, workspaceId, postId } = req.body;

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ error: 'missing_platforms', message: 'No target platforms provided.' });
    }

    const hasYouTube = platforms.some((p) => p.toLowerCase() === 'youtube');

    if (hasYouTube) {
      const workspaceIdToUse = workspaceId || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

      try {
        const response = await fetch('https://zourlqrkoyugzymxkbgn.functions.supabase.co/youtube-api', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
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
          if (errorData.error === 'YouTube account not connected') {
            return res.status(200).json({
              success: true,
              message: 'Post published successfully (YouTube skipped - not connected)',
              platforms: { youtube: { status: 'skipped', reason: 'YouTube account not connected' } }
            });
          }
          throw new Error(errorData.error || `YouTube upload failed (${response.status})`);
        }

        const result = await response.json();
        return res.status(200).json({
          success: true,
          message: 'Post published successfully',
          platforms: { youtube: { status: 'published', videoId: result.videoId, url: result.url } }
        });
      } catch (youtubeError) {
        return res.status(200).json({
          success: true,
          message: 'Post published (YouTube failed)',
          platforms: { youtube: { status: 'failed', error: youtubeError.message } }
        });
      }
    }

    return res.status(200).json({ success: true, message: 'Post processed successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to publish post', message: error.message });
  }
}

export default async function handleUtils(req, res) {
  const endpoint = req.query.endpoint || req.params.endpoint;
  const method = req.method;

  if (endpoint === 'publish-post' && method === 'POST') {
    return handlePublishPost(req, res);
  }

  if (endpoint === 'process-scheduled-posts' && method === 'POST') {
    try {
      const response = await fetch('https://zourlqrkoyugzymxkbgn.functions.supabase.co/process-scheduled-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      });
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to process scheduled posts', message: error.message });
    }
  }

  if (endpoint === 'is_scheduled_posts') {
    try {
      const { workspaceId } = req.query;
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .eq('workspace_id', workspaceId || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9');

      if (error) throw error;
      return res.status(200).json({ success: true, count: count || 0 });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to check scheduled posts', message: error.message });
    }
  }

  return res.status(404).json({ error: 'Endpoint not found' });
}
