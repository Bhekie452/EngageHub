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
const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

async function check() {
    const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'youtube');

    if (error) {
        console.error(error);
        return;
    }

    console.log('--- RAW DB DATA ---');
    data.forEach(acc => {
        console.log(`Platform: ${acc.platform}`);
        console.log(`Display Name: [${acc.display_name}] (Type: ${typeof acc.display_name})`);
        console.log(`Username: [${acc.username}] (Type: ${typeof acc.username})`);
        console.log(`Avatar URL: [${acc.avatar_url}]`);
        console.log(`Platform Data: ${JSON.stringify(acc.platform_data)}`);
    });
}

check();
