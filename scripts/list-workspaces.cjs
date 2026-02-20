const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
const envPath = 'c:\\Users\\bhekie\\Downloads\\EngageHub\\EngageHub-main\\.env.local';
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
    });
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    // Since I can't use admin auth with anon key, I'll try to find the user from the social_accounts owner if possible.
    // Actually, I'll just check all workspaces.

    const { data: workspaces } = await supabase.from('workspaces').select('id, name, owner_id');
    console.log('Workspaces in DB:');
    console.log(JSON.stringify(workspaces, null, 2));
}

check();
