// Direct Facebook Page Connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function directPageConnect() {
  const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
  const pageId = '991921717332604';
  const pageName = 'Engagehub Testing Page';
  
  console.log('🔗 Direct Facebook Page Connection...');
  console.log('Workspace:', workspaceId);
  console.log('Page:', pageId, '-', pageName);
  
  try {
    // Check if page connection exists
    const { data: existingPage } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('account_id', pageId)
      .single();
    
    if (existingPage) {
      console.log('✅ Existing page connection found:', existingPage.display_name);
      console.log('📊 Current status:', existingPage.connection_status);
      console.log('🔗 Access token:', existingPage.access_token ? 'Present' : 'Missing');
      
      // Update with proper platform data
      const { data: updatedPage, error } = await supabase
        .from('social_accounts')
        .update({
          platform_data: {
            instagram_business_account_id: '17841456685787301', // Your Instagram ID
            category: 'Brand',
            fan_count: 0,
            hasInstagram: true,
            pageVerified: true,
            lastVerified: new Date().toISOString(),
            connectionMethod: 'direct'
          },
          connection_status: 'connected',
          last_sync_at: new Date().toISOString()
        })
        .eq('workspace_id', workspaceId)
        .eq('account_id', pageId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Update failed:', error);
      } else {
        console.log('✅ Page connection updated!');
        console.log('📄 Display Name:', updatedPage.display_name);
        console.log('📱 Instagram:', updatedPage.platform_data.hasInstagram ? 'Connected' : 'Not connected');
        console.log('📊 Category:', updatedPage.platform_data.category);
      }
    } else {
      console.log('❌ No existing page connection found');
      console.log('💡 You need to connect Facebook first to get page access tokens');
    }
    
    // Show all Facebook connections for this workspace
    console.log('\n📋 All Facebook connections for workspace:');
    const { data: allConnections } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('connection_status', 'connected');
    
    allConnections.forEach(conn => {
      console.log('🔹', conn.account_type.toUpperCase(), ':', conn.display_name);
      console.log('   ID:', conn.account_id);
      console.log('   Status:', conn.connection_status);
      console.log('   Instagram:', conn.platform_data?.hasInstagram ? 'Yes' : 'No');
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

directPageConnect();
