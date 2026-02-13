require('dotenv').config();

async function testFacebookAPI() {
  console.log('🧪 Testing Facebook API Directly...\n');
  
  // Get the stored token from the connection
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL || 'https://your-project.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
  );

  const { data, error } = await supabase
    .from('social_accounts')
    .select('access_token')
    .eq('platform', 'facebook')
    .eq('account_type', 'profile')
    .single();

  if (error || !data) {
    console.log('❌ Could not get token:', error);
    return;
  }

  const token = data.access_token;
  console.log('🔑 Token found, testing Facebook API...');

  // Test 1: Basic profile info
  try {
    const profileResponse = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${token}`);
    const profileData = await profileResponse.json();
    console.log('✅ Profile Test:', profileData.name || profileData.error);
  } catch (err) {
    console.log('❌ Profile Test Failed:', err.message);
  }

  // Test 2: Pages API
  try {
    const pagesResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account,category&access_token=${token}`);
    const pagesData = await pagesResponse.json();
    
    console.log('📄 Pages API Response:');
    if (pagesData.error) {
      console.log('   ❌ Error:', pagesData.error.message);
      console.log('   Type:', pagesData.error.type);
      console.log('   Code:', pagesData.error.code);
    } else {
      console.log('   ✅ Success!');
      console.log('   Pages Count:', pagesData.data?.length || 0);
      
      if (pagesData.data && pagesData.data.length > 0) {
        pagesData.data.forEach((page, index) => {
          console.log(`   ${index + 1}. ${page.name} (${page.id})`);
        });
      }
    }
  } catch (err) {
    console.log('❌ Pages Test Failed:', err.message);
  }

  // Test 3: Test with different endpoint
  try {
    const altResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name&access_token=${token}`);
    const altData = await altResponse.json();
    console.log('🔄 Alternative API (v18.0):', altData.data?.length || 0, 'pages');
  } catch (err) {
    console.log('❌ Alternative API Failed:', err.message);
  }
}

testFacebookAPI();
