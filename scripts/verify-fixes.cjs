const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL; // Used correct one
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verify() {
    const searchTerm = 'gfhjrtyu';
    console.log(`Checking post with content "${searchTerm}"...`);

    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .like('content', `%${searchTerm}%`);

    if (error) {
        console.error('Error fetching posts:', error);
        return;
    }

    if (posts.length === 0) {
        console.log('Post not found!');
    }

    posts.forEach(p => {
        console.log(`ID: ${p.id}`);
        console.log(`Content: ${p.content}`);
        console.log(`Link URL: ${p.link_url}`);
        if (p.link_url && p.link_url.includes('youtube.com')) {
            console.log('SUCCESS: Link URL is present and valid.');
        } else {
            console.log('FAILURE: Link URL is missing or invalid.');
        }
    });
}

verify();
