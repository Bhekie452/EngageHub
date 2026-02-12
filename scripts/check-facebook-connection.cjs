const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFacebookConnection() {
    console.log('🔍 Checking Facebook connections in database...\n');

    const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

    const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'facebook');

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log(`Found ${data.length} Facebook connection(s):\n`);

    data.forEach((account, i) => {
        console.log(`\n📄 Account ${i + 1}:`);
        console.log(`   ID: ${account.id}`);
        console.log(`   Account ID: ${account.account_id}`);
        console.log(`   Display Name: ${account.display_name}`);
        console.log(`   Account Type: ${account.account_type}`);
        console.log(`   Is Active: ${account.is_active}`);
        console.log(`   Connection Status: ${account.connection_status}`);
        console.log(`   Has Token: ${!!account.access_token}`);
        console.log(`   Platform Data: ${JSON.stringify(account.platform_data, null, 2)}`);
    });
}

checkFacebookConnection();
