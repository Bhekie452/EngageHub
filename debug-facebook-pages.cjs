// Debug Facebook Pages Issue
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugFacebookPages() {
  console.log('🔍 Debugging Facebook Pages Issue');
  console.log('==================================');
  
  const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
  
  try {
    // Step 1: Get Facebook profile connection
    console.log('1️⃣ Getting Facebook profile connection...');
    const { data: connections, error } = await supabase
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
    
    if (!connections || connections.length === 0) {
      console.log('❌ No Facebook profile connection found');
      return;
    }
    
    const profileConn = connections[0];
    const accessToken = profileConn.access_token;
    console.log('✅ Found Facebook profile connection');
    console.log('🔑 Access token length:', accessToken.length);
    
    // Step 2: Test different Facebook API endpoints for pages
    console.log('\n2️⃣ Testing Facebook Pages API endpoints...');
    
    // Test endpoint 1: /me/accounts
    console.log('\n📋 Testing /me/accounts...');
    try {
      const accountsUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,fan_count,talking_about_count,access_token&access_token=${accessToken}`;
      const accountsResp = await fetch(accountsUrl);
      const accountsData = await accountsResp.json();
      
      console.log('Response status:', accountsResp.status);
      console.log('Response data:', JSON.stringify(accountsData, null, 2));
      
      if (accountsData.error) {
        console.log('❌ /me/accounts failed:', accountsData.error.message);
      } else {
        console.log('✅ /me/accounts SUCCESS');
        console.log('📊 Pages found:', accountsData.data?.length || 0);
        
        if (accountsData.data && accountsData.data.length > 0) {
          accountsData.data.forEach((page, index) => {
            console.log(`\n📄 Page ${index + 1}:`);
            console.log('  Name:', page.name);
            console.log('  ID:', page.id);
            console.log('  Category:', page.category);
            console.log('  Fans:', page.fan_count || 'N/A');
            console.log('  Talking About:', page.talking_about_count || 'N/A');
            console.log('  Has Access Token:', !!page.access_token);
          });
        }
      }
    } catch (error) {
      console.log('❌ /me/accounts error:', error.message);
    }
    
    // Test endpoint 2: /me/likes (pages user likes)
    console.log('\n❤️ Testing /me/likes...');
    try {
      const likesUrl = `https://graph.facebook.com/v21.0/me/likes?fields=id,name,category&access_token=${accessToken}`;
      const likesResp = await fetch(likesUrl);
      const likesData = await likesResp.json();
      
      console.log('Response status:', likesResp.status);
      console.log('📊 Liked pages found:', likesData.data?.length || 0);
      
      if (likesData.error) {
        console.log('❌ /me/likes failed:', likesData.error.message);
      } else {
        console.log('✅ /me/likes SUCCESS');
        if (likesData.data && likesData.data.length > 0) {
          likesData.data.forEach((page, index) => {
            console.log(`\n❤️ Liked Page ${index + 1}:`);
            console.log('  Name:', page.name);
            console.log('  Category:', page.category);
          });
        }
      }
    } catch (error) {
      console.log('❌ /me/likes error:', error.message);
    }
    
    // Test endpoint 3: /user/permissions (check what permissions we actually have)
    console.log('\n🔐 Testing /user/permissions...');
    try {
      const permsUrl = `https://graph.facebook.com/v21.0/me/permissions?access_token=${accessToken}`;
      const permsResp = await fetch(permsUrl);
      const permsData = await permsResp.json();
      
      console.log('Response status:', permsResp.status);
      console.log('📊 Permissions found:', permsData.data?.length || 0);
      
      if (permsData.error) {
        console.log('❌ /me/permissions failed:', permsData.error.message);
      } else {
        console.log('✅ /me/permissions SUCCESS');
        if (permsData.data && permsData.data.length > 0) {
          console.log('\n🔐 Granted Permissions:');
          permsData.data.forEach(perm => {
            console.log(`  ${perm.permission}: ${perm.status}`);
          });
        }
      }
    } catch (error) {
      console.log('❌ /me/permissions error:', error.message);
    }
    
    // Step 3: Check if user has admin rights
    console.log('\n3️⃣ Checking user profile details...');
    try {
      const profileUrl = `https://graph.facebook.com/v21.0/me?fields=id,name,email,permissions,roles&access_token=${accessToken}`;
      const profileResp = await fetch(profileUrl);
      const profileData = await profileResp.json();
      
      console.log('Response status:', profileResp.status);
      console.log('👤 Profile:', profileData.name);
      console.log('📧 Email:', profileData.email || 'Not available');
      console.log('🔐 Permissions:', profileData.permissions?.length || 0, 'granted');
      console.log('👑 Roles:', profileData.roles || 'None specified');
      
      if (profileData.error) {
        console.log('❌ Profile details failed:', profileData.error.message);
      }
    } catch (error) {
      console.log('❌ Profile details error:', error.message);
    }
    
    console.log('\n🎯 Debug Summary:');
    console.log('• If /me/accounts shows 0 pages, you may not manage any Facebook pages');
    console.log('• If /me/likes shows pages, you only like them but don\'t manage them');
    console.log('• Check permissions to ensure pages_show_list is granted');
    console.log('• To manage pages, you need to be an admin/creator of those pages');
    
  } catch (err) {
    console.error('❌ Debug failed:', err.message);
  }
}

debugFacebookPages();
