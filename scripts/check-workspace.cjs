const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWorkspace() {
    const wsId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
    console.log(`🔍 Checking workspace ${wsId}...`);

    const { data: ws, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', wsId)
        .single();

    if (error) {
        console.error('❌ Error:', error);
    } else {
        console.log('✅ Workspace Found:');
        console.log(`   Name: ${ws.name}`);
        console.log(`   Owner ID: ${ws.owner_id}`);
    }
}

checkWorkspace();
