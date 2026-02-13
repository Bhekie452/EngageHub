const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function traceUserToken() {
  console.log('🔍 Tracing User Token Storage...\n');

  try {
    // Get the profile connection with full details
    const { data: profileConnections, error: profileError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .eq('account_type', 'profile')
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false })
      .limit(1);

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return;
    }

    const profile = profileConnections?.[0];
    if (!profile) {
      console.log('❌ No Facebook profile connection found');
      return;
    }

    console.log('👤 Profile Connection Found:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Workspace: ${profile.workspace_id}`);
    console.log(`   Account ID: ${profile.account_id}`);
    console.log(`   Display Name: ${profile.display_name}`);
    console.log(`   Connection Status: ${profile.connection_status}`);
    console.log(`   Created: ${profile.created_at}`);
    console.log(`   Token Expires: ${profile.token_expires_at || 'Not set'}`);

    // Analyze the access token
    console.log('\n🔑 Access Token Analysis:');
    console.log(`   Token: ${profile.access_token.substring(0, 50)}...`);
    console.log(`   Length: ${profile.access_token.length} chars`);
    console.log(`   First 3 chars: ${profile.access_token.substring(0, 3)}`);
    console.log(`   Token Type: ${profile.access_token.startsWith('EAAC') ? 'User Access Token' : profile.access_token.startsWith('EAAG') ? 'App Access Token' : 'Unknown'}`);

    // Check platform_data
    console.log('\n📊 Platform Data Analysis:');
    if (profile.platform_data) {
      const platformData = typeof profile.platform_data === 'string' 
        ? JSON.parse(profile.platform_data) 
        : profile.platform_data;
      
      console.log(`   Platform Data Type: ${typeof profile.platform_data}`);
      console.log(`   Has longTermUserToken: ${platformData.longTermUserToken ? 'Yes' : 'No'}`);
      console.log(`   Has pages: ${platformData.pages ? 'Yes' : 'No'}`);
      
      if (platformData.longTermUserToken) {
        console.log(`   Long-term Token: ${platformData.longTermUserToken.substring(0, 50)}...`);
        console.log(`   Long-term Token Length: ${platformData.longTermUserToken.length} chars`);
        console.log(`   Long-term Token Type: ${platformData.longTermUserToken.startsWith('EAAC') ? 'User Access Token' : platformData.longTermUserToken.startsWith('EAAG') ? 'App Access Token' : 'Unknown'}`);
      }
      
      if (platformData.pages && platformData.pages.length > 0) {
        console.log(`   Pages Count: ${platformData.pages.length}`);
        platformData.pages.forEach((page, index) => {
          console.log(`     ${index + 1}. ${page.pageName} (${page.pageId})`);
        });
      }
    } else {
      console.log('   No platform_data found');
    }

    // Test the stored token against Facebook API
    console.log('\n🧪 Testing Stored Token:');
    const testUrl = `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${profile.access_token}`;
    
    try {
      const response = await fetch(testUrl);
      const data = await response.json();
      
      if (data.error) {
        console.log('❌ Token Test Failed:');
        console.log(`   Error: ${data.error.message}`);
        console.log(`   Code: ${data.error.code}`);
        console.log(`   Type: ${data.error.type}`);
      } else {
        console.log('✅ Token Test Successful:');
        console.log(`   User ID: ${data.id}`);
        console.log(`   Name: ${data.name}`);
      }
    } catch (error) {
      console.log('❌ Network Error:', error.message);
    }

    // Test pages endpoint with stored token
    console.log('\n📄 Testing Pages Endpoint:');
    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${profile.access_token}`;
    
    try {
      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();
      
      if (pagesData.error) {
        console.log('❌ Pages Test Failed:');
        console.log(`   Error: ${pagesData.error.message}`);
        console.log(`   Code: ${pagesData.error.code}`);
        console.log(`   Type: ${pagesData.error.type}`);
      } else {
        console.log('✅ Pages Test Successful:');
        console.log(`   Total Accounts: ${pagesData.data?.length || 0}`);
        if (pagesData.data && pagesData.data.length > 0) {
          pagesData.data.forEach((account, index) => {
            console.log(`     ${index + 1}. ${account.name} (${account.id})`);
          });
        }
      }
    } catch (error) {
      console.log('❌ Network Error:', error.message);
    }

    // Check if this matches the expected flow from the API code
    console.log('\n🔄 Expected Flow Analysis:');
    console.log('   1. OAuth callback → short-term token');
    console.log('   2. Exchange → long-term user token (EAAC...)');
    console.log('   3. Store in access_token field');
    console.log('   4. Also store in platform_data.longTermUserToken');
    console.log('   5. Use to fetch pages from /me/accounts');

    console.log('\n🎯 Token Location Summary:');
    console.log(`   ✅ Database: social_accounts.access_token`);
    console.log(`   ✅ Platform Data: platform_data.longTermUserToken`);
    console.log(`   ✅ Used By: FacebookPageSelector component`);
    console.log(`   ✅ Used By: Backend API handlers`);

  } catch (error) {
    console.error('❌ Error tracing token:', error);
  }
}

// Run the trace
traceUserToken();
