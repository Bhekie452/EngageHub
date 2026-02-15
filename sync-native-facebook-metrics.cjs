// Sync Native Facebook Metrics to EngageHub
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  'https://bhekie452supabase.vercel.app',
  'eyJhbGciOiJIUzI1NiIsInR5cH6cF3Oy4pKJm3qyJ3qyJ3Qy5Kw'
);

async function syncNativeFacebookMetrics() {
  console.log('🔄 Syncing Native Facebook Metrics to EngageHub...\n');
  
  try {
    // Get your Facebook connections
    const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
    
    const { data: connections, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('connection_status', 'connected')
      .eq('account_type', 'page');
    
    if (error) {
      console.error('❌ Error fetching connections:', error);
      return;
    }
    
    if (!connections || connections.length === 0) {
      console.log('❌ No Facebook page connections found');
      return;
    }
    
    console.log(`📄 Found ${connections.length} Facebook page(s):`);
    
    // Process each Facebook page
    for (const connection of connections) {
      console.log(`\n📱 Processing page: ${connection.account_id}`);
      
      try {
        // Get posts with native engagement metrics
        const postsUrl = `https://graph.facebook.com/v21.0/${connection.account_id}/posts?` +
          `fields=id,message,created_time,like_count,comment_count,share_count,permalink_url,` +
          `reactions.type(LIKE).limit(5).summary(true).as(reactions)&` +
          `insights.metric(post_impressions,post_clicks,post_reactions_total)` +
          `&access_token=${connection.access_token}&limit=10`;
        
        const response = await fetch(postsUrl);
        const data = await response.json();
        
        if (data.error) {
          console.warn(`⚠️ Failed to fetch posts for page ${connection.account_id}:`, data.error.message);
          continue;
        }
        
        if (data.data && data.data.length > 0) {
          console.log(`📝 Found ${data.data.length} posts with native metrics`);
          
          // Process each post and sync to EngageHub
          for (const post of data.data) {
            const nativeMetrics = {
              // Native Facebook metrics
              native_likes: post.like_count || 0,
              native_comments: post.comment_count || 0,
              native_shares: post.share_count || 0,
              native_views: post.insights?.post_impressions?.[0]?.value || 0,
              native_reactions: post.reactions?.summary?.total_count || 0,
              native_clicks: post.insights?.post_clicks?.[0]?.value || 0,
              
              // Post metadata
              post_id: post.id,
              message: post.message,
              created_time: post.created_time,
              permalink_url: post.permalink_url,
              
              // Sync metadata
              workspace_id: workspaceId,
              page_id: connection.account_id,
              sync_time: new Date().toISOString(),
              sync_source: 'facebook_graph_api'
            };
            
            // Store in facebook_posts table (if exists) or create new table
            const { error: upsertError } = await supabase
              .from('facebook_posts')
              .upsert(nativeMetrics, {
                onConflict: 'workspace_id,post_id'
              });
            
            if (upsertError) {
              console.error(`❌ Failed to sync post ${post.id}:`, upsertError);
            } else {
              console.log(`✅ Synced post ${post.id}:`);
              console.log(`   👍 Native likes: ${nativeMetrics.native_likes}`);
              console.log(`   💬 Native comments: ${nativeMetrics.native_comments}`);
              console.log(`   🔄 Native shares: ${nativeMetrics.native_shares}`);
              console.log(`   👁️ Native views: ${nativeMetrics.native_views}`);
              console.log(`   ❤️ Native reactions: ${nativeMetrics.native_reactions}`);
            }
          }
        } else {
          console.log(`❌ No posts found for page ${connection.account_id}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing page ${connection.account_id}:`, error.message);
      }
    }
    
    // Calculate total metrics for dashboard
    console.log('\n📊 Calculating total metrics...');
    
    const { data: totalMetrics, error: totalError } = await supabase
      .from('facebook_posts')
      .select('native_likes, native_comments, native_shares, native_views, native_reactions')
      .eq('workspace_id', workspaceId);
    
    if (!totalError && totalMetrics) {
      const totals = totalMetrics.reduce((acc, post) => ({
        total_likes: acc.total_likes + (post.native_likes || 0),
        total_comments: acc.total_comments + (post.native_comments || 0),
        total_shares: acc.total_shares + (post.native_shares || 0),
        total_views: acc.total_views + (post.native_views || 0),
        total_reactions: acc.total_reactions + (post.native_reactions || 0)
      }), { total_likes: 0, total_comments: 0, total_shares: 0, total_views: 0, total_reactions: 0 });
      
      console.log('\n🎉 TOTAL NATIVE FACEBOOK METRICS:');
      console.log(`👍 Total Likes: ${totals.total_likes}`);
      console.log(`💬 Total Comments: ${totals.total_comments}`);
      console.log(`🔄 Total Shares: ${totals.total_shares}`);
      console.log(`👁️ Total Views: ${totals.total_views}`);
      console.log(`❤️ Total Reactions: ${totals.total_reactions}`);
      
      // Store totals in workspace metrics table
      const { error: metricsError } = await supabase
        .from('workspace_metrics')
        .upsert({
          workspace_id: workspaceId,
          platform: 'facebook',
          total_likes: totals.total_likes,
          total_comments: totals.total_comments,
          total_shares: totals.total_shares,
          total_views: totals.total_views,
          total_reactions: totals.total_reactions,
          last_sync: new Date().toISOString(),
          sync_source: 'native_facebook_api'
        }, {
          onConflict: 'workspace_id,platform'
        });
      
      if (metricsError) {
        console.error('❌ Failed to save workspace metrics:', metricsError);
      } else {
        console.log('✅ Workspace metrics updated successfully!');
      }
    }
    
    console.log('\n✅ Native Facebook metrics sync complete!');
    console.log('💡 Your FacebookEngagement component should now show native metrics!');
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  }
}

// Run the sync
syncNativeFacebookMetrics();
