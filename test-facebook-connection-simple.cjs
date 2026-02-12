// Simple test to check Facebook connection without other services interfering
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFacebookConnection() {
  console.log('🔍 Simple Facebook Connection Test');
  console.log('=====================================');
  
  try {
    // Step 1: Check Facebook connections in database
    console.log('1️⃣ Checking Facebook connections...');
    const { data: connections, error: connError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false });
    
    if (connError) {
      console.error('❌ Database error:', connError);
      return;
    }
    
    console.log(`✅ Found ${connections.length} Facebook connections`);
    
    if (connections.length === 0) {
      console.log('❌ No Facebook connections found');
      return;
    }
    
    // Step 2: Test each connection
    for (let i = 0; i < connections.length; i++) {
      const conn = connections[i];
      console.log(`\n📄 Connection ${i + 1}:`);
      console.log(`   Name: ${conn.display_name}`);
      console.log(`   Type: ${conn.account_type}`);
      console.log(`   Workspace: ${conn.workspace_id}`);
      console.log(`   Token Present: ${!!conn.access_token}`);
      console.log(`   Created: ${conn.created_at}`);
      
      // Step 3: Test token validity
      if (conn.access_token) {
        console.log(`   🔑 Testing token...`);
        try {
          const testUrl = `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${conn.access_token}`;
          const response = await fetch(testUrl);
          const data = await response.json();
          
          if (data.error) {
            console.log(`   ❌ Token invalid: ${data.error.message}`);
          } else {
            console.log(`   ✅ Token valid for: ${data.name} (${data.id})`);
          }
        } catch (tokenError) {
          console.log(`   ❌ Token test failed: ${tokenError.message}`);
        }
      }
      
      // Step 4: If it's a profile, test for pages
      if (conn.account_type === 'profile' && conn.access_token) {
        console.log(`   🔍 Testing for pages...`);
        try {
          const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${conn.access_token}`;
          const pagesResponse = await fetch(pagesUrl);
          const pagesData = await pagesResponse.json();
          
          if (pagesData.error) {
            console.log(`   ❌ Pages check failed: ${pagesData.error.message}`);
          } else {
            console.log(`   ✅ Pages found: ${pagesData.data?.length || 0}`);
            pagesData.data?.forEach((page, idx) => {
              console.log(`      📄 Page ${idx + 1}: ${page.name} (${page.id})`);
            });
          }
        } catch (pagesError) {
          console.log(`   ❌ Pages check failed: ${pagesError.message}`);
        }
      }
    }
    
    console.log('\n🎯 Summary:');
    console.log(`   • Total connections: ${connections.length}`);
    console.log(`   • Profile connections: ${connections.filter(c => c.account_type === 'profile').length}`);
    console.log(`   • Page connections: ${connections.filter(c => c.account_type === 'page').length}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFacebookConnection();
