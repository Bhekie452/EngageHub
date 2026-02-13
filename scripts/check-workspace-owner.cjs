const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWorkspace() {
    const wsId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
    console.log(`🔍 Checking workspace: ${wsId}`);

    const { data: ws, error: wsError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', wsId)
        .single();

    if (wsError) {
        console.error('❌ Workspace Error:', wsError);
    } else {
        console.log('✅ Workspace Found:', {
            id: ws.id,
            name: ws.name,
            owner_id: ws.owner_id
        });
    }

    // Also check if the dummy user exists
    const dummyId = '00000000-0000-0000-0000-000000000000';
    const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', dummyId)
        .single();

    if (userError) {
        console.log(`❌ Dummy user ${dummyId} NOT found. (Expected)`);
    } else {
        console.log(`✅ Dummy user ${dummyId} FOUND!`);
    }
}

checkWorkspace();
