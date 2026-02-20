const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zourlqrkoyugzymxkbgn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXJscXJrb3l1Z3p5bXhrYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIxMTM2MiwiZXhwIjoyMDgzNzg3MzYyfQ.ic8p6qw_KJw5QtojcZwpIJ7ISJo3bxz9ef5RQA1wzfM';
const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testRefreshAndFix() {
    console.log('--- Testing YouTube API Refresh ---');
    try {
        const result = await supabase.functions.invoke('youtube-api', {
            body: {
                endpoint: 'debug-check',
                workspaceId: workspaceId
            }
        });
        console.log('Edge Function Response:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Edge Function Call Failed:', e);
    }

    console.log('\n--- Backfilling missing link_urls from content ---');
    const { data: posts } = await supabase
        .from('posts')
        .select('id, content, link_url')
        .eq('workspace_id', workspaceId)
        .contains('platforms', ['youtube'])
        .or('link_url.is.null,link_url.eq.""');

    console.log(`Found ${posts?.length || 0} YouTube posts with missing link_url.`);

    let fixedCount = 0;
    for (const post of posts || []) {
        const urlMatch = post.content?.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+/);
        if (urlMatch) {
            const url = urlMatch[0];
            console.log(`  - Fixing post ${post.id}: extracted ${url}`);
            const { error } = await supabase
                .from('posts')
                .update({ link_url: url })
                .eq('id', post.id);
            if (!error) fixedCount++;
            else console.error(`    - Failed to update: ${error.message}`);
        }
    }
    console.log(`\nSuccessfully backfilled ${fixedCount} posts.`);
}

testRefreshAndFix();
