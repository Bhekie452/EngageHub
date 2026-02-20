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

async function fix() {
    console.log(`Setting all YouTube accounts for ${workspaceId} to active...`);
    const { data, error } = await supabase
        .from('social_accounts')
        .update({ is_active: true, connection_status: 'connected' })
        .eq('workspace_id', workspaceId)
        .eq('platform', 'youtube')
        .select();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success:', data);
    }
}

fix();
