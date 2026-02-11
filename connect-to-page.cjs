// Connect to existing Facebook Page
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function connectToPage() {
  const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
  const pageId = '991921717332604';
  const pageName = 'Engagehub Testing Page';
  
  console.log('🔗 Connecting to Facebook Page...');
  console.log('Workspace:', workspaceId);
  console.log('Page:', pageName, '-', pageName);
  
  try {
    // First, let's get a page access token using the profile connection
    const { data: profileConn } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('account_type', 'profile')
      .eq('connection_status', 'connected')
      .single();
    
    if (!profileConn) {
      console.error('❌ No profile connection found. Please connect Facebook first.');
      return;
    }
    
    console.log('✅ Found profile connection:', profileConn.display_name);
    
    // Test the profile token by fetching pages
    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?` +
      `fields=id,name,access_token,instagram_business_account,category,fan_count` +
      `&access_token=${profileConn.access_token}`;
    
    console.log('🔄 Fetching pages from Facebook...');
    const pagesResp = await fetch(pagesUrl);
    const pagesData = await pagesResp.json();
    
    if (pagesData.error) {
      console.error('❌ Failed to fetch pages:', pagesData.error);
      return;
    }
    
    const pages = pagesData.data || [];
    console.log('✅ Found', pages.length, 'pages:');
    
    const targetPage = pages.find(p => p.id === pageId);
    
    if (!targetPage) {
      console.error('❌ Page', pageId, 'not found in your Facebook pages');
      console.log('Available pages:');
      pages.forEach(p => {
        console.log('  -', p.name, '(ID:', p.id, ')');
      });
      return;
    }
    
    console.log('🎯 Found target page:', targetPage.name);
    console.log('   Page Access Token:', targetPage.access_token ? 'Available' : 'Missing');
    console.log('   Instagram:', targetPage.instagram_business_account ? 'Connected' : 'Not connected');
    console.log('   Category:', targetPage.category);
    console.log('   Fans:', targetPage.fan_count || 0);
    
    // Update the page connection with proper platform_data
    const { data: updatedPage, error: updateError } = await supabase
      .from('social_accounts')
      .update({
        platform_data: {
          instagram_business_account_id: targetPage.instagram_business_account?.id,
          category: targetPage.category,
          fan_count: targetPage.fan_count || 0,
          hasInstagram: !!targetPage.instagram_business_account,
          pageVerified: true,
          pageAccessToken: targetPage.access_token,
          lastVerified: new Date().toISOString()
        },
        access_token: targetPage.access_token,
        connection_status: 'connected',
        last_sync_at: new Date().toISOString()
      })
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('account_id', pageId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Failed to update page connection:', updateError);
      return;
    }
    
    console.log('✅ Page connection updated successfully!');
    console.log('📄 Page Name:', updatedPage.display_name);
    console.log('🔗 Page ID:', updatedPage.account_id);
    console.log('📱 Instagram:', updatedPage.platform_data.hasInstagram ? 'Yes' : 'No');
    console.log('👥 Fans:', updatedPage.platform_data.fan_count);
    
    // Test the page token
    console.log('🔄 Testing page access token...');
    const testUrl = `https://graph.facebook.com/v21.0/${pageId}?fields=id,name,fan_count&access_token=${targetPage.access_token}`;
    const testResp = await fetch(testUrl);
    const testData = await testResp.json();
    
    if (testData.error) {
      console.error('❌ Page token test failed:', testData.error);
    } else {
      console.log('✅ Page token is valid!');
      console.log('📄 Page Name:', testData.name);
      console.log('👥 Fan Count:', testData.fan_count || 0);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

connectToPage();
