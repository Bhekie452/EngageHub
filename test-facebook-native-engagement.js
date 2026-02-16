// Test Facebook Native Engagement Metrics
console.log('📈 Testing Facebook Native Engagement Metrics...\n');

async function testFacebookEngagement() {
  const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
  
  try {
    console.log('🔍 Step 1: Testing Facebook connections...');
    
    // First check if Facebook is connected
    const connectionsResponse = await fetch(`/api/facebook?action=get-connections&workspaceId=${workspaceId}`);
    const connectionsData = await connectionsResponse.json();
    
    if (!connectionsResponse.ok || connectionsData.error) {
      console.log('❌ Facebook connections check failed:', connectionsData.error);
      return;
    }
    
    console.log('✅ Facebook API is accessible');
    console.log(`📊 Found ${connectionsData.connections?.length || 0} Facebook connections`);
    
    if (!connectionsData.connections || connectionsData.connections.length === 0) {
      console.log('⚠️ No Facebook connections found. Please connect Facebook pages first.');
      return;
    }
    
    console.log('\n🔍 Step 2: Testing Native Engagement Metrics...');
    
    // Test the engagement metrics endpoint
    const engagementResponse = await fetch(`/api/facebook?action=get-engagement-metrics&workspaceId=${workspaceId}`);
    const engagementData = await engagementResponse.json();
    
    console.log('📡 Engagement API Response Status:', engagementResponse.status);
    console.log('📡 Engagement API Response:', engagementData);
    
    if (engagementResponse.ok && !engagementData.error) {
      console.log('\n✅ SUCCESS: Facebook Native Engagement is working!');
      
      // Display comprehensive engagement metrics
      displayEngagementMetrics(engagementData);
      
    } else {
      console.log('\n❌ ERROR: Facebook Engagement API failed');
      console.log('Error:', engagementData.error || 'Unknown error');
      console.log('Status:', engagementResponse.status);
      
      // Provide troubleshooting guidance
      if (engagementResponse.status === 400) {
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Check if Facebook pages have posts');
        console.log('2. Verify page access tokens are valid');
        console.log('3. Ensure pages have proper permissions');
        console.log('4. Check Facebook API rate limits');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Possible issues:');
    console.log('1. Network connectivity problems');
    console.log('2. API endpoint not available');
    console.log('3. Server deployment issues');
  }
}

function displayEngagementMetrics(data) {
  console.log('\n📈 FACEBOOK NATIVE ENGAGEMENT METRICS');
  console.log('=====================================\n');
  
  if (!data.metrics) {
    console.log('⚠️ No metrics data available');
    return;
  }
  
  const metrics = data.metrics;
  
  // Overall Summary
  console.log('📊 OVERALL SUMMARY:');
  if (metrics.overall) {
    const overall = metrics.overall;
    console.log(`   Total Posts: ${overall.totalPosts || 0}`);
    console.log(`   Total Likes: ${overall.totalLikes || 0}`);
    console.log(`   Total Comments: ${overall.totalComments || 0}`);
    console.log(`   Total Shares: ${overall.totalShares || 0}`);
    console.log(`   Engagement Rate: ${overall.engagementRate || 0}%`);
    console.log(`   Reach: ${overall.reach || 0}`);
    console.log(`   Impressions: ${overall.impressions || 0}`);
    console.log(`   Last Updated: ${overall.lastUpdated || 'Never'}`);
  } else {
    console.log('   No overall metrics available');
  }
  
  // Per-Page Breakdown
  console.log('\n📄 PER-PAGE BREAKDOWN:');
  if (metrics.pages && metrics.pages.length > 0) {
    metrics.pages.forEach((page, index) => {
      console.log(`\n   ${index + 1}. ${page.pageName || page.pageId}`);
      console.log(`      Posts: ${page.posts || 0}`);
      console.log(`      Likes: ${page.likes || 0}`);
      console.log(`      Comments: ${page.comments || 0}`);
      console.log(`      Shares: ${page.shares || 0}`);
      console.log(`      Engagement Rate: ${page.engagementRate || 0}%`);
      console.log(`      Reach: ${page.reach || 0}`);
      console.log(`      Last Updated: ${page.lastUpdated || 'Never'}`);
    });
  } else {
    console.log('   No page-specific metrics available');
  }
  
  // Recent Posts
  console.log('\n📝 RECENT POSTS (Last 5):');
  if (metrics.recentPosts && metrics.recentPosts.length > 0) {
    metrics.recentPosts.slice(0, 5).forEach((post, index) => {
      const engagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
      console.log(`\n   ${index + 1}. "${post.message ? post.message.substring(0, 50) + '...' : 'No message'}"`);
      console.log(`      Likes: ${post.likes || 0} | Comments: ${post.comments || 0} | Shares: ${post.shares || 0}`);
      console.log(`      Total Engagement: ${engagement}`);
      console.log(`      Posted: ${post.createdTime || 'Unknown'}`);
      console.log(`      Page: ${post.pageName || 'Unknown'}`);
    });
  } else {
    console.log('   No recent posts available');
  }
  
  // Top Performing Posts
  console.log('\n🏆 TOP PERFORMING POSTS:');
  if (metrics.topPosts && metrics.topPosts.length > 0) {
    metrics.topPosts.slice(0, 3).forEach((post, index) => {
      const engagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
      console.log(`\n   ${index + 1}. "${post.message ? post.message.substring(0, 50) + '...' : 'No message'}"`);
      console.log(`      Total Engagement: ${engagement}`);
      console.log(`      Engagement Rate: ${post.engagementRate || 0}%`);
      console.log(`      Posted: ${post.createdTime || 'Unknown'}`);
      console.log(`      Page: ${post.pageName || 'Unknown'}`);
    });
  } else {
    console.log('   No top performing posts available');
  }
  
  // Engagement Trends
  console.log('\n📈 ENGAGEMENT TRENDS:');
  if (metrics.trends) {
    const trends = metrics.trends;
    console.log(`   7-Day Growth: ${trends.weeklyGrowth || 0}%`);
    console.log(`   30-Day Growth: ${trends.monthlyGrowth || 0}%`);
    console.log(`   Best Day: ${trends.bestDay || 'Unknown'}`);
    console.log(`   Best Time: ${trends.bestTime || 'Unknown'}`);
  } else {
    console.log('   No trend data available');
  }
  
  // Summary
  console.log('\n📋 SUMMARY:');
  console.log(`   ✅ Metrics API: Working`);
  console.log(`   📊 Data Points: ${Object.keys(metrics).length}`);
  console.log(`   📄 Pages Tracked: ${metrics.pages?.length || 0}`);
  console.log(`   📝 Posts Analyzed: ${metrics.recentPosts?.length || 0}`);
  console.log(`   🕐 Last Update: ${metrics.overall?.lastUpdated || 'Never'}`);
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Check the Facebook Engagement tab in your dashboard');
  console.log('2. Verify metrics are displaying correctly');
  console.log('3. Test like/comment functionality');
  console.log('4. Monitor for real-time updates');
}

// Run the test
testFacebookEngagement().then(() => {
  console.log('\n✅ Facebook Native Engagement test completed!');
}).catch(error => {
  console.error('❌ Test failed:', error);
});
