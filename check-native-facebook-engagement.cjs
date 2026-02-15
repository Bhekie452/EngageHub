// Check Native Facebook Engagement (likes, shares, comments, views)
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  'https://bhekie452supabase.vercel.app', // From your logs
  'eyJhbGciOiJIUzI1NiIsInR5cH6cF3Oy4pKJm3qyJ3qyJ3Qy5Kw' // From your logs
);

async function checkNativeFacebookEngagement() {
  console.log('🔍 Checking Native Facebook Engagement (Likes, Shares, Comments, Views)...\n');
  
  try {
    // Get ALL Facebook connections to find the right workspace
    const { data: allConnections, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching connections:', error);
      return;
    }
    
    console.log(`📄 Found ${allConnections.length} Facebook connection(s):`);
    
    if (allConnections.length === 0) {
      console.log('❌ No Facebook connections found in entire database!');
      return;
    }
    
    // Find YOUR connections (any workspace)
    const yourConnections = allConnections.filter(conn => 
      conn.account_id === '991921717332604' || // Your "Engagehub Testing Page"
      conn.account_id === '17841480561146301' || // Your Instagram-connected page
      conn.account_id === '25221055104240706' // Your profile
    );
    
    console.log(`\n✅ Found ${yourConnections.length} of YOUR Facebook connections:`);
    
    // Check each of your connections
    for (const conn of yourConnections) {
      console.log(`\n📄 Connection: ${conn.account_id} (${conn.account_type})`);
      console.log(`   Workspace: ${conn.workspace_id}`);
      console.log(`   Status: ${conn.connection_status}`);
      console.log(`   Token: ${conn.access_token ? 'Present' : 'Missing'}`);
      console.log(`   Instagram: ${conn.platform_data?.instagram_business_account_id ? 'YES' : 'NO'}`);
      
      if (conn.account_type === 'page' && conn.access_token) {
        console.log(`\n� Checking native engagement for page: ${conn.account_id}...`);
        
        try {
          // Get posts with ALL engagement fields
          const postsUrl = `https://graph.facebook.com/v21.0/${conn.account_id}/posts?` +
            `fields=id,message,created_time,like_count,comment_count,share_count,permalink_url,` + // Added comma for more fields
            `reactions.type(LIKE).limit(5).summary(true).as(reactions)&` + // Get reactions (likes)
            `comments.filter(streaming_live=true).limit(10)&` + // Get live comments
            `insights.metric(post_impressions,post_clicks,post_reactions_total)` + // Get views/impressions
            `&access_token=${conn.access_token}&limit=5`;
          
          const response = await fetch(postsUrl);
          const data = await response.json();
          
          if (data.error) {
            console.warn(`⚠️ Failed to fetch posts for page ${conn.account_id}:`, data.error.message);
            continue;
          }
          
          if (data.data && data.data.length > 0) {
            console.log(`📝 Recent Posts with Native Engagement:`);
            
            data.data.forEach((post, index) => {
              const postDate = new Date(post.created_time).toLocaleDateString();
              const likes = post.like_count || 0;
              const comments = post.comment_count || 0;
              const shares = post.share_count || 0;
              const views = post.insights?.post_impressions?.[0]?.value || 0;
              const reactions = post.reactions?.summary?.total_count || 0;
              
              console.log(`\n  ${index + 1}. "${post.message.substring(0, 60)}..."`);
              console.log(`     📅 Date: ${postDate}`);
              console.log(`     👍 Native Likes: ${likes}`);
              console.log(`     💬 Native Comments: ${comments}`);
              console.log(`     🔄 Native Shares: ${shares}`);
              console.log(`     👁️ Native Views: ${views}`);
              console.log(`     ❤️ Reactions: ${reactions}`);
              console.log(`     🔗 Post: ${post.permalink_url || 'No link'}`);
              console.log(`     🆔 Post ID: ${post.id}`);
            });
          } else {
            console.log(`❌ No posts found for page ${conn.account_id}`);
          }
        } catch (error) {
          console.error(`❌ Error fetching posts for page ${conn.account_id}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ Native Facebook engagement check complete!');
    console.log('💡 This shows the ACTUAL Facebook data including:');
    console.log('   - Native likes (from reactions.summary.total_count)');
    console.log('   - Native comments (from comments filter)');
    console.log('   - Native shares (from share_count field)');
    console.log('   - Native views (from insights.metric)');
    console.log('   - Post reactions (detailed breakdown)');
    console.log('\n🎯 Compare this with what our FacebookEngagement component shows!');
    
  } catch (error) {
    console.error('❌ Engagement check failed:', error.message);
  }
}

// Run the check
checkNativeFacebookEngagement();
