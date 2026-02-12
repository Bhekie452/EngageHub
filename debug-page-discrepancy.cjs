// Debug Page Discrepancy - Database vs API
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugPageDiscrepancy() {
  console.log('🔍 Debugging Page Discrepancy');
  console.log('============================');
  
  const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
  
  try {
    // Step 1: Check database for all Facebook connections
    console.log('1️⃣ Checking database for Facebook connections...');
    const { data: connections, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Database error:', error);
      return;
    }
    
    console.log('✅ Found', connections.length, 'Facebook connections in database:');
    connections.forEach((conn, index) => {
      console.log(`\n📄 Connection ${index + 1}:`);
      console.log('  ID:', conn.id);
      console.log('  Type:', conn.account_type);
      console.log('  Name:', conn.display_name);
      console.log('  Account ID:', conn.account_id);
      console.log('  Token Present:', !!conn.access_token);
      console.log('  Token Length:', conn.access_token ? conn.access_token.length : 0);
      console.log('  Created:', conn.created_at);
      console.log('  Last Sync:', conn.last_sync_at);
      
      if (conn.account_type === 'page') {
        console.log('  🎯 PAGE DETAILS:');
        console.log('    Page ID:', conn.account_id);
        console.log('    Page Name:', conn.display_name);
        console.log('    Access Token:', conn.access_token ? 'Present' : 'Missing');
        
        // Test if the page token works
        if (conn.access_token) {
          testPageToken(conn.account_id, conn.access_token, conn.display_name);
        }
      }
    });
    
    // Step 2: Get profile token and test API
    console.log('\n2️⃣ Testing Facebook API with profile token...');
    const profileConn = connections.find(c => c.account_type === 'profile');
    if (profileConn && profileConn.access_token) {
      await testFacebookAPI(profileConn.access_token);
    }
    
    // Step 3: Compare database vs API
    console.log('\n3️⃣ Analysis:');
    const pageConnections = connections.filter(c => c.account_type === 'page');
    console.log('📊 Database pages found:', pageConnections.length);
    console.log('📊 API pages found: 0 (from previous test)');
    console.log('🔍 Discrepancy:', pageConnections.length > 0 ? 'YES' : 'NO');
    
    if (pageConnections.length > 0) {
      console.log('\n💡 Possible reasons for discrepancy:');
      console.log('• Page tokens are stored but may have expired');
      console.log('• Page was connected but later removed from Facebook');
      console.log('• API permissions changed since connection');
      console.log('• Page access token needs refresh');
      console.log('• Facebook API rate limiting');
    }
    
  } catch (err) {
    console.error('❌ Debug failed:', err.message);
  }
}

async function testPageToken(pageId, pageToken, pageName) {
  console.log(`\n🔧 Testing page token for: ${pageName}`);
  
  try {
    // Test page access token
    const testUrl = `https://graph.facebook.com/v21.0/${pageId}?fields=id,name,fan_count&access_token=${pageToken}`;
    const testResp = await fetch(testUrl);
    const testData = await testResp.json();
    
    console.log('  Response status:', testResp.status);
    
    if (testData.error) {
      console.log('  ❌ Page token failed:', testData.error.message);
      console.log('  🔍 Error type:', testData.error.type);
      console.log('  🔍 Error code:', testData.error.code);
    } else {
      console.log('  ✅ Page token SUCCESS');
      console.log('  📄 Page Name:', testData.name);
      console.log('  👥 Fans:', testData.fan_count || 'N/A');
    }
  } catch (error) {
    console.log('  ❌ Page token test error:', error.message);
  }
}

async function testFacebookAPI(profileToken) {
  console.log('\n🔧 Testing Facebook API with profile token...');
  
  try {
    // Test /me/accounts again
    const accountsUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,fan_count,access_token&access_token=${profileToken}`;
    const accountsResp = await fetch(accountsUrl);
    const accountsData = await accountsResp.json();
    
    console.log('Response status:', accountsResp.status);
    console.log('Pages found via API:', accountsData.data?.length || 0);
    
    if (accountsData.error) {
      console.log('❌ API Error:', accountsData.error.message);
    } else if (accountsData.data && accountsData.data.length > 0) {
      console.log('✅ API found pages:');
      accountsData.data.forEach((page, index) => {
        console.log(`  📄 ${index + 1}. ${page.name} (ID: ${page.id})`);
      });
    } else {
      console.log('ℹ️ API returned 0 pages');
    }
    
    // Test with different endpoint
    console.log('\n🔧 Testing alternative endpoint...');
    const altUrl = `https://graph.facebook.com/v21.0/me?fields=id,name,accounts{id,name,category,fan_count}&access_token=${profileToken}`;
    const altResp = await fetch(altUrl);
    const altData = await altResp.json();
    
    console.log('Alternative endpoint status:', altResp.status);
    if (altData.error) {
      console.log('❌ Alternative endpoint failed:', altData.error.message);
    } else {
      console.log('✅ Alternative endpoint SUCCESS');
      console.log('Accounts via nested field:', altData.accounts?.data?.length || 0);
    }
    
  } catch (error) {
    console.log('❌ API test error:', error.message);
  }
}

debugPageDiscrepancy();
