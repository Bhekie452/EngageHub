// Test with Correct Workspace
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCorrectWorkspace() {
  console.log('🔍 Testing with Correct Workspace');
  console.log('=================================');
  
  const workspaceId = '76844eda-1015-4d3b-896b-10a99dfe6f88'; // The workspace that actually has the connection
  
  try {
    // Get profile connection
    const { data: profileConn } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('account_type', 'profile')
      .eq('connection_status', 'connected')
      .single();
    
    if (!profileConn) {
      console.log('❌ No profile connection found in workspace:', workspaceId);
      return;
    }
    
    const profileToken = profileConn.access_token;
    console.log('✅ Profile token found in workspace:', workspaceId);
    console.log('🔑 Token length:', profileToken.length);
    console.log('👤 Profile Name:', profileConn.display_name);
    
    // Test what Facebook actually returns for pages
    console.log('\n🔍 Testing what Facebook returns for pages...');
    
    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,access_token,tasks,perms,fan_count,talking_about_count&access_token=${profileToken}`;
    const pagesResp = await fetch(pagesUrl);
    const pagesData = await pagesResp.json();
    
    console.log('Response status:', pagesResp.status);
    
    if (pagesData.error) {
      console.log('❌ API Error:', pagesData.error.message);
      console.log('Error type:', pagesData.error.type);
      console.log('Error code:', pagesData.error.code);
      
      if (pagesData.error.code === 190) {
        console.log('\n🔍 This is an OAuth token issue - token may be expired');
      }
      return;
    }
    
    const pages = pagesData.data || [];
    console.log('\n📊 Facebook returned:', pages.length, 'pages');
    
    if (pages.length === 0) {
      console.log('\n🎯 DIAGNOSIS: You genuinely do not manage any Facebook pages');
      console.log('💡 To test page functionality, you need to:');
      console.log('   1. Go to Facebook');
      console.log('   2. Create a new page');
      console.log('   3. Make yourself admin');
      console.log('   4. Reconnect Facebook to this app');
      return;
    }
    
    console.log('\n📄 Pages found:');
    pages.forEach((page, index) => {
      console.log(`\n📄 Page ${index + 1}:`);
      console.log('  Name:', page.name);
      console.log('  ID:', page.id);
      console.log('  Category:', page.category);
      console.log('  Access Token:', page.access_token ? 'Present' : 'Missing');
      console.log('  Token Length:', page.access_token ? page.access_token.length : 0);
      console.log('  Fans:', page.fan_count || 'N/A');
      console.log('  Talking About:', page.talking_about_count || 'N/A');
      console.log('  Tasks:', page.tasks || []);
      console.log('  Permissions:', page.perms || []);
      
      // Test if page token works
      if (page.access_token) {
        testPageToken(page.id, page.access_token, page.name);
      }
    });
    
    console.log('\n🎯 CONCLUSION:');
    if (pages.length > 0) {
      console.log('✅ You DO manage Facebook pages');
      console.log('❌ Our app is NOT storing page tokens properly');
      console.log('🔧 Need to fix page token extraction in backend');
      console.log('💡 The pages should appear in your app but they don\'t');
    } else {
      console.log('✅ Our app is working correctly');
      console.log('ℹ️ You genuinely do not manage any Facebook pages');
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

async function testPageToken(pageId, pageToken, pageName) {
  try {
    const testUrl = `https://graph.facebook.com/v21.0/${pageId}?fields=id,name,fan_count,talking_about_count&access_token=${pageToken}`;
    const testResp = await fetch(testUrl);
    const testData = await testResp.json();
    
    if (testData.error) {
      console.log(`    ❌ Page token failed for ${pageName}:`, testData.error.message);
    } else {
      console.log(`    ✅ Page token works for ${pageName}`);
      console.log(`    👥 Fans: ${testData.fan_count || 'N/A'}`);
      console.log(`    💬 Talking About: ${testData.talking_about_count || 'N/A'}`);
    }
  } catch (error) {
    console.log(`    ❌ Page token test error:`, error.message);
  }
}

testCorrectWorkspace();
