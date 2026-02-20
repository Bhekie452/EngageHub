const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zourlqrkoyugzymxkbgn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXJscXJrb3l1Z3p5bXhrYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIxMTM2MiwiZXhwIjoyMDgzNzg3MzYyfQ.ic8p6qw_KJw5QtojcZwpIJ7ISJo3bxz9ef5RQA1wzfM';
const apiKey = 'AIzaSyBgPXoEl_aQgXAB8aaooWnYUXjBVlk-G4Q';
const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function syncAll() {
    console.log('--- Service Role YouTube Sync ---');

    // 1. Get YouTube account to link analytics
    const { data: ytAcc } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'youtube')
        .single();

    if (!ytAcc) {
        console.error('No YouTube account found for workspace.');
        return;
    }

    // 2. Get posts with link_url
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
                console.log(`  - Views: ${stats.viewCount}, Likes: ${stats.likeCount}, Comments: ${stats.commentCount}`);
                const { error } = await supabase.from('post_analytics').upsert({
                    post_id: post.id,
                    social_account_id: ytAcc.id,
                    platform: 'youtube',
                    likes: Number(stats.likeCount) || 0,
                    comments: Number(stats.commentCount) || 0,
                    views: Number(stats.viewCount) || 0,
                    video_views: Number(stats.viewCount) || 0,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'post_id, social_account_id' });

                if (error) console.error('  - DB Error:', error.message);
            } else {
                console.log('  - No statistics found for this video.');
            }
        } catch (e) {
            console.error('  - Fetch Error:', e.message);
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
