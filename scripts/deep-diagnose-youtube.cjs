const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zourlqrkoyugzymxkbgn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXJscXJrb3l1Z3p5bXhrYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIxMTM2MiwiZXhwIjoyMDgzNzg3MzYyfQ.ic8p6qw_KJw5QtojcZwpIJ7ISJo3bxz9ef5RQA1wzfM';
const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function deepDiagnose() {
    console.log('--- Deep Diagnostics for Workspace:', workspaceId, '---\n');

    // 1. Check YouTube Account
    const { data: ytAcc } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'youtube')
        .single();

    if (ytAcc) {
        console.log('✅ YouTube Account Found:');
        console.log(`  - ID: ${ytAcc.id}`);
        console.log(`  - Display Name: ${ytAcc.display_name}`);
        console.log(`  - Account ID (Channel ID): ${ytAcc.account_id}`);
        console.log(`  - Token Expires At: ${ytAcc.token_expires_at}`);
        console.log(`  - Status: ${new Date(ytAcc.token_expires_at) < new Date() ? 'EXPIRED ❌' : 'ACTIVE ✅'}`);
        console.log();
    } else {
        console.log('❌ No YouTube Account connected for this workspace.\n');
    }

    // 2. Find Posts with YouTube platform
    const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .contains('platforms', ['youtube']);

    console.log(`Found ${posts?.length || 0} YouTube posts in this workspace.\n`);

    for (const post of posts || []) {
        console.log(`--- Post: ${post.title || post.id} ---`);
        console.log(`  - Status: ${post.status}`);
        console.log(`  - Content: ${post.content?.substring(0, 50)}...`);
        console.log(`  - Link URL: ${post.link_url || 'MISSING ❌'}`);

        // Check EngageHub-tracked activity
        const { data: events } = await supabase
            .from('analytics_events')
            .select('*')
            .eq('entity_id', post.id)
            .eq('entity_type', 'post');

        console.log(`  - EngageHub Activity: ${events?.length || 0} items`);

        // Check cached analytics
        const { data: analytics } = await supabase
            .from('post_analytics')
            .select('*')
            .eq('post_id', post.id);

        if (analytics && analytics.length > 0) {
            console.log('  - Cached Analytics Found:');
            analytics.forEach(a => {
                console.log(`    - [${a.platform}] Views: ${a.views}, Likes: ${a.likes}, Comments: ${a.comments}`);
            });
        } else {
            console.log('  - No cached analytics found in post_analytics table.');
        }
        console.log();
    }
}

deepDiagnose();
