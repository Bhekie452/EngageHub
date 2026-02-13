const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixProfileRecord() {
    const wsId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
    console.log(`🔧 Fixing Facebook Profile record for workspace: ${wsId}`);

    const { data: profile, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', wsId)
        .eq('platform', 'facebook')
        .eq('account_type', 'profile')
        .single();

    if (error || !profile) {
        console.error('❌ Profile not found');
        return;
    }

    const token = profile.access_token;
    const meUrl = `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${token}`;
    const meResp = await fetch(meUrl);
    const meData = await meResp.json();

    if (meData.id && meData.name) {
        console.log(`✅ Fetched real ID: ${meData.id} and Name: ${meData.name}`);

        const { error: updateError } = await supabase
            .from('social_accounts')
            .update({
                account_id: meData.id,
                display_name: meData.name,
                is_active: true // Force active while we're at it
            })
            .eq('id', profile.id);

        if (updateError) {
            console.error('❌ Error updating record:', updateError);
        } else {
            console.log('✅ Record updated successfully.');
        }
    } else {
        console.error('❌ Could not fetch real profile data:', meData);
    }
}

fixProfileRecord();
