// Check ALL Facebook connections (including disconnected)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllFacebookConnections() {
  console.log('🔍 Checking ALL Facebook Connections');
  console.log('===================================');
  
  try {
    // Get ALL Facebook connections (any status)
    console.log('1️⃣ Getting ALL Facebook connections (any status)...');
    const { data: allConnections, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Database error:', error);
      return;
    }
    
    console.log(`✅ Found ${allConnections.length} total Facebook connections:`);
    
    // Group by status
    const byStatus = {};
    allConnections.forEach(conn => {
      const status = conn.connection_status || 'unknown';
      if (!byStatus[status]) {
        byStatus[status] = [];
      }
      byStatus[status].push(conn);
    });
    
    // Show connections by status
    Object.entries(byStatus).forEach(([status, conns]) => {
      console.log(`\n📊 Status: ${status.toUpperCase()} (${conns.length} connections)`);
      conns.forEach((conn, idx) => {
        console.log(`   ${idx + 1}. ${conn.display_name} (${conn.account_type})`);
        console.log(`      ID: ${conn.id}`);
        console.log(`      Workspace: ${conn.workspace_id}`);
        console.log(`      Account ID: ${conn.account_id}`);
        console.log(`      Created: ${conn.created_at}`);
        console.log(`      Token Present: ${!!conn.access_token}`);
        if (conn.access_token) {
          console.log(`      Token Length: ${conn.access_token.length}`);
        }
        console.log('');
      });
    });
    
    // Look specifically for "Engagehub Testing Page"
    console.log('2️⃣ Searching for "Engagehub Testing Page"...');
    const testingPage = allConnections.find(c => 
      c.display_name && c.display_name.toLowerCase().includes('engagehub testing')
    );
    
    if (testingPage) {
      console.log('✅ Found "Engagehub Testing Page":');
      console.log('  Name:', testingPage.display_name);
      console.log('  Type:', testingPage.account_type);
      console.log('  Status:', testingPage.connection_status);
      console.log('  Workspace:', testingPage.workspace_id);
      console.log('  Created:', testingPage.created_at);
      console.log('  Token Present:', !!testingPage.access_token);
      
      // Test if the page token still works
      if (testingPage.access_token && testingPage.account_type === 'page') {
        console.log('\n🔧 Testing page token...');
        try {
          const testUrl = `https://graph.facebook.com/v21.0/${testingPage.account_id}?fields=id,name,fan_count&access_token=${testingPage.access_token}`;
          const testResp = await fetch(testUrl);
          const testData = await testResp.json();
          
          if (testData.error) {
            console.log('  ❌ Page token failed:', testData.error.message);
          } else {
            console.log('  ✅ Page token works!');
            console.log('  📄 Page Name:', testData.name);
            console.log('  👥 Fans:', testData.fan_count || 'N/A');
          }
        } catch (error) {
          console.log('  ❌ Token test error:', error.message);
        }
      }
    } else {
      console.log('❌ "Engagehub Testing Page" not found in database');
    }
    
    // Check recent connections
    console.log('\n3️⃣ Recent connections (last 24 hours)...');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentConnections = allConnections.filter(c => 
      c.created_at >= oneDayAgo
    );
    
    console.log(`Found ${recentConnections.length} connections in last 24 hours:`);
    recentConnections.forEach((conn, idx) => {
      console.log(`   ${idx + 1}. ${conn.display_name} (${conn.account_type}) - ${conn.connection_status}`);
      console.log(`      Created: ${conn.created_at}`);
    });
    
  } catch (err) {
    console.error('❌ Check failed:', err.message);
  }
}

checkAllFacebookConnections();
