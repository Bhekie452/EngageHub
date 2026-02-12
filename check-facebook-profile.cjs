// Check Facebook Profile Connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFacebookProfile() {
  console.log('🔍 Checking Facebook Profile Connection...');
  console.log('==========================================');
  
  const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
  
  try {
    // Check for Facebook profiles specifically
    const { data: profileConnections, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('account_type', 'profile')
      .eq('connection_status', 'connected');
    
    if (error) {
      console.error('❌ Database error:', error);
      return;
    }
    
    if (profileConnections && profileConnections.length > 0) {
      console.log('✅ FOUND', profileConnections.length, 'Facebook Profile(s):');
      profileConnections.forEach((conn, index) => {
        console.log('\n👤 Profile ' + (index + 1) + ':');
        console.log('   ID:', conn.id);
        console.log('   Display Name:', conn.display_name);
        console.log('   Account ID:', conn.account_id);
        console.log('   Token Present:', !!conn.access_token);
        console.log('   Token Length:', conn.access_token ? conn.access_token.length : 0);
        console.log('   Connection Status:', conn.connection_status);
        console.log('   Created:', conn.created_at);
        console.log('   Last Sync:', conn.last_sync_at);
        
        if (conn.access_token) {
          console.log('   Token Preview:', conn.access_token.substring(0, 20) + '...' + conn.access_token.substring(conn.access_token.length - 4));
        }
      });
    } else {
      console.log('❌ NO Facebook Profile connections found');
      console.log('   Workspace ID:', workspaceId);
      console.log('   Platform: facebook');
      console.log('   Account Type: profile');
      console.log('   Status: connected');
    }
    
    // Also check all Facebook connections (pages + profiles)
    console.log('\n📊 All Facebook Connections:');
    const { data: allConnections } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('connection_status', 'connected');
    
    if (allConnections && allConnections.length > 0) {
      console.log('Total Facebook connections:', allConnections.length);
      allConnections.forEach(conn => {
        console.log('  -', conn.account_type.toUpperCase(), ':', conn.display_name, '(Token:', !!conn.access_token ? 'Yes' : 'No', ')');
      });
    } else {
      console.log('No Facebook connections at all');
    }
    
  } catch (err) {
    console.error('❌ Check failed:', err.message);
  }
}

checkFacebookProfile();
