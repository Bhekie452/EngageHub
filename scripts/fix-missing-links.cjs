const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EDGE_FUNCTION_URL = 'https://zourlqrkoyugzymxkbgn.functions.supabase.co/youtube-api';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log('Scanning for posts with missing links...');

    // 1. Fetch posts
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .contains('platforms', ['youtube'])
        .or('link_url.is.null,link_url.eq.""');

    if (error) { console.error('DB Error:', error); return; }
    console.log(`Found ${posts.length} posts without links.`);

    for (const post of posts) {
        const titleToFind = (post.content || '').substring(0, 100); // Match what we upload
        console.log(`Processing post ${post.id} (Title: "${titleToFind}")...`);

        if (!post.workspace_id) {
            console.log('Skipping post without workspace_id');
            continue;
        }

        // 2. Fetch recent videos from YouTube via Edge Function
        try {
            const resp = await fetch(EDGE_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                },
                body: JSON.stringify({
                    endpoint: 'videos',
                    workspaceId: post.workspace_id,
                    maxResults: 15
                })
            });

            if (!resp.ok) {
                console.error(`Edge Function error: ${resp.status}`);
                continue;
            }

            const json = await resp.json();
            if (!json.success || !json.data) {
                console.error(`Failed to fetch videos for workspace ${post.workspace_id}:`, json);
                continue;
            }

            const videos = json.data;
            // 3. Match
            // Note: videos from 'search' endpoint have id { kind, videoId }
            const match = videos.find(v => {
                const vidTitle = v.snippet.title;
                return vidTitle === titleToFind || vidTitle.includes(titleToFind) || titleToFind.includes(vidTitle);
            });

            if (match) {
                const videoId = match.id.videoId || match.id;
                const fullUrl = `https://youtube.com/watch?v=${videoId}`;

                console.log(`MATCH FOUND! Video "${match.snippet.title}" (${videoId}). Updating post ${post.id} with URL ${fullUrl}`);

                const { error: updateErr } = await supabase.from('posts').update({ link_url: fullUrl }).eq('id', post.id);
                if (updateErr) console.error('Update failed:', updateErr);
                else console.log('Update success.');
            } else {
                console.log(`No matching video found for title "${titleToFind}" among ${videos.length} recent videos.`);
                // console.log('Available titles:', videos.map(v => v.snippet.title));
            }

        } catch (e) {
            console.error('Error processing post:', e);
        }
    }
}

main();
