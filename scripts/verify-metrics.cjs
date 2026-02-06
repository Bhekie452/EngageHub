const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkMetrics() {
    // 1. Get all workspaces
    const { data: workspaces } = await supabase.from('workspaces').select('id, name');
    if (!workspaces || workspaces.length === 0) {
        console.error('No workspaces found');
        return;
    }

    const videoId = '5pS7L9dEJOE';
    console.log(`Checking metrics for video: ${videoId} across ${workspaces.length} workspaces...`);

    for (const w of workspaces) {
        console.log(`Trying Workspace: ${w.name} (${w.id})`);
        try {
            const { data, error } = await supabase.functions.invoke('youtube-api', {
                body: {
                    endpoint: 'video-details',
                    workspaceId: w.id,
                    videoId: videoId
                }
            });

            if (error) {
                console.log(`  Failed: ${error.message || JSON.stringify(error)}`);
                // Try to read body if it's there
                if (error.context && error.context.json) {
                    console.log('  Details:', await error.context.json());
                }
            } else if (data && data.success) {
                console.log('  SUCCESS!');
                console.log('  Data:', JSON.stringify(data.data, null, 2));
                return;
            } else {
                console.log(`  Error response: ${JSON.stringify(data)}`);
            }
        } catch (e) {
            console.log(`  Exception: ${e.message}`);
        }
    }
}

checkMetrics();
