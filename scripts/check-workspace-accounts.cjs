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
const workspaceId = '76844eda-1015-4d3b-896b-10a99dfe6f88';

async function check() {
    console.log(`--- Social Accounts for Workspace: ${workspaceId} ---`);
    const { data, error } = await supabase
        .from('social_accounts')
        .select('platform, display_name, username, avatar_url, is_active, connection_status')
        .eq('workspace_id', workspaceId);

    if (error) {
        console.error('Error:', error);
        return;
    }

    data.forEach(acc => {
        console.log(`[${acc.platform}] Name: "${acc.display_name}", User: "${acc.username}", Active: ${acc.is_active}, Status: ${acc.connection_status}`);
    });
}

check();
