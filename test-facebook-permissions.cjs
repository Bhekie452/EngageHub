// Test Facebook Permissions Script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFacebookPermissions() {
  console.log('🧪 Testing Facebook Permissions');
  console.log('================================');
  
  const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
  
  try {
    // Step 1: Check for existing Facebook connections
    console.log('1️⃣ Checking Facebook Connections...');
    const { data: connections, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('connection_status', 'connected');
    
    if (error) {
      console.error('❌ Database error:', error);
      return;
    }
    
    if (!connections || connections.length === 0) {
      console.log('❌ No Facebook connections found');
      console.log('💡 Please connect Facebook first to test permissions');
      return;
    }
    
    console.log('✅ Found', connections.length, 'Facebook connections');
    
    // Find profile connection
    const profileConn = connections.find(c => c.account_type === 'profile');
    if (!profileConn) {
      console.log('❌ No Facebook profile connection found');
      return;
    }
    
    const accessToken = profileConn.access_token;
    if (!accessToken) {
      console.log('❌ No access token found in profile connection');
      return;
    }
    
    console.log('🔑 Access token found (length:', accessToken.length, ')');
    
    // Step 2: Test Facebook Profile Permissions
    console.log('\n2️⃣ Testing Facebook Profile Permissions...');
    await testFacebookProfile(accessToken);
    
    // Step 3: Test Facebook Pages Permissions
    console.log('\n3️⃣ Testing Facebook Pages Permissions...');
    await testFacebookPages(accessToken);
    
    // Step 4: Test Instagram Integration
    console.log('\n4️⃣ Testing Instagram Integration...');
    await testInstagramIntegration(accessToken);
    
    console.log('\n✅ All permission tests completed!');
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

async function testFacebookProfile(token) {
  console.log('\n👤 FACEBOOK PROFILE TESTS:');
  
  try {
    // Test public_profile - Get user name and profile picture
    console.log('  📄 Testing public_profile...');
    const profileUrl = `https://graph.facebook.com/v21.0/me?fields=id,name,picture,email&access_token=${token}`;
    const profileResp = await fetch(profileUrl);
    const profileData = await profileResp.json();
    
    if (profileData.error) {
      console.log('  ❌ public_profile failed:', profileData.error.message);
    } else {
      console.log('  ✅ public_profile SUCCESS');
      console.log('    👤 Name:', profileData.name);
      console.log('    📧 Email:', profileData.email || 'Not available');
      console.log('    🖼️ Profile Picture:', profileData.picture ? 'Available' : 'Not available');
      console.log('    🆔 User ID:', profileData.id);
    }
    
  } catch (error) {
    console.log('  ❌ Profile test error:', error.message);
  }
}

async function testFacebookPages(token) {
  console.log('\n📄 FACEBOOK PAGES TESTS:');
  
  try {
    // Test pages_show_list - List pages you manage
    console.log('  📋 Testing pages_show_list...');
    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,fan_count,talking_about_count,access_token&access_token=${token}`;
    const pagesResp = await fetch(pagesUrl);
    const pagesData = await pagesResp.json();
    
    if (pagesData.error) {
      console.log('  ❌ pages_show_list failed:', pagesData.error.message);
      return;
    }
    
    const pages = pagesData.data || [];
    console.log('  ✅ pages_show_list SUCCESS');
    console.log('    📊 Found', pages.length, 'Facebook pages');
    
    if (pages.length === 0) {
      console.log('    ℹ️ No pages found - user may not manage any pages');
      return;
    }
    
    // Test pages_read_engagement - Get page insights
    console.log('  📈 Testing pages_read_engagement...');
    for (const page of pages.slice(0, 3)) { // Test first 3 pages
      console.log(`    📊 Testing insights for: ${page.name}...`);
      
      const insightsUrl = `https://graph.facebook.com/v21.0/${page.id}/insights?metric=page_impressions,page_engaged_users,page_views&access_token=${page.access_token}`;
      const insightsResp = await fetch(insightsUrl);
      const insightsData = await insightsResp.json();
      
      if (insightsData.error) {
        console.log(`      ❌ Insights failed for ${page.name}:`, insightsData.error.message);
      } else {
        console.log(`      ✅ Insights SUCCESS for ${page.name}`);
        console.log(`        📈 Impressions:`, insightsData.data?.[0]?.values?.[0]?.value || 'N/A');
        console.log(`        👥 Engaged Users:`, insightsData.data?.[1]?.values?.[0]?.value || 'N/A');
        console.log(`        👁️ Page Views:`, insightsData.data?.[2]?.values?.[0]?.value || 'N/A');
      }
      
      // Test page performance data
      const perfUrl = `https://graph.facebook.com/v21.0/${page.id}?fields=name,fan_count,talking_about_count,link,category&access_token=${page.access_token}`;
      const perfResp = await fetch(perfUrl);
      const perfData = await perfResp.json();
      
      if (perfData.error) {
        console.log(`      ❌ Performance data failed for ${page.name}:`, perfData.error.message);
      } else {
        console.log(`      ✅ Performance data SUCCESS for ${page.name}`);
        console.log(`        👥 Fans:`, perfData.fan_count || 'N/A');
        console.log(`        💬 Talking About:`, perfData.talking_about_count || 'N/A');
        console.log(`        🔗 Link:`, perfData.link || 'N/A');
        console.log(`        📂 Category:`, perfData.category || 'N/A');
      }
    }
    
  } catch (error) {
    console.log('  ❌ Pages test error:', error.message);
  }
}

async function testInstagramIntegration(token) {
  console.log('\n📷 INSTAGRAM INTEGRATION TESTS:');
  
  try {
    // First get pages to find Instagram-linked ones
    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account,access_token&access_token=${token}`;
    const pagesResp = await fetch(pagesUrl);
    const pagesData = await pagesResp.json();
    
    if (pagesData.error) {
      console.log('  ❌ Failed to get pages for Instagram test:', pagesData.error.message);
      return;
    }
    
    const pages = pagesData.data || [];
    const instagramPages = pages.filter(p => p.instagram_business_account);
    
    if (instagramPages.length === 0) {
      console.log('  ℹ️ No Instagram-linked pages found');
      console.log('  💡 Make sure your Facebook pages are linked to Instagram Business accounts');
      return;
    }
    
    console.log('  ✅ Found', instagramPages.length, 'Instagram-linked pages');
    
    // Test Instagram permissions for each linked page
    for (const page of instagramPages.slice(0, 2)) { // Test first 2
      console.log(`\n    📷 Testing Instagram for page: ${page.name}`);
      const igAccount = page.instagram_business_account;
      
      // Test instagram_basic - Access Instagram business account
      console.log(`      🔍 Testing instagram_basic...`);
      const igBasicUrl = `https://graph.facebook.com/v21.0/${igAccount.id}?fields=id,username,profile_picture_url,website,followers_count&access_token=${page.access_token}`;
      const igBasicResp = await fetch(igBasicUrl);
      const igBasicData = await igBasicResp.json();
      
      if (igBasicData.error) {
        console.log(`      ❌ instagram_basic failed:`, igBasicData.error.message);
      } else {
        console.log(`      ✅ instagram_basic SUCCESS`);
        console.log(`        👤 Username: @${igBasicData.username || 'N/A'}`);
        console.log(`        📸 Followers:`, igBasicData.followers_count || 'N/A');
        console.log(`        🌐 Website:`, igBasicData.website || 'N/A');
        console.log(`        🖼️ Profile:`, igBasicData.profile_picture_url ? 'Available' : 'Not available');
      }
      
      // Test instagram_content_publish - Check if can post
      console.log(`      📝 Testing instagram_content_publish...`);
      const publishUrl = `https://graph.facebook.com/v21.0/${igAccount.id}/media?fields=id,caption,media_type,media_url,timestamp&access_token=${page.access_token}`;
      const publishResp = await fetch(publishUrl);
      const publishData = await publishResp.json();
      
      if (publishData.error) {
        console.log(`      ❌ instagram_content_publish failed:`, publishData.error.message);
      } else {
        console.log(`      ✅ instagram_content_publish SUCCESS`);
        console.log(`        📸 Recent Media:`, publishData.data?.length || 0, 'items');
        if (publishData.data && publishData.data.length > 0) {
          console.log(`        📝 Latest Caption:`, publishData.data[0].caption?.substring(0, 50) + '...' || 'N/A');
        }
      }
      
      // Test instagram_manage_insights - Get Instagram insights
      console.log(`      📈 Testing instagram_manage_insights...`);
      const insightsUrl = `https://graph.facebook.com/v21.0/${igAccount.id}/insights?metric=impressions,reach,likes,comments&access_token=${page.access_token}`;
      const insightsResp = await fetch(insightsUrl);
      const insightsData = await insightsResp.json();
      
      if (insightsData.error) {
        console.log(`      ❌ instagram_manage_insights failed:`, insightsData.error.message);
      } else {
        console.log(`      ✅ instagram_manage_insights SUCCESS`);
        console.log(`        📊 Recent Insights:`, insightsData.data?.length || 0, 'data points');
        if (insightsData.data && insightsData.data.length > 0) {
          console.log(`        👁️ Impressions:`, insightsData.data[0]?.values?.[0]?.value || 'N/A');
          console.log(`        🎯 Reach:`, insightsData.data[1]?.values?.[0]?.value || 'N/A');
          console.log(`        ❤️ Likes:`, insightsData.data[2]?.values?.[0]?.value || 'N/A');
        }
      }
      
      // Test instagram_manage_comments - Get recent comments
      console.log(`      💬 Testing instagram_manage_comments...`);
      const commentsUrl = `https://graph.facebook.com/v21.0/${igAccount.id}/comments?fields=id,text,timestamp,username&access_token=${page.access_token}`;
      const commentsResp = await fetch(commentsUrl);
      const commentsData = await commentsResp.json();
      
      if (commentsData.error) {
        console.log(`      ❌ instagram_manage_comments failed:`, commentsData.error.message);
      } else {
        console.log(`      ✅ instagram_manage_comments SUCCESS`);
        console.log(`        💬 Recent Comments:`, commentsData.data?.length || 0, 'comments');
        if (commentsData.data && commentsData.data.length > 0) {
          console.log(`        💬 Latest Comment:`, commentsData.data[0].text?.substring(0, 50) + '...' || 'N/A');
        }
      }
    }
    
  } catch (error) {
    console.log('  ❌ Instagram test error:', error.message);
  }
}

// Run the test
testFacebookPermissions();
