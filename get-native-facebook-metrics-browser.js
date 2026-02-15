// Get Native Facebook Metrics (Browser Script)
console.log('🔄 Getting Native Facebook Metrics...\n');

// This script will pull your actual Facebook access token and fetch native metrics
async function getNativeFacebookMetrics() {
  try {
    // First, get your Facebook connections from the app
    console.log('📱 Step 1: Getting Facebook connections...');
    
    const connectionsResponse = await fetch('/api/facebook?action=get-connections&workspaceId=c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9');
    const connectionsData = await connectionsResponse.json();
    
    if (connectionsData.error) {
      console.error('❌ Error getting connections:', connectionsData.error);
      return;
    }
    
    if (!connectionsData.connections || connectionsData.connections.length === 0) {
      console.log('❌ No Facebook connections found');
      return;
    }
    
    console.log(`✅ Found ${connectionsData.connections.length} Facebook connection(s)`);
    
    // Process each connection to get native metrics
    for (const connection of connectionsData.connections) {
      if (connection.accountType !== 'page') continue;
      
      console.log(`\n📄 Processing page: ${connection.accountId} (${connection.accountName})`);
      
      try {
        // Use the actual access token from your connection
        const postsUrl = `https://graph.facebook.com/v21.0/${connection.accountId}/posts?` +
          `fields=id,message,created_time,like_count,comment_count,share_count,permalink_url,` +
          `reactions.type(LIKE).limit(5).summary(true).as(reactions)&` +
          `insights.metric(post_impressions,post_clicks,post_reactions_total)` +
          `&access_token=${connection.token}&limit=5`;
        
        console.log('🔗 Fetching posts with native metrics...');
        
        const response = await fetch(postsUrl);
        const data = await response.json();
        
        if (data.error) {
          console.warn(`⚠️ API Error for page ${connection.accountId}:`, data.error.message);
          continue;
        }
        
        if (data.data && data.data.length > 0) {
          console.log(`📝 Found ${data.data.length} posts with native engagement:\n`);
          
          let totalLikes = 0;
          let totalComments = 0;
          let totalShares = 0;
          let totalViews = 0;
          let totalReactions = 0;
          
          data.data.forEach((post, index) => {
            const likes = post.like_count || 0;
            const comments = post.comment_count || 0;
            const shares = post.share_count || 0;
            const views = post.insights?.post_impressions?.[0]?.value || 0;
            const reactions = post.reactions?.summary?.total_count || 0;
            
            totalLikes += likes;
            totalComments += comments;
            totalShares += shares;
            totalViews += views;
            totalReactions += reactions;
            
            console.log(`${index + 1}. "${post.message?.substring(0, 60) || 'No message'}..."`);
            console.log(`   👍 Native Likes: ${likes}`);
            console.log(`   💬 Native Comments: ${comments}`);
            console.log(`   🔄 Native Shares: ${shares}`);
            console.log(`   👁️ Native Views: ${views}`);
            console.log(`   ❤️ Native Reactions: ${reactions}`);
            console.log(`   🔗 ${post.permalink_url || 'No link'}`);
            console.log('');
          });
          
          console.log('🎉 PAGE TOTALS:');
          console.log(`👍 Total Likes: ${totalLikes}`);
          console.log(`💬 Total Comments: ${totalComments}`);
          console.log(`🔄 Total Shares: ${totalShares}`);
          console.log(`👁️ Total Views: ${totalViews}`);
          console.log(`❤️ Total Reactions: ${totalReactions}`);
          
          // Store in localStorage for FacebookEngagement component
          const nativeMetrics = {
            workspaceId: 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9',
            pageId: connection.accountId,
            pageName: connection.accountName,
            totalLikes,
            totalComments,
            totalShares,
            totalViews,
            totalReactions,
            posts: data.data.map(post => ({
              id: post.id,
              message: post.message,
              created_time: post.created_time,
              like_count: post.like_count,
              comment_count: post.comment_count,
              share_count: post.share_count,
              views: post.insights?.post_impressions?.[0]?.value || 0,
              reactions: post.reactions?.summary?.total_count || 0,
              permalink_url: post.permalink_url
            })),
            lastSync: new Date().toISOString()
          };
          
          // Save to localStorage
          localStorage.setItem('facebook_native_metrics', JSON.stringify(nativeMetrics));
          
          console.log('\n✅ Native metrics saved to localStorage!');
          console.log('💡 Your FacebookEngagement component should now show these metrics');
          console.log('🔄 Refresh the Facebook Engagement tab to see updated data');
          
        } else {
          console.log(`❌ No posts found for page ${connection.accountId}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing page ${connection.accountId}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to get native metrics:', error.message);
  }
}

// Auto-run when script loads
getNativeFacebookMetrics();
