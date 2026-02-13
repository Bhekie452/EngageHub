const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function debugFacebookToken() {
  console.log('🔍 Debugging Facebook Token v2...\n');

  try {
    // Get the stored profile token
    const { data: profileConnections, error: profileError } = await supabase
      .from('social_accounts')
      .select('access_token, created_at, token_expires_at')
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
    if (!profile?.access_token) {
      console.log('❌ No Facebook profile token found');
      return;
    }

    console.log('👤 Profile Token Info:');
    console.log(`   Token: ${profile.access_token.substring(0, 30)}...`);
    console.log(`   Length: ${profile.access_token.length} chars`);
    console.log(`   Created: ${profile.created_at}`);
    console.log(`   Expires: ${profile.token_expires_at || 'Not set'}`);

    // Test token validity with basic debug endpoint
    console.log('\n🧪 Testing Token Validity...');
    const debugUrl = `https://graph.facebook.com/v21.0/debug_token?` +
      `input_token=${profile.access_token}`;

    const debugResponse = await fetch(debugUrl);
    const debugData = await debugResponse.json();

    if (debugData.data) {
      const tokenInfo = debugData.data;
      console.log('✅ Token Debug Info:');
      console.log(`   App ID: ${tokenInfo.app_id}`);
      console.log(`   Type: ${tokenInfo.type}`);
      console.log(`   Application: ${tokenInfo.application}`);
      console.log(`   Expires At: ${tokenInfo.expires_at ? new Date(tokenInfo.expires_at * 1000).toISOString() : 'Never'}`);
      console.log(`   Is Valid: ${tokenInfo.is_valid ? 'Yes' : 'NO'}`);
      console.log(`   Scopes: ${tokenInfo.scopes ? tokenInfo.scopes.join(', ') : 'None'}`);
      console.log(`   User ID: ${tokenInfo.user_id}`);

      if (!tokenInfo.is_valid) {
        console.log('\n❌ TOKEN IS INVALID!');
        console.log('💡 This explains why no accounts were returned');
        console.log('🔄 User needs to re-authenticate with Facebook');
      }

      if (tokenInfo.scopes) {
        console.log('\n🔑 Permission Analysis:');
        const requiredScopes = ['email', 'public_profile', 'pages_show_list', 'pages_read_engagement', 'pages_manage_posts'];
        const hasAllRequired = requiredScopes.every(scope => tokenInfo.scopes.includes(scope));
        
        console.log(`   Required Scopes: ${requiredScopes.join(', ')}`);
        console.log(`   Granted Scopes: ${tokenInfo.scopes.join(', ')}`);
        console.log(`   All Required Granted: ${hasAllRequired ? '✅ YES' : '❌ NO'}`);

        if (!hasAllRequired) {
          console.log('\n❌ MISSING REQUIRED PERMISSIONS!');
          console.log('💡 This explains why /me/accounts returns no data');
          console.log('🔄 User needs to re-authenticate with proper scopes');
        }
      }
    } else {
      console.log('❌ Token Debug Failed:', debugData.error);
    }

    // Test basic user info endpoint
    console.log('\n👤 Testing Basic User Info...');
    const userUrl = `https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${profile.access_token}`;
    
    const userResponse = await fetch(userUrl);
    const userData = await userResponse.json();

    if (userData.error) {
      console.log('❌ User Info Error:', userData.error);
    } else {
      console.log('✅ User Info Retrieved:');
      console.log(`   User ID: ${userData.id}`);
      console.log(`   Name: ${userData.name}`);
      console.log(`   Email: ${userData.email || 'Not provided'}`);
    }

    // Test pages endpoint specifically
    console.log('\n📄 Testing /me/accounts Endpoint...');
    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${profile.access_token}`;
    
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      console.log('❌ Pages Error:', pagesData.error);
      console.log(`   Error Code: ${pagesData.error.code}`);
      console.log(`   Error Message: ${pagesData.error.message}`);
    } else {
      console.log('✅ Pages Response:');
      console.log(`   Total Accounts: ${pagesData.data?.length || 0}`);
      
      if (pagesData.data && pagesData.data.length > 0) {
        console.log('📄 Available Accounts:');
        pagesData.data.forEach((account, index) => {
          console.log(`\n   ${index + 1}. ${account.name}`);
          console.log(`      ID: ${account.id}`);
          console.log(`      Category: ${account.category || 'N/A'}`);
          console.log(`      Tasks: ${account.tasks ? account.tasks.join(', ') : 'None'}`);
        });
      } else {
        console.log('❌ No accounts returned');
      }
    }

  } catch (error) {
    console.error('❌ Debug Error:', error);
  }
}

// Run the debug
debugFacebookToken();
