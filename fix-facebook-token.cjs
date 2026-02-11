// Fix Facebook Token Issue
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixFacebookToken() {
  const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
  
  console.log('🔧 Fixing Facebook Token Issue...');
  console.log('Workspace:', workspaceId);
  
  try {
    // Get profile connection with valid token
    const { data: profileConn } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('account_type', 'profile')
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!profileConn) {
      console.error('❌ No profile connection found');
      return;
    }
    
    console.log('✅ Found profile connection:', profileConn.display_name);
    console.log('🔑 Token Present:', !!profileConn.access_token);
    console.log('📏 Token Length:', profileConn.access_token ? profileConn.access_token.length : 0);
    
    // Test the token with Facebook
    if (profileConn.access_token) {
      console.log('🔄 Testing Facebook token...');
      
      const testUrl = `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${profileConn.access_token}`;
      
      try {
        const resp = await fetch(testUrl);
        const data = await resp.json();
        
        if (data.error) {
          console.error('❌ Token test failed:', data.error.message);
          console.log('💡 Token may be expired - need to re-authenticate');
        } else {
          console.log('✅ Token is valid!');
          console.log('👤 User:', data.name, '(ID:', data.id, ')');
          
          // Create localStorage script to set token
          console.log('\n📋 Frontend Fix:');
          console.log('Add this to your browser console:');
          console.log(`localStorage.setItem('facebook_access_token', '${profileConn.access_token}');`);
          console.log(`localStorage.setItem('current_workspace_id', '${workspaceId}');`);
        }
      } catch (error) {
        console.error('❌ Token test error:', error.message);
      }
    }
    
    // Show all connections
    console.log('\n📊 All Facebook Connections:');
    const { data: allConnections } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('connection_status', 'connected');
    
    allConnections.forEach(conn => {
      console.log('🔹', conn.account_type.toUpperCase(), ':', conn.display_name);
      console.log('   Token:', conn.access_token ? 'Present' : 'Missing');
      console.log('   Length:', conn.access_token ? conn.access_token.length : 0);
      console.log('   ID:', conn.account_id);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixFacebookToken();
