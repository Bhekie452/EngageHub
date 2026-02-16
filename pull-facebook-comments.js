// Pull Facebook Comments for Posts
console.log('💬 Pulling Facebook Comments...\n');

async function pullFacebookComments() {
  try {
    const connectionsResponse = await fetch('/api/facebook?action=get-connections&workspaceId=c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9');
    const connectionsData = await connectionsResponse.json();
    
    for (const connection of connectionsData.connections) {
      if (connection.accountType !== 'page') continue;
      
      console.log(`\n📄 Processing page: ${connection.displayName}`);
      
      try {
        // First get posts
        const postsUrl = `https://graph.facebook.com/v21.0/${connection.accountId}/posts?` +
          `fields=id,message,created_time,reactions.summary(true),permalink_url` +
          `&access_token=${connection.accessToken}&limit=5`;
        
        console.log('🔗 Step 1: Getting posts...');
        const postsResponse = await fetch(postsUrl);
        const postsData = await postsResponse.json();
        
        if (postsData.error) {
          console.warn(`⚠️ Posts API Error:`, postsData.error.message);
          continue;
        }
        
        if (!postsData.data || postsData.data.length === 0) {
          console.log('❌ No posts found');
          continue;
        }
        
        console.log(`📝 Found ${postsData.data.length} posts, fetching comments...\n`);
        
        let totalComments = 0;
        const postsWithComments = [];
        
        // For each post, get its comments
        for (const post of postsData.data) {
          console.log(`🔍 Getting comments for: "${post.message?.substring(0, 40) || 'No message'}..."`);
          
          try {
            // Get comments for this specific post
            const commentsUrl = `https://graph.facebook.com/v21.0/${post.id}/comments?` +
              `fields=id,message,created_time,from{name,id},like_count` +
              `&access_token=${connection.accessToken}&limit=25`;
            
            const commentsResponse = await fetch(commentsUrl);
            const commentsData = await commentsResponse.json();
            
            if (commentsData.error) {
              console.warn(`⚠️ Comments Error for post ${post.id}:`, commentsData.error.message);
              // Continue with 0 comments
            }
            
            const comments = commentsData.data || [];
            const commentCount = comments.length;
            totalComments += commentCount;
            
            console.log(`   💬 Found ${commentCount} comments`);
            
            // Show comment details
            comments.forEach((comment, index) => {
              console.log(`      ${index + 1}. "${comment.message?.substring(0, 50) || 'No text'}..."`);
              console.log(`         👤 ${comment.from?.name || 'Anonymous'} (${comment.like_count || 0} likes)`);
              console.log(`         📅 ${new Date(comment.created_time).toLocaleDateString()}`);
            });
            
            // Store post with comments
            postsWithComments.push({
              id: post.id,
              message: post.message,
              created_time: post.created_time,
              like_count: post.reactions?.summary?.total_count || 0,
              comment_count: commentCount,
              comments: comments,
              permalink_url: post.permalink_url
            });
            
          } catch (error) {
            console.error(`❌ Error fetching comments for post ${post.id}:`, error.message);
          }
        }
        
        console.log('\n🎉 FINAL RESULTS:');
        console.log(`📝 Total Posts: ${postsWithComments.length}`);
        console.log(`💬 Total Comments: ${totalComments}`);
        
        // Store complete metrics with comments
        const completeMetrics = {
          workspaceId: 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9',
          pageId: connection.accountId,
          pageName: connection.displayName,
          totalLikes: postsWithComments.reduce((sum, post) => sum + post.like_count, 0),
          totalComments: totalComments,
          totalShares: 0, // Still need separate API call for shares
          totalViews: 0,  // Still need insights for views
          totalReactions: postsWithComments.reduce((sum, post) => sum + post.like_count, 0),
          posts: postsWithComments,
          lastSync: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('facebook_complete_metrics', JSON.stringify(completeMetrics));
        
        console.log('\n✅ Complete metrics (with comments) saved to localStorage!');
        console.log('💡 FacebookEngagement component should now show comments too!');
        console.log('🔄 Refresh Facebook Engagement tab to see updated data');
        
        // Update window object
        window.facebookCompleteMetrics = completeMetrics;
        
      } catch (error) {
        console.error(`❌ Error processing page ${connection.accountId}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to pull comments:', error.message);
  }
}

// Run the function
pullFacebookComments();
