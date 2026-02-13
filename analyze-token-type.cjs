const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function analyzeTokenType() {
  console.log('🔍 Analyzing Token Type in Detail...\n');

  try {
    // Get the stored token
    const { data: profileConnections, error: profileError } = await supabase
      .from('social_accounts')
      .select('access_token')
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

    const token = profile.access_token;
    console.log('🔑 Token Analysis:');
    console.log(`   Full Token: ${token}`);
    console.log(`   Length: ${token.length} chars`);
    console.log(`   First 5 chars: ${token.substring(0, 5)}`);
    console.log(`   Last 5 chars: ${token.substring(token.length - 5)}`);

    // Token type patterns
    console.log('\n📋 Token Type Patterns:');
    console.log('   EAAC... = User Access Token (Short-lived)');
    console.log('   EAAG... = App Access Token');
    console.log('   EAAD... = User Access Token (Long-lived)');
    console.log('   EAA...  = User Access Token (Legacy)');

    const first4 = token.substring(0, 4);
    console.log(`\n🎯 Detected Type: ${first4}`);
    
    switch(first4) {
      case 'EAAC':
        console.log('   ✅ User Access Token (Short-lived) - Expected after OAuth');
        break;
      case 'EAAG':
        console.log('   ❌ App Access Token - Wrong type for /me/accounts');
        break;
      case 'EAAD':
        console.log('   ✅ User Access Token (Long-lived) - Expected after exchange');
        break;
      case 'EAA':
        console.log('   ✅ User Access Token (Legacy) - Should work');
        break;
      default:
        console.log('   ❌ Unknown token type');
    }

    // Test debug endpoint to get real token info
    console.log('\n🧪 Debug Token with Facebook API...');
    const debugUrl = `https://graph.facebook.com/v21.0/debug_token?` +
      `input_token=${token}`;

    try {
      const response = await fetch(debugUrl);
      const data = await response.json();
      
      if (data.data) {
        console.log('✅ Debug Response:');
        console.log(`   App ID: ${data.data.app_id}`);
        console.log(`   Type: ${data.data.type}`);
        console.log(`   Application: ${data.data.application}`);
        console.log(`   Is Valid: ${data.data.is_valid}`);
        console.log(`   Expires At: ${data.data.expires_at ? new Date(data.data.expires_at * 1000).toISOString() : 'Never'}`);
        console.log(`   Scopes: ${data.data.scopes ? data.data.scopes.join(', ') : 'None'}`);
        console.log(`   User ID: ${data.data.user_id}`);
        
        // Check if it has required scopes
        if (data.data.scopes) {
          const requiredScopes = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'];
          const hasRequired = requiredScopes.every(scope => data.data.scopes.includes(scope));
          console.log(`\n🔑 Required Scopes Check:`);
          console.log(`   Required: ${requiredScopes.join(', ')}`);
          console.log(`   Has All: ${hasRequired ? '✅ YES' : '❌ NO'}`);
          
          if (!hasRequired) {
            console.log('   ❌ Missing required permissions for /me/accounts');
          }
        }
      } else {
        console.log('❌ Debug Failed:', data.error);
      }
    } catch (error) {
      console.log('❌ Debug Error:', error.message);
    }

    // Check if this is a test token vs production
    console.log('\n🏭 Environment Check:');
    console.log(`   Current Token: ${token.substring(0, 10)}...`);
    console.log(`   Expected: Should be from OAuth flow with proper scopes`);
    console.log(`   Issue: Token might be from different app or wrong exchange`);

  } catch (error) {
    console.error('❌ Error analyzing token:', error);
  }
}

// Run the analysis
analyzeTokenType();
