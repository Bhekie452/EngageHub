// Test Facebook Page Connection via API
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPageConnection() {
  const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
  
  console.log('🧪 Testing Facebook Page Connection via API...');
  console.log('Workspace:', workspaceId);
  
  try {
    // Test 1: Get connections
    console.log('\n1️⃣ Testing GET connections endpoint...');
    
    const connectionsUrl = `http://localhost:3000/api/facebook?action=connections&workspaceId=${workspaceId}`;
    
    try {
      const resp = await fetch(connectionsUrl);
      const data = await resp.json();
      
      if (data.success) {
        console.log('✅ Connections API working!');
        console.log('📊 Found', data.count, 'connections:');
        data.connections.forEach(conn => {
          console.log('  -', conn.displayName, '(', conn.accountType, ')');
          console.log('    Instagram:', conn.platform_data?.hasInstagram ? 'Yes' : 'No');
        });
      } else {
        console.log('❌ Connections API failed:', data.error);
      }
    } catch (fetchError) {
      console.log('⚠️ Local server not running, testing database directly...');
    }
    
    // Test 2: Get page connection directly from database
    console.log('\n2️⃣ Testing database page connection...');
    
    const { data: pageConnection } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('account_type', 'page')
      .eq('connection_status', 'connected')
      .single();
    
    if (pageConnection) {
      console.log('✅ Page connection found in database!');
      console.log('📄 Page Name:', pageConnection.display_name);
      console.log('🔗 Page ID:', pageConnection.account_id);
      console.log('📱 Instagram:', pageConnection.platform_data?.hasInstagram ? 'Connected' : 'Not connected');
      console.log('📊 Category:', pageConnection.platform_data?.category);
      console.log('🔑 Access Token:', pageConnection.access_token ? 'Present' : 'Missing');
      
      // Test 3: Verify page token with Facebook (if token exists)
      if (pageConnection.access_token) {
        console.log('\n3️⃣ Testing Facebook Graph API...');
        
        const testUrl = `https://graph.facebook.com/v21.0/${pageConnection.account_id}?fields=id,name,fan_count&access_token=${pageConnection.access_token}`;
        
        try {
          const fbResp = await fetch(testUrl);
          const fbData = await fbResp.json();
          
          if (fbData.error) {
            console.log('❌ Facebook API test failed:', fbData.error.message);
          } else {
            console.log('✅ Facebook API test successful!');
            console.log('📄 Page Name:', fbData.name);
            console.log('👥 Fan Count:', fbData.fan_count || 0);
          }
        } catch (fbError) {
          console.log('❌ Facebook API request failed:', fbError.message);
        }
      }
    } else {
      console.log('❌ No page connection found in database');
    }
    
    // Test 4: Show what frontend should receive
    console.log('\n4️⃣ Frontend API Response Format...');
    
    const { data: allConnections } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('connection_status', 'connected');
    
    const transformed = allConnections.map(c => ({
      id: c.id,
      workspaceId: c.workspace_id,
      platform: c.platform,
      displayName: c.display_name,
      isConnected: c.connection_status === 'connected',
      accessToken: c.access_token,
      pages: c.platform_data?.pages ?? [],
      accountType: c.account_type,
      accountId: c.account_id,
      username: c.username,
      connectionStatus: c.connection_status,
      lastSyncAt: c.last_sync_at,
      platformData: c.platform_data
    }));
    
    console.log('✅ Frontend will receive:');
    console.log(JSON.stringify(transformed, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPageConnection();
