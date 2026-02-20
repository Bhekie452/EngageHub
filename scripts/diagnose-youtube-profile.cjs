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
    console.log('--- Social Accounts Platform=YouTube ---');
    const { data, error } = await supabase
        .from('social_accounts')
        .select('id, workspace_id, platform, display_name, username, avatar_url, is_active, connection_status')
        .eq('platform', 'youtube');

    if (error) {
        console.error('Error:', error);
        return;
    }

    data.forEach(acc => {
        console.log(`ID: ${acc.id}`);
        console.log(`Workspace ID: ${acc.workspace_id}`);
        console.log(`Display Name: "${acc.display_name}"`);
        console.log(`Username: "${acc.username}"`);
        console.log(`Avatar URL: ${acc.avatar_url ? 'YES' : 'NO'}`);
        console.log(`Status: ${acc.connection_status}, Active: ${acc.is_active}`);
        console.log('---');
    });

    console.log('\n--- Current User Workspaces ---');
    const { data: wsData } = await supabase.from('workspaces').select('id, name');
    console.log(JSON.stringify(wsData, null, 2));
}

check();
