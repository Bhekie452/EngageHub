// Check Facebook Data in Database
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Checking Facebook Data in Database...\n');

async function checkFacebookConnections() {
  try {
    console.log('📊 Fetching Facebook connections from database...');
    
    const { data, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9')
      .eq('platform', 'facebook')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching Facebook connections:', error);
      return;
    }

    console.log(`✅ Found ${data?.length || 0} Facebook connections\n`);

    if (!data || data.length === 0) {
      console.log('⚠️ No Facebook connections found in database');
      console.log('💡 This might mean:');
      console.log('   - OAuth flow was not completed');
      console.log('   - Connection failed during save');
      console.log('   - Wrong workspace ID');
      return;
    }

    // Display connection details
    data.forEach((connection, index) => {
      console.log(`\n📄 Connection ${index + 1}:`);
      console.log(`   ID: ${connection.id}`);
      console.log(`   Platform: ${connection.platform}`);
      console.log(`   Account Type: ${connection.account_type}`);
      console.log(`   Account ID: ${connection.account_id}`);
      console.log(`   Display Name: ${connection.display_name}`);
      console.log(`   Status: ${connection.connection_status}`);
      console.log(`   Token Present: ${connection.access_token ? 'Yes' : 'No'}`);
      console.log(`   Created: ${connection.created_at}`);
      console.log(`   Last Sync: ${connection.last_sync_at}`);
      
      // Check platform_data
      if (connection.platform_data) {
        const platformData = typeof connection.platform_data === 'string' 
          ? JSON.parse(connection.platform_data) 
          : connection.platform_data;
          
        console.log(`   Platform Data Keys: ${Object.keys(platformData).join(', ')}`);
        
        // Check for pages
        if (platformData.pages && Array.isArray(platformData.pages)) {
          console.log(`   Pages Found: ${platformData.pages.length}`);
          platformData.pages.forEach((page, pageIndex) => {
            console.log(`     Page ${pageIndex + 1}: ${page.pageName || page.name}`);
            console.log(`       Page ID: ${page.pageId || page.id}`);
            console.log(`       Token Present: ${page.pageAccessToken || page.access_token ? 'Yes' : 'No'}`);
            console.log(`       Instagram Linked: ${page.instagramBusinessAccountId ? 'Yes' : 'No'}`);
          });
        } else {
          console.log('   ⚠️ No pages found in platform_data');
        }
        
        // Check for Instagram connections
        if (platformData.longTermUserToken) {
          console.log(`   Long-term Token: Present (${platformData.longTermUserToken.substring(0, 20)}...)`);
        } else {
          console.log('   ⚠️ No long-term token found');
        }
        
        // Check user token expiry
        if (connection.token_expires_at) {
          const expiry = new Date(connection.token_expires_at);
          const now = new Date();
          const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
          console.log(`   Token Expires: ${connection.token_expires_at}`);
          console.log(`   Days Until Expiry: ${daysUntilExpiry}`);
          
          if (daysUntilExpiry <= 7) {
            console.log('   ⚠️ WARNING: Token expires soon!');
          }
        } else {
          console.log('   ⚠️ No token expiry information');
        }
      } else {
        console.log('   ⚠️ No platform_data available');
      }
      
      console.log('   ----------------------------------------');
    });

    console.log('\n📈 Database Summary:');
    console.log(`   Total Connections: ${data.length}`);
    console.log(`   Connected Profiles: ${data.filter(c => c.account_type === 'profile').length}`);
    console.log(`   Connected Pages: ${data.filter(c => c.account_type === 'page').length}`);
    console.log(`   Connected Instagram: ${data.filter(c => c.account_type === 'instagram').length}`);

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

async function checkRecentActivity() {
  try {
    console.log('\n🕐 Checking Recent Facebook Activity...');
    
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('workspace_id', 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9')
      .eq('platform', 'facebook')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching activity:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('   📭 No recent Facebook activity found');
      return;
    }

    console.log(`\n📋 Recent Activity (Last ${data.length} events):`);
    data.forEach((activity, index) => {
      console.log(`   ${index + 1}. ${activity.created_at} - ${activity.event_type}`);
      console.log(`      Details: ${activity.details || 'No details'}`);
      console.log(`      Status: ${activity.status || 'Completed'}`);
    });

  } catch (error) {
    console.error('❌ Activity check failed:', error.message);
  }
}

async function checkEngagementMetrics() {
  try {
    console.log('\n📊 Checking Engagement Metrics...');
    
    // Check if there are any Facebook posts stored
    const { data, error } = await supabase
      .from('facebook_posts')
      .select('*')
      .eq('workspace_id', 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error checking posts:', error);
      return;
    }

    console.log(`\n📝 Facebook Posts Found: ${data?.length || 0}`);
    
    if (data && data.length > 0) {
      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;
      
      data.forEach((post, index) => {
        totalLikes += post.likes || 0;
        totalComments += post.comments || 0;
        totalShares += post.shares || 0;
        
        console.log(`\n   Post ${index + 1}:`);
        console.log(`      ID: ${post.id}`);
        console.log(`      Message: ${post.message ? post.message.substring(0, 50) + '...' : 'No message'}`);
        console.log(`      Likes: ${post.likes || 0}`);
        console.log(`      Comments: ${post.comments || 0}`);
        console.log(`      Shares: ${post.shares || 0}`);
        console.log(`      Created: ${post.created_at}`);
        console.log(`      Engagement: ${(post.likes || 0) + (post.comments || 0) + (post.shares || 0)}`);
      });
      
      console.log('\n📈 Engagement Summary:');
      console.log(`   Total Posts: ${data.length}`);
      console.log(`   Total Likes: ${totalLikes}`);
      console.log(`   Total Comments: ${totalComments}`);
      console.log(`   Total Shares: ${totalShares}`);
      console.log(`   Avg Engagement: ${Math.round((totalLikes + totalComments + totalShares) / data.length)}`);
    } else {
      console.log('   📭 No Facebook posts found in database');
      console.log('   💡 Posts might be stored in social_accounts platform_data');
    }

  } catch (error) {
    console.error('❌ Engagement check failed:', error.message);
  }
}

// Run all checks
async function runAllChecks() {
  console.log('🚀 Starting Facebook Database Verification...\n');
  
  await checkFacebookConnections();
  await checkRecentActivity();
  await checkEngagementMetrics();
  
  console.log('\n✅ Facebook Database Check Complete!');
  console.log('\n🎯 If data is missing:');
  console.log('1. Check if OAuth flow completed successfully');
  console.log('2. Verify workspace ID is correct');
  console.log('3. Check if pages were saved to platform_data');
  console.log('4. Verify tokens are stored correctly');
  console.log('5. Check if engagement metrics are being calculated');
}

// Execute checks
runAllChecks().catch(error => {
  console.error('❌ Database verification failed:', error);
});
