// Pull Native Facebook Metrics (Browser Script)
console.log('🔄 Pulling Native Facebook Metrics...\n');

// Your Facebook page access token (from your connections)
const FACEBOOK_PAGE_TOKEN = 'EAAd7mnK3tIsBQl5DELLTYeKG8VAtIHZBeAZCcBZADHH0YpnLW...'; // From your database
const PAGE_ID = '991921717332604'; // Your "Engagehub Testing Page"

console.log('📱 Fetching from page:', PAGE_ID);

async function pullNativeMetrics() {
  try {
    // Get posts with native engagement metrics
    const postsUrl = `https://graph.facebook.com/v21.0/${PAGE_ID}/posts?` +
      `fields=id,message,created_time,like_count,comment_count,share_count,permalink_url,` +
      `reactions.type(LIKE).limit(5).summary(true).as(reactions)&` +
      `insights.metric(post_impressions,post_clicks,post_reactions_total)` +
      `&access_token=${FACEBOOK_PAGE_TOKEN}&limit=5`;
    
    console.log('🔗 Fetching:', postsUrl.substring(0, 100) + '...');
    
    const response = await fetch(postsUrl);
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Facebook API Error:', data.error);
      return;
    }
    
    if (data.data && data.data.length > 0) {
      console.log(`📝 Found ${data.data.length} posts with native metrics:\n`);
      
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
        
        console.log(`${index + 1}. Post ID: ${post.id}`);
        console.log(`   📝 Message: "${post.message?.substring(0, 50) || 'No message'}..."`);
        console.log(`   📅 Date: ${new Date(post.created_time).toLocaleDateString()}`);
        console.log(`   👍 Native Likes: ${likes}`);
        console.log(`   💬 Native Comments: ${comments}`);
        console.log(`   🔄 Native Shares: ${shares}`);
        console.log(`   👁️ Native Views: ${views}`);
        console.log(`   ❤️ Native Reactions: ${reactions}`);
        console.log(`   🔗 Link: ${post.permalink_url || 'No link'}`);
        console.log('');
      });
      
      console.log('🎉 TOTAL NATIVE FACEBOOK METRICS:');
      console.log(`👍 Total Likes: ${totalLikes}`);
      console.log(`💬 Total Comments: ${totalComments}`);
      console.log(`🔄 Total Shares: ${totalShares}`);
      console.log(`👁️ Total Views: ${totalViews}`);
      console.log(`❤️ Total Reactions: ${totalReactions}`);
      
      console.log('\n💡 To add to EngageHub:');
      console.log('1. These are your NATIVE Facebook metrics');
      console.log('2. Your FacebookEngagement component should show these same numbers');
      console.log('3. If numbers don\'t match, check workspace ID fix');
      console.log('4. Use localStorage fix to ensure correct workspace');
      
      // Create localStorage update script
      console.log('\n🔧 To update FacebookEngagement with these metrics:');
      console.log('// Run this in browser console:');
      console.log(`localStorage.setItem('facebook_native_metrics', JSON.stringify({`);
      console.log(`  totalLikes: ${totalLikes},`);
      console.log(`  totalComments: ${totalComments},`);
      console.log(`  totalShares: ${totalShares},`);
      console.log(`  totalViews: ${totalViews},`);
      console.log(`  totalReactions: ${totalReactions},`);
      console.log(`  lastSync: '${new Date().toISOString()}'`);
      console.log(`}));`);
      console.log('location.reload();');
      
    } else {
      console.log('❌ No posts found for this page');
    }
    
  } catch (error) {
    console.error('❌ Error pulling metrics:', error.message);
  }
}

// Run the function
pullNativeMetrics();
