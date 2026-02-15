// Verify Facebook API Fix
console.log('🔍 Verifying Facebook API Fix...\n');

async function verifyFacebookAPI() {
  try {
    console.log('📱 Testing /api/facebook?action=get-connections...');
    
    // Test the fixed endpoint
    const response = await fetch('/api/facebook?action=get-connections&workspaceId=c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9');
    const data = await response.json();
    
    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response data:', data);
    
    if (response.ok && !data.error) {
      console.log('✅ SUCCESS: Facebook API is working!');
      console.log(`📄 Found ${data.connections?.length || 0} connections`);
      
      if (data.connections && data.connections.length > 0) {
        console.log('\n📊 Connection Details:');
        data.connections.forEach((conn, index) => {
          console.log(`${index + 1}. ${conn.accountName} (${conn.accountType})`);
          console.log(`   ID: ${conn.accountId}`);
          console.log(`   Token: ${conn.token ? 'Present' : 'Missing'}`);
          console.log(`   Status: ${conn.connectionStatus}`);
        });
      }
      
      // 🎯 NEW: Test Facebook Native Engagement
      console.log('\n📈 Testing Facebook Native Engagement...');
      await testFacebookEngagement();
      
      console.log('\n🎯 Next Steps:');
      console.log('1. Check Facebook Engagement tab for data');
      console.log('2. Test like/comment functionality');
      console.log('3. Verify native metrics are displaying');
      
    } else {
      console.log('❌ ERROR: Facebook API still has issues');
      console.log('Error:', data.error || 'Unknown error');
      
      if (response.status === 400) {
        console.log('\n🔧 Possible fixes:');
        console.log('1. Wait for Vercel deployment to complete');
        console.log('2. Check if workspace ID is correct');
        console.log('3. Verify Facebook connections exist in database');
      }
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// 🎯 NEW: Test Facebook Native Engagement
async function testFacebookEngagement() {
  try {
    console.log('📊 Fetching Facebook Native Engagement Metrics...');
    
    const engagementResponse = await fetch('/api/facebook?action=get-engagement-metrics&workspaceId=c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9');
    const engagementData = await engagementResponse.json();
    
    console.log('🔍 Engagement Response Status:', engagementResponse.status);
    console.log('🔍 Engagement Data:', engagementData);
    
    if (engagementResponse.ok && !engagementData.error) {
      console.log('✅ SUCCESS: Facebook Native Engagement is working!');
      
      // Display engagement metrics
      if (engagementData.metrics) {
        console.log('\n📈 Facebook Native Engagement Metrics:');
        console.log('=====================================');
        
        // Overall metrics
        if (engagementData.metrics.overall) {
          const overall = engagementData.metrics.overall;
          console.log('📊 Overall Metrics:');
          console.log(`   Total Posts: ${overall.totalPosts || 0}`);
          console.log(`   Total Likes: ${overall.totalLikes || 0}`);
          console.log(`   Total Comments: ${overall.totalComments || 0}`);
          console.log(`   Total Shares: ${overall.totalShares || 0}`);
          console.log(`   Engagement Rate: ${overall.engagementRate || 0}%`);
          console.log(`   Reach: ${overall.reach || 0}`);
          console.log(`   Impressions: ${overall.impressions || 0}`);
        }
        
        // Per-page metrics
        if (engagementData.metrics.pages && engagementData.metrics.pages.length > 0) {
          console.log('\n📄 Per-Page Metrics:');
          engagementData.metrics.pages.forEach((page, index) => {
            console.log(`   ${index + 1}. ${page.pageName || page.pageId}`);
            console.log(`      Posts: ${page.posts || 0}`);
            console.log(`      Likes: ${page.likes || 0}`);
            console.log(`      Comments: ${page.comments || 0}`);
            console.log(`      Shares: ${page.shares || 0}`);
            console.log(`      Engagement Rate: ${page.engagementRate || 0}%`);
            console.log(`      Last Updated: ${page.lastUpdated || 'Never'}`);
          });
        }
        
        // Recent posts
        if (engagementData.metrics.recentPosts && engagementData.metrics.recentPosts.length > 0) {
          console.log('\n📝 Recent Posts (Last 5):');
          engagementData.metrics.recentPosts.slice(0, 5).forEach((post, index) => {
            console.log(`   ${index + 1}. "${post.message || 'No message'}"`);
            console.log(`      Likes: ${post.likes || 0} | Comments: ${post.comments || 0} | Shares: ${post.shares || 0}`);
            console.log(`      Posted: ${post.createdTime || 'Unknown'}`);
          });
        }
        
        // Top performing posts
        if (engagementData.metrics.topPosts && engagementData.metrics.topPosts.length > 0) {
          console.log('\n🏆 Top Performing Posts:');
          engagementData.metrics.topPosts.slice(0, 3).forEach((post, index) => {
            console.log(`   ${index + 1}. "${post.message || 'No message'}"`);
            console.log(`      Total Engagement: ${(post.likes || 0) + (post.comments || 0) + (post.shares || 0)}`);
            console.log(`      Posted: ${post.createdTime || 'Unknown'}`);
          });
        }
        
      } else {
        console.log('⚠️ No engagement metrics data available');
        console.log('💡 This might mean:');
        console.log('   - No Facebook pages are connected');
        console.log('   - No posts have been made yet');
        console.log('   - Metrics are still being calculated');
      }
      
    } else {
      console.log('❌ ERROR: Facebook Engagement API failed');
      console.log('Error:', engagementData.error || 'Unknown error');
      
      if (engagementResponse.status === 400) {
        console.log('\n🔧 Possible fixes for engagement:');
        console.log('1. Ensure Facebook pages are connected');
        console.log('2. Check if pages have posts');
        console.log('3. Verify page access tokens are valid');
      }
    }
    
  } catch (error) {
    console.error('❌ Engagement test failed:', error.message);
  }
}

// Run verification
verifyFacebookAPI();
