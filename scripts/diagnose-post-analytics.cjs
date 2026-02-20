const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.resolve('c:\\Users\\bhekie\\Downloads\\EngageHub\\EngageHub-main\\.env.local');
    if (fs.existsSync(envPath)) {
        const txt = fs.readFileSync(envPath, 'utf8');
        txt.split(/\r?\n/).forEach(line => {
            const lineTrim = line.trim();
            if (!lineTrim || lineTrim.startsWith('#')) return;
            const idx = lineTrim.indexOf('=');
            if (idx === -1) return;
            const key = lineTrim.slice(0, idx).trim();
            let val = lineTrim.slice(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            process.env[key] = val;
        });
    }
}
loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zourlqrkoyugzymxkbgn.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- Diagnosing "Test Post 1" Analytics ---');

    // 1. Find the post
    const { data: posts, error: postErr } = await supabase
        .from('posts')
        .select('*')
        .ilike('content', '%Test Post 1%')
        .limit(1);

    if (postErr || !posts.length) {
        console.error('Post not found or error:', postErr);
        return;
    }

    const post = posts[0];
    console.log('Post found:', {
        id: post.id,
        content: post.content,
        platforms: post.platforms,
        link_url: post.link_url,
        workspace_id: post.workspace_id
    });

    // 2. Check analytics_events (EngageHub-tracked)
    const { data: events } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('entity_id', post.id);

    console.log(`\nFound ${events?.length || 0} EngageHub events for this post.`);
    events?.forEach(e => {
        console.log(`- ${e.event_type} at ${e.occurred_at} by ${e.metadata?.actor || e.user_id}`);
    });

    // 3. Check post_analytics (Cached YouTube/Platform stats)
    const { data: postAn } = await supabase
        .from('post_analytics')
        .select('*')
        .eq('post_id', post.id);

    console.log(`\nFound ${postAn?.length || 0} post_analytics records:`);
    postAn?.forEach(a => {
        console.log(`- Platform: ${a.platform}, Views: ${a.views}, Likes: ${a.likes}, Comments: ${a.comments}`);
    });

    // 4. Check YouTube account status
    const { data: ytAcc } = await supabase
        .from('social_accounts')
        .select('id, platform, is_active, token_expires_at, display_name')
        .eq('workspace_id', post.workspace_id)
        .eq('platform', 'youtube')
        .single();

    if (ytAcc) {
        console.log('\nYouTube Account linked to this workspace:', {
            id: ytAcc.id,
            display_name: ytAcc.display_name,
            is_active: ytAcc.is_active,
            expires_at: ytAcc.token_expires_at,
            is_expired: new Date(ytAcc.token_expires_at) < new Date()
        });
    } else {
        console.log('\nNo YouTube account linked to this workspace.');
    }
}

diagnose();
