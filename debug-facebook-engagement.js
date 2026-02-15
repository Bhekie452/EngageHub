// Debug Facebook Engagement Component
console.log('🔍 Debugging Facebook Engagement Component...\n');

// Check what's in localStorage
const combinedData = localStorage.getItem('facebook_combined_metrics');
console.log('📊 localStorage data:', combinedData);

if (combinedData) {
  try {
    const parsed = JSON.parse(combinedData);
    console.log('✅ Parsed data:', parsed);
    console.log('📝 Posts count:', parsed.posts?.length || 0);
    console.log('👍 Total likes:', parsed.totalLikes);
    console.log('💬 Total comments:', parsed.totalComments);
    console.log('🔗 Breakdown:', parsed.breakdown);
  } catch (error) {
    console.error('❌ Error parsing localStorage data:', error);
  }
} else {
  console.log('❌ No combined data found in localStorage');
  console.log('💡 Creating fresh combined data...');
  
  // Create fresh combined data
  async function createFreshCombinedData() {
    try {
      const connectionsResponse = await fetch('/api/facebook?action=get-connections&workspaceId=c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9');
      const connectionsData = await connectionsResponse.json();
      
      const connection = connectionsData.connections[0];
      
      const postsUrl = `https://graph.facebook.com/v21.0/${connection.accountId}/posts?` +
        `fields=id,message,created_time,reactions.summary(true),permalink_url,` +
        `comments.summary(true)` +
        `&access_token=${connection.accessToken}&limit=5`;
      
      const response = await fetch(postsUrl);
      const nativeData = await response.json();
      
      if (nativeData.data && nativeData.data.length > 0) {
        const freshCombinedMetrics = {
          workspaceId: 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9',
          pageId: connection.accountId,
          pageName: connection.displayName,
          totalLikes: 3,
          totalComments: 4,
          totalShares: 0,
          totalViews: 0,
          totalReactions: 3,
          posts: nativeData.data.slice(0, 5).map((post, index) => ({
            id: post.id,
            message: post.message,
            created_time: post.created_time,
            like_count: (post.reactions?.summary?.total_count || 0) + (index === 0 ? 2 : 1),
            comment_count: (post.comments?.summary?.total_count || 0) + (index === 0 ? 3 : 1),
            share_count: 0,
            views: 0,
            reactions: (post.reactions?.summary?.total_count || 0) + (index === 0 ? 2 : 1),
            permalink_url: post.permalink_url,
            breakdown: {
              native: { likes: post.reactions?.summary?.total_count || 0, comments: post.comments?.summary?.total_count || 0 },
              engagehub: { likes: index === 0 ? 2 : 1, comments: index === 0 ? 3 : 1 }
            },
            source: 'combined'
          })),
          breakdown: {
            native: { likes: 1, comments: 1 },
            engagehub: { likes: 2, comments: 3 },
            combined: { likes: 3, comments: 4 }
          },
          lastSync: new Date().toISOString(),
          isMock: true
        };
        
        localStorage.setItem('facebook_combined_metrics', JSON.stringify(freshCombinedMetrics));
        console.log('✅ Fresh combined data created and saved!');
        console.log('🔄 Refresh the page to see the data');
        
        return freshCombinedMetrics;
      }
    } catch (error) {
      console.error('❌ Failed to create fresh data:', error);
    }
  }
  
  createFreshCombinedData();
}

// Test the component data structure
console.log('\n🧪 Testing component data structure...');
const testData = {
  posts: [
    {
      id: 'test123',
      message: 'Test message',
      created_time: new Date().toISOString(),
      like_count: 3,
      comment_count: 4,
      share_count: 0,
      views: 0,
      reactions: 3,
      permalink_url: 'https://facebook.com/test',
      breakdown: {
        native: { likes: 1, comments: 1 },
        engagehub: { likes: 2, comments: 3 }
      },
      source: 'combined'
    }
  ],
  totalLikes: 3,
  totalComments: 4,
  totalShares: 0,
  totalPosts: 1,
  breakdown: {
    native: { likes: 1, comments: 1 },
    engagehub: { likes: 2, comments: 3 },
    combined: { likes: 3, comments: 4 }
  }
};

console.log('✅ Test data structure:', testData);
console.log('📊 This should work with the FacebookEngagement component');
