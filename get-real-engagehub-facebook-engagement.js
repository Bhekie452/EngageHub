// Get REAL Facebook Engagement from EngageHub's Actual Data Structure
console.log('🔍 Getting REAL Facebook Engagement from EngageHub Data Structure...\n');

async function getRealEngageHubFacebookEngagement() {
  try {
    // Step 1: Get Facebook social accounts
    console.log('📱 Step 1: Getting Facebook social accounts...');
    
    const accountsResponse = await fetch('/api/facebook?action=get-connections&workspaceId=c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9');
    const accountsData = await accountsResponse.json();
    
    if (accountsData.error || !accountsData.connections) {
      console.error('❌ Error fetching Facebook connections:', accountsData.error);
      return;
    }
    
    const facebookConnections = accountsData.connections.filter(conn => conn.accountType === 'page');
    console.log(`✅ Found ${facebookConnections.length} Facebook page connections`);
    
    if (facebookConnections.length === 0) {
      console.log('❌ No Facebook page connections found');
      return;
    }
    
    // Step 2: Get posts from your EngageHub database
    console.log('\n📝 Step 2: Getting posts from EngageHub database...');
    
    // We need to access Supabase directly - let's check if it's available
    if (typeof supabase === 'undefined') {
      console.log('❌ Supabase not available on this page');
      console.log('💡 Let\'s try to get posts via API endpoints...');
      
      // Try to get posts via API
      try {
        const postsResponse = await fetch('/api/facebook?action=get-posts&workspaceId=c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9');
        const postsData = await postsResponse.json();
        
        if (!postsData.error && postsData.data) {
          console.log(`✅ Found ${postsData.data.length} posts via API`);
          return await processEngageHubPosts(postsData.data, facebookConnections[0]);
        } else {
          console.log('ℹ️ No posts API endpoint available or no posts found');
        }
      } catch (error) {
        console.log('ℹ️ No posts API available:', error.message);
      }
      
      console.log('🔄 Falling back to native Facebook posts only...');
      return await getNativeFacebookPostsOnly(facebookConnections[0]);
    }
    
    // If Supabase is available, query the database directly
    console.log('✅ Supabase available - querying database directly...');
    
    // Get posts with Facebook platform
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('workspace_id', 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9')
      .contains('platforms', ['facebook'])
      .eq('status', 'published');
    
    if (postsError) {
      console.error('❌ Error fetching posts:', postsError);
      return;
    }
    
    if (!posts || posts.length === 0) {
      console.log('ℹ️ No published Facebook posts found in EngageHub');
      console.log('🔄 Falling back to native Facebook posts...');
      return await getNativeFacebookPostsOnly(facebookConnections[0]);
    }
    
    console.log(`✅ Found ${posts.length} published Facebook posts in EngageHub`);
    
    return await processEngageHubPosts(posts, facebookConnections[0]);
    
  } catch (error) {
    console.error('❌ Error getting real EngageHub Facebook engagement:', error);
  }
}

// Process EngageHub posts and get their engagement
async function processEngageHubPosts(posts, facebookConnection) {
  console.log('\n🔗 Step 3: Processing EngageHub posts and getting engagement...');
  
  try {
    // Get post IDs
    const postIds = posts.map(post => post.id);
    
    // Step 4: Get analytics_events for these posts (EngageHub engagement)
    console.log('\n📊 Step 4: Getting EngageHub engagement from analytics_events...');
    
    let engagehubEngagement = [];
    
    if (typeof supabase !== 'undefined') {
      const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('workspace_id', 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9')
        .eq('entity_type', 'post')
        .in('entity_id', postIds)
        .in('event_type', ['post_like', 'post_comment', 'post_share', 'post_view']);
      
      if (!eventsError && events) {
        console.log(`✅ Found ${events.length} engagement events`);
        
        // Aggregate engagement by post
        const engagementByPost = {};
        events.forEach(event => {
          if (!engagementByPost[event.entity_id]) {
            engagementByPost[event.entity_id] = {
              likes: 0,
              comments: 0,
              shares: 0,
              views: 0
            };
          }
          
          if (event.event_type === 'post_like') engagementByPost[event.entity_id].likes++;
          else if (event.event_type === 'post_comment') engagementByPost[event.entity_id].comments++;
          else if (event.event_type === 'post_share') engagementByPost[event.entity_id].shares++;
          else if (event.event_type === 'post_view') engagementByPost[event.entity_id].views++;
        });
        
        engagehubEngagement = engagementByPost;
      }
    }
    
    // Step 5: Get post_publications for platform post IDs
    console.log('\n📱 Step 5: Getting publication data...');
    
    let publications = [];
    if (typeof supabase !== 'undefined') {
      const { data: pubData, error: pubError } = await supabase
        .from('post_publications')
        .select('*')
        .in('post_id', postIds)
        .eq('platform', 'facebook');
      
      if (!pubError && pubData) {
        publications = pubData;
        console.log(`✅ Found ${publications.length} publication records`);
      }
    }
    
    // Step 6: Get native Facebook posts
    console.log('\n📱 Step 6: Getting native Facebook posts...');
    
    const postsUrl = `https://graph.facebook.com/v21.0/${facebookConnection.accountId}/posts?` +
      `fields=id,message,created_time,reactions.summary(true),permalink_url,` +
      `comments.summary(true)` +
      `&access_token=${facebookConnection.accessToken}&limit=10`;
    
    const response = await fetch(postsUrl);
    const nativeData = await response.json();
    
    if (nativeData.error) {
      console.error('❌ Facebook API error:', nativeData.error.message);
      return;
    }
    
    const nativePosts = nativeData.data || [];
    console.log(`✅ Found ${nativePosts.length} native Facebook posts`);
    
    // Step 7: Create combined engagement data
    console.log('\n🔗 Step 7: Creating combined engagement data...');
    
    const combinedPosts = [];
    
    // Process EngageHub posts
    posts.forEach(post => {
      const publication = publications.find(p => p.post_id === post.id);
      const platformPostId = publication?.platform_post_id;
      const engagehubEngage = engagehubEngagement[post.id] || { likes: 0, comments: 0, shares: 0, views: 0 };
      
      // Find matching native post
      const matchingNativePost = nativePosts.find(native => 
        native.id === platformPostId
      );
      
      const nativeLikes = matchingNativePost?.reactions?.summary?.total_count || 0;
      const nativeComments = matchingNativePost?.comments?.summary?.total_count || 0;
      
      combinedPosts.push({
        id: post.id,
        message: post.content,
        created_time: post.published_at || post.created_at,
        like_count: nativeLikes + engagehubEngage.likes,
        comment_count: nativeComments + engagehubEngage.comments,
        share_count: engagehubEngage.shares,
        views: engagehubEngage.views,
        reactions: nativeLikes + engagehubEngage.likes,
        permalink_url: publication?.platform_url || matchingNativePost?.permalink_url,
        
        breakdown: {
          native: { likes: nativeLikes, comments: nativeComments },
          engagehub: { likes: engagehubEngage.likes, comments: engagehubEngage.comments }
        },
        source: platformPostId ? 'combined' : 'engagehub-only',
        
        // Additional metadata
        platform_post_id: platformPostId,
        post_status: post.status,
        platforms: post.platforms
      });
    });
    
    // Add native posts that don't have EngageHub data
    nativePosts.forEach(nativePost => {
      const hasEngagehubData = publications.find(pub => pub.platform_post_id === nativePost.id);
      
      if (!hasEngagehubData) {
        combinedPosts.push({
          id: nativePost.id,
          message: nativePost.message,
          created_time: nativePost.created_time,
          like_count: nativePost.reactions?.summary?.total_count || 0,
          comment_count: nativePost.comments?.summary?.total_count || 0,
          share_count: 0,
          views: 0,
          reactions: nativePost.reactions?.summary?.total_count || 0,
          permalink_url: nativePost.permalink_url,
          
          breakdown: {
            native: { 
              likes: nativePost.reactions?.summary?.total_count || 0, 
              comments: nativePost.comments?.summary?.total_count || 0 
            },
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
    const realMetrics = {
      workspaceId: 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9',
      pageId: facebookConnection.accountId,
      pageName: facebookConnection.displayName,
      
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
      dataSource: 'engagehub-database',
      engagehubPostsCount: posts.length,
      nativePostsCount: nativePosts.length,
      engagementEventsCount: Object.keys(engagehubEngagement).length,
      publicationsCount: publications.length
    };
    
    // Save to localStorage
    localStorage.setItem('facebook_combined_metrics', JSON.stringify(realMetrics));
    
    // Display results
    console.log('\n🎉 REAL ENGAGEHUB FACEBOOK ENGAGEMENT RESULTS:');
    console.log('='.repeat(70));
    console.log(`📄 Page: ${realMetrics.pageName}`);
    console.log(`📝 Posts: ${realMetrics.totalPosts} (showing ${realMetrics.posts.length})`);
    console.log(`👍 Total Likes: ${realMetrics.totalLikes} (${realMetrics.breakdown.native.likes} native + ${realMetrics.breakdown.engagehub.likes} app)`);
    console.log(`💬 Total Comments: ${realMetrics.totalComments} (${realMetrics.breakdown.native.comments} native + ${realMetrics.breakdown.engagehub.comments} app)`);
    console.log(`🔄 Total Shares: ${realMetrics.totalShares}`);
    console.log(`👁️ Total Views: ${realMetrics.totalViews}`);
    console.log(`📊 Data Sources: ${realMetrics.engagehubPostsCount} EngageHub posts, ${realMetrics.nativePostsCount} native posts`);
    console.log('='.repeat(70));
    
    realMetrics.posts.forEach((post, index) => {
      console.log(`\n${index + 1}. "${post.message.substring(0, 50)}..."`);
      console.log(`   👍 ${post.like_count} likes (${post.breakdown.native.likes}+${post.breakdown.engagehub.likes})`);
      console.log(`   💬 ${post.comment_count} comments (${post.breakdown.native.comments}+${post.breakdown.engagehub.comments})`);
      console.log(`   🔄 ${post.share_count} shares`);
      console.log(`   👁️ ${post.views} views`);
      console.log(`   📅 ${new Date(post.created_time).toLocaleDateString()}`);
      console.log(`   🏷️ ${post.source}`);
      if (post.platform_post_id) {
        console.log(`   🔗 Platform Post ID: ${post.platform_post_id}`);
      }
    });
    
    console.log('\n✅ Real EngageHub Facebook engagement data saved to localStorage!');
    console.log('💡 This combines:');
    console.log(`   • ${realMetrics.engagehubPostsCount} posts from your EngageHub database`);
    console.log(`   • ${realMetrics.engagementEventsCount} engagement events from analytics_events`);
    console.log(`   • ${realMetrics.nativePostsCount} native Facebook posts`);
    console.log('🔄 Refresh the Facebook Engagement page to see real data!');
    
    return realMetrics;
    
  } catch (error) {
    console.error('❌ Error processing EngageHub posts:', error);
  }
}

// Fallback function for native posts only
async function getNativeFacebookPostsOnly(facebookConnection) {
  console.log('🔄 Getting native Facebook posts only...');
  
  try {
    const postsUrl = `https://graph.facebook.com/v21.0/${facebookConnection.accountId}/posts?` +
      `fields=id,message,created_time,reactions.summary(true),permalink_url,` +
      `comments.summary(true)` +
      `&access_token=${facebookConnection.accessToken}&limit=5`;
    
    const response = await fetch(postsUrl);
    const nativeData = await response.json();
    
    if (nativeData.error) {
      console.error('❌ Facebook API error:', nativeData.error.message);
      return;
    }
    
    if (!nativeData.data || nativeData.data.length === 0) {
      console.log('❌ No native Facebook posts found');
      return;
    }
    
    const posts = nativeData.data.map(post => ({
      id: post.id,
      message: post.message,
      created_time: post.created_time,
      like_count: post.reactions?.summary?.total_count || 0,
      comment_count: post.comments?.summary?.total_count || 0,
      share_count: 0,
      views: 0,
      reactions: post.reactions?.summary?.total_count || 0,
      permalink_url: post.permalink_url,
      
      breakdown: {
        native: { 
          likes: post.reactions?.summary?.total_count || 0, 
          comments: post.comments?.summary?.total_count || 0 
        },
        engagehub: { likes: 0, comments: 0 }
      },
      source: 'native-only'
    }));
    
    const totals = posts.reduce((acc, post) => {
      acc.totalLikes += post.like_count;
      acc.totalComments += post.comment_count;
      acc.nativeLikes += post.breakdown.native.likes;
      acc.nativeComments += post.breakdown.native.comments;
      return acc;
    }, {
      totalLikes: 0,
      totalComments: 0,
      nativeLikes: 0,
      nativeComments: 0
    });
    
    const nativeMetrics = {
      workspaceId: 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9',
      pageId: facebookConnection.accountId,
      pageName: facebookConnection.displayName,
      totalLikes: totals.totalLikes,
      totalComments: totals.totalComments,
      totalShares: 0,
      totalViews: 0,
      totalReactions: totals.totalLikes,
      totalPosts: posts.length,
      posts: posts,
      breakdown: {
        native: { likes: totals.nativeLikes, comments: totals.nativeComments },
        engagehub: { likes: 0, comments: 0 },
        combined: { likes: totals.totalLikes, comments: totals.totalComments }
      },
      lastSync: new Date().toISOString(),
      dataSource: 'native-facebook-only'
    };
    
    localStorage.setItem('facebook_combined_metrics', JSON.stringify(nativeMetrics));
    
    console.log('\n🎉 NATIVE FACEBOOK ENGAGEMENT RESULTS:');
    console.log('='.repeat(60));
    console.log(`📄 Page: ${nativeMetrics.pageName}`);
    console.log(`📝 Posts: ${nativeMetrics.totalPosts}`);
    console.log(`👍 Total Likes: ${nativeMetrics.totalLikes} (native only)`);
    console.log(`💬 Total Comments: ${nativeMetrics.totalComments} (native only)`);
    console.log('='.repeat(60));
    
    posts.forEach((post, index) => {
      console.log(`\n${index + 1}. "${post.message.substring(0, 50)}..."`);
      console.log(`   👍 ${post.like_count} likes`);
      console.log(`   💬 ${post.comment_count} comments`);
      console.log(`   📅 ${new Date(post.created_time).toLocaleDateString()}`);
      console.log(`   🏷️ ${post.source}`);
    });
    
    console.log('\n✅ Native Facebook data saved to localStorage!');
    console.log('💡 This is real native Facebook engagement data!');
    
    return nativeMetrics;
    
  } catch (error) {
    console.error('❌ Error getting native Facebook posts:', error);
  }
}

// Run the function
getRealEngageHubFacebookEngagement();
