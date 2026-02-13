const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
    console.log('🔍 Comprehensive Facebook Connection Diagnosis...\n');

    const wsId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
    const { data: records, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', wsId)
        .eq('platform', 'facebook');

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log(`Found ${records.length} Facebook records for workspace ${wsId}.\n`);

    records.forEach((acc, i) => {
        console.log(`\n📄 Record ${i + 1}:`);
        console.log(`   ID: ${acc.id}`);
        console.log(`   Account Type: ${acc.account_type}`);
        console.log(`   Account ID: ${acc.account_id}`);
        console.log(`   Display Name: ${acc.display_name}`);
        console.log(`   Is Active: ${acc.is_active}`);
        console.log(`   Status: ${acc.connection_status}`);
        console.log(`   Connected By: ${acc.connected_by}`);
        console.log(`   Created At: ${acc.created_at}`);
        console.log(`   Platform Data Keys: ${Object.keys(acc.platform_data || {}).join(', ')}`);
    });

    const profiles = records.filter(r => r.account_type === 'profile');
    if (profiles.length === 0) {
        console.log('\n❌ MISSING Profile Connection!');
    } else {
        console.log(`\n✅ Found ${profiles.length} Profile Connection(s).`);
    }

    const pages = records.filter(r => r.account_type === 'page');
    console.log(`✅ Found ${pages.length} Page Connection(s).`);
}

diagnose();
