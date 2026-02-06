const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function debugPost() {
    // Try searching in 'content' column
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .ilike('content', '%Test Post 1%');

    if (error) {
        console.error('Error fetching posts:', error);
        return;
    }

    console.log(`Found ${posts.length} posts matching "Test Post 1"`);

    for (const p of posts) {
        console.log('--- Post ---');
        console.log('ID:', p.id);
        console.log('Workspace ID:', p.workspace_id);
        console.log('Link URL:', p.link_url);
        console.log('Content:', p.content);

        const externalUrl = p.link_url;
        let videoId = null;
        if (externalUrl) {
            if (externalUrl.includes('v=')) videoId = externalUrl.split('v=')[1]?.split('&')[0];
            else videoId = externalUrl.split('/').pop();
        }
        console.log('Extracted ID (simulated):', videoId);
    }
}

debugPost();
