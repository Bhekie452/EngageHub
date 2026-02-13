const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllFacebook() {
    console.log('🔍 Checking ALL Facebook records in social_accounts...\n');

    const { data: records, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('platform', 'facebook');

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log(`Found ${records.length} Facebook records total.\n`);

    records.forEach((acc, i) => {
        console.log(`\n📄 Record ${i + 1}:`);
        console.log(`   ID: ${acc.id}`);
        console.log(`   Workspace ID: ${acc.workspace_id}`);
        console.log(`   Account Type: ${acc.account_type}`);
        console.log(`   Account ID: ${acc.account_id}`);
        console.log(`   Display Name: ${acc.display_name}`);
        console.log(`   Created At: ${acc.created_at}`);
    });
}

checkAllFacebook();
