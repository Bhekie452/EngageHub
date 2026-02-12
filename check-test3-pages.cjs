// Check Pages Integrated with Test 3 Meta App
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTest3Pages() {
  console.log('🔍 Checking Pages Integrated with "Test 3"');
  console.log('=======================================');
  
  try {
    // Step 1: Get all Facebook connections
    console.log('1️⃣ Getting all Facebook connections...');
    const { data: connections, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Database error:', error);
      return;
    }
    
    if (!connections || connections.length === 0) {
      console.log('❌ No Facebook connections found');
      return;
    }
    
    console.log('✅ Found', connections.length, 'Facebook connections');
    
    // Step 2: Check each connection
    for (let i = 0; i < connections.length; i++) {
      const conn = connections[i];
      console.log(`\n📄 Connection ${i + 1}:`);
      console.log('  Name:', conn.display_name);
      console.log('  Type:', conn.account_type);
      console.log('  Account ID:', conn.account_id);
      console.log('  Workspace:', conn.workspace_id);
      console.log('  Token Present:', !!conn.access_token);
      console.log('  Token Length:', conn.access_token ? conn.access_token.length : 0);
      console.log('  Created:', conn.created_at);
      
      // Test if this connection can access pages
      if (conn.access_token) {
        await testPageAccess(conn.access_token, conn.display_name, conn.account_type);
      }
    }
    
    // Step 3: Check specifically for page connections
    console.log('\n2️⃣ Checking for page connections...');
    const pageConnections = connections.filter(c => c.account_type === 'page');
    
    if (pageConnections.length === 0) {
      console.log('❌ No page connections found in database');
      console.log('💡 This means no pages have been integrated with "Test 3" yet');
    } else {
      console.log('✅ Found', pageConnections.length, 'page connections:');
      pageConnections.forEach((page, index) => {
        console.log(`  📄 Page ${index + 1}: ${page.display_name} (ID: ${page.account_id})`);
      });
    }
    
    // Step 4: Test with profile token to see what pages are available
    console.log('\n3️⃣ Testing what pages "Test 3" can access...');
    const profileConn = connections.find(c => c.account_type === 'profile');
    
    if (profileConn && profileConn.access_token) {
      await testAvailablePages(profileConn.access_token);
    } else {
      console.log('❌ No profile connection found to test page access');
    }
    
  } catch (err) {
    console.error('❌ Check failed:', err.message);
  }
}

async function testPageAccess(token, name, type) {
  console.log(`\n🔧 Testing ${type} access for: ${name}`);
  
  try {
    if (type === 'page') {
      // Test page-specific access
      const pageId = name.includes('_') ? name.split('_')[1] : name;
      const testUrl = `https://graph.facebook.com/v21.0/${pageId}?fields=id,name,fan_count,talking_about_count&access_token=${token}`;
      const testResp = await fetch(testUrl);
      const testData = await testResp.json();
      
      if (testData.error) {
        console.log('  ❌ Page access failed:', testData.error.message);
      } else {
        console.log('  ✅ Page access successful');
        console.log('  📄 Page Name:', testData.name);
        console.log('  👥 Fans:', testData.fan_count || 'N/A');
        console.log('  💬 Talking About:', testData.talking_about_count || 'N/A');
      }
    } else {
      // For profile, we'll test in the main function
      console.log('  🔑 Profile token ready for page discovery');
    }
    
  } catch (error) {
    console.log('  ❌ Access test failed:', error.message);
  }
}

async function testAvailablePages(profileToken) {
  console.log('\n🔍 Discovering pages available to "Test 3"...');
  
  try {
    // Test different endpoints to find pages
    const endpoints = [
      {
        name: 'User Pages (/me/accounts)',
        url: `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,access_token,fan_count,talking_about_count,tasks,perms&access_token=${profileToken}`
      },
      {
        name: 'User Likes (/me/likes)',
        url: `https://graph.facebook.com/v21.0/me/likes?fields=id,name,category&access_token=${profileToken}`
      },
      {
        name: 'User Groups (/me/groups)',
        url: `https://graph.facebook.com/v21.0/me/groups?fields=id,name,member_count&access_token=${profileToken}`
      }
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n📋 Testing: ${endpoint.name}`);
      
      try {
        const resp = await fetch(endpoint.url);
        const data = await resp.json();
        
        console.log('  Status:', resp.status);
        
        if (data.error) {
          console.log('  ❌ Error:', data.error.message);
          console.log('  🔍 Error Code:', data.error.code);
          
          if (data.error.code === 200) {
            console.log('  💡 This usually means insufficient permissions');
          }
        } else {
          const items = data.data || [];
          console.log('  ✅ Success! Found', items.length, 'items');
          
          if (items.length > 0) {
            items.forEach((item, index) => {
              console.log(`    📄 ${index + 1}. ${item.name}`);
              console.log(`       ID: ${item.id}`);
              console.log(`       Category: ${item.category || 'N/A'}`);
              if (item.fan_count !== undefined) console.log(`       Fans: ${item.fan_count}`);
              if (item.member_count !== undefined) console.log(`       Members: ${item.member_count}`);
              if (item.access_token) console.log(`       Access Token: Present (${item.access_token.length} chars)`);
            });
          }
        }
        
      } catch (error) {
        console.log('  ❌ Request failed:', error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Page discovery failed:', error.message);
  }
}

checkTest3Pages();
