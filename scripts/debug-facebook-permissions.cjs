const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugFull() {
    const wsId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
    console.log(`🔍 Deep Debug Facebook Connection: ${wsId}`);

    const { data: profile, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', wsId)
        .eq('platform', 'facebook')
        .eq('account_type', 'profile')
        .eq('connection_status', 'connected')
        .single();

    if (error || !profile) {
        console.error('❌ Profile not found');
        return;
    }

    const token = profile.access_token;

    // 1. Raw /me
    console.log('\n👤 Raw /me response:');
    const meUrl = `https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${token}`;
    const meResp = await fetch(meUrl);
    const meData = await meResp.json();
    console.log(JSON.stringify(meData, null, 2));

    // 2. Full Permissions
    console.log('\n🔐 Permissions:');
    const permsUrl = `https://graph.facebook.com/v21.0/me/permissions?access_token=${token}`;
    const permsResp = await fetch(permsUrl);
    const permsData = await permsResp.json();
    if (permsData.data) {
        permsData.data.forEach(p => {
            console.log(`   - ${p.permission}: ${p.status}`);
        });
    }

    // 3. /me/accounts
    console.log('\n📄 /me/accounts response:');
    const accountsUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${token}`;
    const accountsResp = await fetch(accountsUrl);
    const accountsData = await accountsResp.json();
    console.log(JSON.stringify(accountsData, null, 2));
}

debugFull();
