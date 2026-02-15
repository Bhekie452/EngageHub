// Check Latest Facebook Post Engagement
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

async function checkFacebookEngagement() {
  console.log('🔍 Checking Latest Facebook Engagement...\n');
  
  try {
    // Get current workspace ID
    const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9'; // Your workspace ID from logs
    
    if (!workspaceId) {
      console.error('❌ No workspace ID found');
      return;
    }
    
    console.log(`📱 Workspace ID: ${workspaceId}`);
    
    // Get connected Facebook pages
    const { data: pages, error: pagesError } = await supabase
      .from('social_accounts')
      .select('account_id, access_token, platform_data')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('account_type', 'page')
      .eq('connection_status', 'connected');
    
    if (pagesError) {
      console.error('❌ Error fetching Facebook pages:', pagesError);
      return;
    }
    
    if (!pages || pages.length === 0) {
      console.log('❌ No connected Facebook pages found');
      return;
    }
    
    console.log(`📄 Found ${pages.length} connected Facebook page(s):`);
    
    // Check each page for recent posts
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      console.log(`\n📄 Page ${i + 1}: ${page.account_id}`);
      
      try {
        // Get recent posts from this page
        const postsUrl = `https://graph.facebook.com/v21.0/${page.account_id}/posts?` +
          `fields=id,message,created_time,like_count,comment_count,share_count,permalink_url` +
          `&limit=5&access_token=${page.access_token}`;
        
        const response = await fetch(postsUrl);
        const data = await response.json();
        
        if (data.error) {
          console.warn(`⚠️ Failed to fetch posts for page ${page.account_id}:`, data.error.message);
          continue;
        }
        
        if (data.data && data.data.length > 0) {
          console.log(`📝 Recent Posts for Page ${page.account_id}:`);
          
          data.data.forEach((post, index) => {
            const postDate = new Date(post.created_time).toLocaleDateString();
            const likes = post.like_count || 0;
            const comments = post.comment_count || 0;
            const shares = post.share_count || 0;
            
            console.log(`  ${index + 1}. "${post.message.substring(0, 60)}..."`);
            console.log(`     📅 Date: ${postDate}`);
            console.log(`     👍 Likes: ${likes}`);
            console.log(`     💬 Comments: ${comments}`);
            console.log(`     🔄 Shares: ${shares}`);
            console.log(`     🔗 Post: ${post.permalink_url || 'No link'}`);
            console.log('');
          });
        } else {
          console.log(`❌ No posts found for page ${page.account_id}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching posts for page ${page.account_id}:`, error.message);
      }
    }
    
    console.log('\n✅ Facebook engagement check complete!');
    console.log('💡 Tip: Use FacebookEngagement component in your app to see this data in the UI');
    
  } catch (error) {
    console.error('❌ Engagement check failed:', error.message);
  }
}

// Run the check
checkFacebookEngagement();
