const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://zourlqrkoyugzymxkbgn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXJscXJrb3l1Z3p5bXhrYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIxMTM2MiwiZXhwIjoyMDgzNzg3MzYyfQ.ic8p6qw_KJw5QtojcZwpIJ7ISJo3bxz9ef5RQA1wzfM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
console.log('[DEBUG] Supabase client initialized');

async function handleApp(req, res) {
  const { action, method: actionMethod, workspaceId, platformPostId, platform } = req.query;

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

        if (error && error.code !== 'PGRST116') {
          console.error('[App API] Aggregate fetch error:', error);
        }

        return res.status(200).json({
          success: true,
          aggregates: data || {
            total_likes: 0, total_comments: 0, total_shares: 0, total_views: 0
          }
        });
      }

      if (actionMethod === 'list') {
        // Fetch local EngageHub events
        const { data: actions, error: actionsError } = await supabase
          .from('engagement_actions')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('platform', platform?.toLowerCase())
          .eq('platform_post_id', platformPostId)
          .order('created_at', { ascending: false });

        if (actionsError) {
          console.error('[App API] Actions fetch error:', actionsError);
        }

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

    // Fallback for unknown actions/methods
    return res.status(404).json({
      error: 'not_found',
      message: `Action ${action} with method ${actionMethod} not found on this endpoint.`
    });

  } catch (error) {
    console.error('[App API] Error:', error);
    return res.status(500).json({ error: 'internal_error', message: error.message });
  }
}

module.exports = handleApp;
module.exports.default = handleApp;
