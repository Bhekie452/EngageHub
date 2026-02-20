const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zourlqrkoyugzymxkbgn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXJscXJrb3l1Z3p5bXhrYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIxMTM2MiwiZXhwIjoyMDgzNzg3MzYyfQ.ic8p6qw_KJw5QtojcZwpIJ7ISJo3bxz9ef5RQA1wzfM';
const apiKey = 'AIzaSyBgPXoEl_aQgXAB8aaooWnYUXjBVlk-G4Q';
const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function syncAll() {
    console.log('--- Robust YouTube Metrics Sync ---');

    // 1. Get YouTube account
    const { data: ytAcc } = await supabase
        .from('social_accounts')
        .select('id, account_id')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'youtube')
        .single();

    if (!ytAcc) {
        console.error('No YouTube account found for workspace.');
        return;
    }

    // 2. Get posts
    const { data: posts } = await supabase
        .from('posts')
        .select('id, link_url')
        .eq('workspace_id', workspaceId)
        .contains('platforms', ['youtube'])
        .not('link_url', 'is', null)
        .neq('link_url', '');

    console.log(`Found ${posts?.length || 0} posts to sync.`);

    for (const post of posts || []) {
        const videoId = extractYouTubeVideoId(post.link_url);
        if (!videoId) continue;

        console.log(`Syncing video ${videoId} for post ${post.id}...`);
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`
            );
            const data = await response.json();
            const stats = data.items?.[0]?.statistics;

            if (stats) {
                const likes = Number(stats.likeCount) || 0;
                const comments = Number(stats.commentCount) || 0;
                const views = Number(stats.viewCount) || 0;

                console.log(`  - Stats: Views=${views}, Likes=${likes}, Comments=${comments}`);

                // A. Update post_analytics (using 'video_views' as confirmed by analytics.service.ts)
                const { error: paErr } = await supabase.from('post_analytics').upsert({
                    post_id: post.id,
                    social_account_id: ytAcc.id,
                    platform: 'youtube',
                    likes: likes,
                    comments: comments,
                    video_views: views,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'post_id, social_account_id' });

                if (paErr) console.error('  - post_analytics error:', paErr.message);
                else console.log('  - Updated post_analytics');

                // B. Update engagement_aggregates (using columns from api/app.ts)
                const { error: eaErr } = await supabase.from('engagement_aggregates').upsert({
                    workspace_id: workspaceId,
                    platform: 'youtube',
                    platform_post_id: videoId,
                    native_likes: likes,
                    native_comments: comments,
                    total_views: views,
                    total_likes: likes, // Simplified: adding native to total
                    total_comments: comments,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'workspace_id, platform, platform_post_id' });

                if (eaErr) console.error('  - engagement_aggregates error:', eaErr.message);
                else console.log('  - Updated engagement_aggregates');

            } else {
                console.log('  - No statistics found.');
            }
        } catch (e) {
            console.error('  - Error:', e.message);
        }
    }
}

function extractYouTubeVideoId(url) {
    if (!url) return null;
    if (url.includes('/shorts/')) return url.split('/shorts/')[1]?.split('?')[0]?.split('&')[0] || null;
    if (url.includes('v=')) return url.split('v=')[1]?.split('&')[0] || null;
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0] || null;
    if (url.length === 11 && !url.includes('/')) return url;
    return url.split('/').pop()?.split('?')[0] || null;
}

syncAll();
