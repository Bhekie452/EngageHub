const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUpsert() {
    const wsId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
    const ownerId = 'b10a987f-5b50-4e11-bedb-4feed12e392e';
    const dummyId = '00000000-0000-0000-0000-000000000000';

    console.log('🧪 Testing Profile Upsert...\n');

    const profileData = {
        workspace_id: wsId,
        connected_by: dummyId, // Try the dummy one first to see if it fails
        platform: 'facebook',
        account_type: 'profile',
        account_id: 'me',
        display_name: 'Test Profile',
        access_token: 'test_token',
        token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        connection_status: 'connected',
        last_sync_at: new Date().toISOString(),
    };

    console.log('Attempting upsert with dummy connected_by...');
    const { data: d1, error: e1 } = await supabase
        .from('social_accounts')
        .upsert(profileData, { onConflict: 'workspace_id,platform,account_id' })
        .select();

    if (e1) {
        console.error('❌ Upsert with dummy failed:', e1);
    } else {
        console.log('✅ Upsert with dummy succeeded! ID:', d1[0].id);
    }

    console.log('\nAttempting upsert with REAL ownerId...');
    profileData.connected_by = ownerId;
    profileData.display_name = 'Test Profile Real';
    const { data: d2, error: e2 } = await supabase
        .from('social_accounts')
        .upsert(profileData, { onConflict: 'workspace_id,platform,account_id' })
        .select();

    if (e2) {
        console.error('❌ Upsert with real ID failed:', e2);
    } else {
        console.log('✅ Upsert with real ID succeeded! ID:', d2[0].id);
    }
}

testUpsert();
