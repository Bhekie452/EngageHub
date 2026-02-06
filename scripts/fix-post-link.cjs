const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fixPost() {
    const { data, error } = await supabase
        .from('posts')
        .update({ link_url: 'https://youtu.be/5pS7L9dEJOE' })
        .ilike('content', '%Test Post 1%')
        .select();

    if (error) {
        console.error('Update failed:', error);
    } else {
        console.log('Update success:', data);
    }
}

fixPost();
