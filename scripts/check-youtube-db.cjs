const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.resolve('c:\\Users\\bhekie\\Downloads\\EngageHub\\EngageHub-main\\.env.local');
    if (fs.existsSync(envPath)) {
        const txt = fs.readFileSync(envPath, 'utf8');
        txt.split(/\r?\n/).forEach(line => {
            const lineTrim = line.trim();
            if (!lineTrim || lineTrim.startsWith('#')) return;
            const idx = lineTrim.indexOf('=');
            if (idx === -1) return;
            const key = lineTrim.slice(0, idx).trim();
            let val = lineTrim.slice(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            process.env[key] = val;
        });
    }
}
loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zourlqrkoyugzymxkbgn.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

async function checkYouTubeAccount() {
    console.log(`Checking YouTube accounts for workspace: ${workspaceId}`);

    const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'youtube');

    if (error) {
        console.error('Error fetching accounts:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No YouTube accounts found.');
    } else {
        console.log(`Found ${data.length} accounts:`);
        console.log(JSON.stringify(data, null, 2));
    }
}

checkYouTubeAccount();
