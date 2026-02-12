// Test Option 3: Call /me/accounts with User Access Token
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOption3() {
  console.log('🔍 Option 3: Testing /me/accounts with User Access Token');
  console.log('======================================================');
  
  try {
    // Step 1: Get the user access token from database
    console.log('1️⃣ Getting User Access Token...');
    const { data: profileConn } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .eq('account_type', 'profile')
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!profileConn || !profileConn.access_token) {
      console.log('❌ No user access token found');
      return;
    }
    
    const userToken = profileConn.access_token;
    console.log('✅ User Access Token found');
    console.log('🔑 Token Length:', userToken.length);
    console.log('👤 Profile:', profileConn.display_name);
    
    // Step 2: Call /me/accounts (Option 3d)
    console.log('\n2️⃣ Calling /me/accounts endpoint...');
    const apiUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,access_token,tasks,fan_count,talking_about_count&access_token=${userToken}`;
    
    console.log('📡 API URL:', apiUrl);
    console.log('🔍 Making request...');
    
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      console.log('📊 Response Status:', response.status);
      console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
      
      if (data.error) {
        console.log('❌ API Error:');
        console.log('   Error Code:', data.error.code);
        console.log('   Error Message:', data.error.message);
        console.log('   Error Type:', data.error.error_user_title || 'N/A');
        
        // Analyze specific errors
        if (data.error.code === 200) {
          console.log('🔍 Analysis: Requires user token or permissions issue');
        } else if (data.error.code === 190) {
          console.log('🔍 Analysis: Token expired or invalid');
        } else if (data.error.code === 10) {
          console.log('🔍 Analysis: Permissions not granted');
        }
        
        return;
      }
      
      // Step 3: Interpret the result (Option 3e)
      console.log('\n3️⃣ Interpreting Results...');
      const pages = data.data || [];
      
      if (pages.length === 0) {
        console.log('📊 Result: Empty data array');
        console.log('❌ CONCLUSION: No pages are connected to your "Test 3" app');
        console.log('💡 This means:');
        console.log('   • Your new page is not linked to "Test 3" yet');
        console.log('   • You need to reconnect Facebook to discover pages');
        console.log('   • Or manually add page to "Test 3" app');
      } else {
        console.log('📊 Result: Found', pages.length, 'pages');
        console.log('✅ CONCLUSION: Pages are connected to your "Test 3" app!');
        
        pages.forEach((page, index) => {
          console.log(`\n📄 Page ${index + 1}:`);
          console.log('   Name:', page.name);
          console.log('   ID:', page.id);
          console.log('   Category:', page.category);
          console.log('   Fans:', page.fan_count || 'N/A');
          console.log('   Talking About:', page.talking_about_count || 'N/A');
          console.log('   Access Token:', page.access_token ? 'Present' : 'Missing');
          console.log('   Tasks:', page.tasks || []);
        });
      }
      
      // Step 4: Check permissions (Option 3b verification)
      console.log('\n4️⃣ Verifying Permissions...');
      const permsUrl = `https://graph.facebook.com/v21.0/me/permissions?access_token=${userToken}`;
      const permsResp = await fetch(permsUrl);
      const permsData = await permsResp.json();
      
      if (permsData.data) {
        console.log('🔐 Granted Permissions:');
        permsData.data.forEach(perm => {
          console.log(`   ${perm.permission}: ${perm.status}`);
        });
        
        const pagesPermissions = permsData.data.filter(p => 
          p.permission.includes('pages') || p.permission.includes('manage_pages')
        );
        
        if (pagesPermissions.length > 0) {
          console.log('✅ Pages permissions found:', pagesPermissions.map(p => p.permission).join(', '));
        } else {
          console.log('❌ No pages permissions found - this explains empty result');
        }
      }
      
    } catch (fetchError) {
      console.log('❌ Fetch Error:', fetchError.message);
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testOption3();
