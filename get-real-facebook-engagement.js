// Get REAL Facebook Engagement from EngageHub Database
console.log('🔍 Getting REAL Facebook Engagement from EngageHub Database...\n');

async function getRealFacebookEngagement() {
  try {
    // Step 1: Get Facebook social accounts
    console.log('📱 Step 1: Getting Facebook social accounts...');
    
    const { data: socialAccounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .eq('workspace_id', 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9');
    
    if (accountsError) {
      console.error('❌ Error fetching social accounts:', accountsError);
      return;
    }
    
    if (!socialAccounts || socialAccounts.length === 0) {
      console.log('❌ No Facebook social accounts found');
      return;
    }
    
    console.log(`✅ Found ${socialAccounts.length} Facebook account(s):`);
    socialAccounts.forEach(account => {
      console.log(`   📄 ${account.account_name} (ID: ${account.platform_account_id})`);
    });
    
    // Step 2: Get posts for Facebook accounts
    console.log('\n📝 Step 2: Getting Facebook posts...');
    
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        post_publications!inner(
          *,
          social_account_id!inner(
            *,
            social_accounts!inner(*)
          )
        ),
        post_analytics!inner(
          *,
          social_account_id!inner(
            *,
            social_accounts!inner(*)
          )
        )
      `)
      .eq('workspace_id', 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9')
      .contains('platforms', ['facebook'])
      .eq('status', 'published');
    
    if (postsError) {
      console.error('❌ Error fetching posts:', postsError);
      return;
    }
    
    if (!posts || posts.length === 0) {
      console.log('❌ No published Facebook posts found');
      return;
    }
    
    console.log(`✅ Found ${posts.length} published Facebook posts`);
    
    // Step 3: Get analytics for these posts
    console.log('\n📊 Step 3: Getting Facebook analytics...');
    
    const facebookPostIds = posts.map(post => post.id);
    
    const { data: analytics, error: analyticsError } = await supabase
      .from('post_analytics')
      .select('*')
      .in('post_id', facebookPostIds)
      .eq('platform', 'facebook');
    
    if (analyticsError) {
      console.error('❌ Error fetching analytics:', analyticsError);
      return;
    }
    
    console.log(`✅ Found ${analytics?.length || 0} analytics records`);
    
    // Step 4: Combine posts with analytics
    console.log('\n🔗 Step 4: Combining posts with analytics...');
    
    const postsWithAnalytics = posts.map(post => {
      const postAnalytics = analytics.find(a => a.post_id === post.id);
      return {
        id: post.id,
        content: post.content,
        created_at: post.published_at || post.created_at,
        platforms: post.platforms,
        status: post.status,
        
        // Analytics data
        likes: postAnalytics?.likes || 0,
        comments: postAnalytics?.comments || 0,
        shares: postAnalytics?.shares || 0,
        impressions: postAnalytics?.impressions || 0,
        reach: postAnalytics?.reach || 0,
        engagement_rate: postAnalytics?.engagement_rate || 0,
        
        // Publication data
        platform_post_id: post.post_publications?.[0]?.platform_post_id,
        platform_url: post.post_publications?.[0]?.platform_url,
        
        // Source info
        source: 'engagehub',
        analytics_synced_at: postAnalytics?.last_synced_at
      };
    });
    
    // Step 5: Get native Facebook data for comparison
    console.log('\n📱 Step 5: Getting native Facebook data...');
    
    const connectionsResponse = await fetch('/api/facebook?action=get-connections&workspaceId=c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9');
    const connectionsData = await connectionsResponse.json();
    
    let nativePosts = [];
    if (connectionsData.connections && connectionsData.connections.length > 0) {
      const connection = connectionsData.connections[0];
      
      const postsUrl = `https://graph.facebook.com/v21.0/${connection.accountId}/posts?` +
        `fields=id,message,created_time,reactions.summary(true),permalink_url,` +
        `comments.summary(true)` +
        `&access_token=${connection.accessToken}&limit=10`;
      
      const response = await fetch(postsUrl);
      const nativeData = await response.json();
      
      if (nativeData.data && !nativeData.error) {
        nativePosts = nativeData.data.map(post => ({
          id: post.id,
          message: post.message,
          created_time: post.created_time,
          native_likes: post.reactions?.summary?.total_count || 0,
          native_comments: post.comments?.summary?.total_count || 0,
          permalink_url: post.permalink_url
        }));
        
        console.log(`✅ Found ${nativePosts.length} native Facebook posts`);
      }
    }
    
    // Step 6: Create combined engagement data
    console.log('\n🔗 Step 6: Creating combined engagement data...');
    
    const combinedPosts = postsWithAnalytics.map(engagehubPost => {
      // Find matching native post by platform_post_id
      const matchingNativePost = nativePosts.find(native => 
        native.id === engagehubPost.platform_post_id
      );
      
      const nativeLikes = matchingNativePost?.native_likes || 0;
      const nativeComments = matchingNativePost?.native_comments || 0;
      const engagehubLikes = engagehubPost.likes;
      const engagehubComments = engagehubPost.comments;
      
      return {
        id: engagehubPost.id,
        message: engagehubPost.content,
        created_time: engagehubPost.created_at,
        like_count: nativeLikes + engagehubLikes,
        comment_count: nativeComments + engagehubComments,
        share_count: engagehubPost.shares,
        views: engagehubPost.impressions,
        reactions: nativeLikes + engagehubLikes,
        permalink_url: engagehubPost.platform_url || matchingNativePost?.permalink_url,
        
        breakdown: {
          native: { likes: nativeLikes, comments: nativeComments },
          engagehub: { likes: engagehubLikes, comments: engagehubComments }
        },
        source: 'combined',
        
        // Additional metadata
        platform_post_id: engagehubPost.platform_post_id,
        engagement_rate: engagehubPost.engagement_rate,
        reach: engagehubPost.reach,
        impressions: engagehubPost.impressions
      };
    });
    
    // Add any native posts that don't have EngageHub data
    nativePosts.forEach(nativePost => {
      const hasEngagehubData = postsWithAnalytics.find(eh => 
        eh.platform_post_id === nativePost.id
      );
      
      if (!hasEngagehubData) {
        combinedPosts.push({
          id: nativePost.id,
          message: nativePost.message,
          created_time: nativePost.created_time,
          like_count: nativePost.native_likes,
          comment_count: nativePost.native_comments,
          share_count: 0,
          views: 0,
          reactions: nativePost.native_likes,
          permalink_url: nativePost.permalink_url,
          
          breakdown: {
            native: { likes: nativePost.native_likes, comments: nativePost.native_comments },
            engagehub: { likes: 0, comments: 0 }
          },
          source: 'native-only',
          platform_post_id: nativePost.id
        });
      }
    });
    
    // Sort by most recent
    combinedPosts.sort((a, b) => new Date(b.created_time) - new Date(a.created_time));
    
    // Calculate totals
    const totals = combinedPosts.reduce((acc, post) => {
      acc.totalLikes += post.like_count;
      acc.totalComments += post.comment_count;
      acc.totalShares += post.share_count;
      acc.totalViews += post.views;
      acc.nativeLikes += post.breakdown.native.likes;
      acc.nativeComments += post.breakdown.native.comments;
      acc.engagehubLikes += post.breakdown.engagehub.likes;
      acc.engagehubComments += post.breakdown.engagehub.comments;
      return acc;
    }, {
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalViews: 0,
      nativeLikes: 0,
      nativeComments: 0,
      engagehubLikes: 0,
      engagehubComments: 0
    });
    
    // Create final combined metrics
    const realCombinedMetrics = {
      workspaceId: 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9',
      pageId: socialAccounts[0].platform_account_id,
      pageName: socialAccounts[0].account_name,
      
      // Totals
      totalLikes: totals.totalLikes,
      totalComments: totals.totalComments,
      totalShares: totals.totalShares,
      totalViews: totals.totalViews,
      totalReactions: totals.totalLikes,
      totalPosts: combinedPosts.length,
      
      // Posts (limited to 5 most recent)
      posts: combinedPosts.slice(0, 5),
      
      // Breakdown
      breakdown: {
        native: { likes: totals.nativeLikes, comments: totals.nativeComments },
        engagehub: { likes: totals.engagehubLikes, comments: totals.engagehubComments },
        combined: { likes: totals.totalLikes, comments: totals.totalComments }
      },
      
      // Metadata
      lastSync: new Date().toISOString(),
      dataSource: 'real-database',
      socialAccountsCount: socialAccounts.length,
      publishedPostsCount: posts.length,
      analyticsRecordsCount: analytics?.length || 0
    };
    
    // Save to localStorage
    localStorage.setItem('facebook_combined_metrics', JSON.stringify(realCombinedMetrics));
    
    // Display results
    console.log('\n🎉 REAL FACEBOOK ENGAGEMENT RESULTS:');
    console.log('='.repeat(60));
    console.log(`📄 Page: ${realCombinedMetrics.pageName}`);
    console.log(`📝 Posts: ${realCombinedMetrics.totalPosts} (showing ${realCombinedMetrics.posts.length})`);
    console.log(`👍 Total Likes: ${realCombinedMetrics.totalLikes} (${realCombinedMetrics.breakdown.native.likes} native + ${realCombinedMetrics.breakdown.engagehub.likes} app)`);
    console.log(`💬 Total Comments: ${realCombinedMetrics.totalComments} (${realCombinedMetrics.breakdown.native.comments} native + ${realCombinedMetrics.breakdown.engagehub.comments} app)`);
    console.log(`🔄 Total Shares: ${realCombinedMetrics.totalShares}`);
    console.log(`👁️ Total Views: ${realCombinedMetrics.totalViews}`);
    console.log('='.repeat(60));
    
    realCombinedMetrics.posts.forEach((post, index) => {
      console.log(`\n${index + 1}. "${post.message.substring(0, 50)}..."`);
      console.log(`   👍 ${post.like_count} likes (${post.breakdown.native.likes}+${post.breakdown.engagehub.likes})`);
      console.log(`   💬 ${post.comment_count} comments (${post.breakdown.native.comments}+${post.breakdown.engagehub.comments})`);
      console.log(`   📅 ${new Date(post.created_time).toLocaleDateString()}`);
      console.log(`   🏷️ ${post.source}`);
      if (post.engagement_rate) {
        console.log(`   📊 Engagement Rate: ${post.engagement_rate}%`);
      }
    });
    
    console.log('\n✅ Real Facebook engagement data saved to localStorage!');
    console.log('💡 This is REAL data from your EngageHub database!');
    console.log('🔄 Refresh the Facebook Engagement page to see real data!');
    
    return realCombinedMetrics;
    
  } catch (error) {
    console.error('❌ Error getting real Facebook engagement:', error);
  }
}

// Check if supabase is available
if (typeof supabase === 'undefined') {
  console.error('❌ Supabase client not available. Make sure you\'re on a page with Supabase loaded.');
} else {
  getRealFacebookEngagement();
}
