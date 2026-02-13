const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function checkProfilePages() {
  console.log('🔍 Checking Profile Platform Data for Pages...\n');

  try {
    // Get the profile connection
    const { data: profileConnections, error: profileError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .eq('account_type', 'profile')
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false })
      .limit(1);

    if (profileError) {
      console.error('❌ Error fetching profile connection:', profileError);
      return;
    }

    if (!profileConnections || profileConnections.length === 0) {
      console.log('❌ No connected Facebook Profile found');
      return;
    }

    const profile = profileConnections[0];
    console.log('👤 Profile Connection Found:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Name: ${profile.display_name}`);
    console.log(`   Workspace: ${profile.workspace_id}`);
    console.log(`   Token Length: ${profile.access_token?.length || 0} chars`);
    console.log(`   Created: ${profile.created_at}`);

    // Check platform_data for pages
    if (profile.platform_data) {
      const platformData = typeof profile.platform_data === 'string' 
        ? JSON.parse(profile.platform_data) 
        : profile.platform_data;
      
      console.log('\n📊 Platform Data Analysis:');
      console.log(`   Raw Type: ${typeof profile.platform_data}`);
      console.log(`   Parsed: ${JSON.stringify(platformData, null, 2)}`);
      
      if (platformData.pages) {
        console.log(`\n📄 Available Pages (${platformData.pages.length}):`);
        platformData.pages.forEach((page, index) => {
          console.log(`\n   ${index + 1}. ${page.pageName}`);
          console.log(`      Page ID: ${page.pageId}`);
          console.log(`      Category: ${page.category || 'N/A'}`);
          console.log(`      Token Length: ${page.pageAccessToken?.length || 0} chars`);
          console.log(`      Has Instagram: ${page.hasInstagram ? 'Yes' : 'No'}`);
          if (page.instagramBusinessAccountId) {
            console.log(`      Instagram Business ID: ${page.instagramBusinessAccountId}`);
          }
          if (page.fanCount !== undefined) {
            console.log(`      Fan Count: ${page.fanCount}`);
          }
        });
      } else {
        console.log('\n❌ No pages found in platform_data');
        console.log('💡 This means the OAuth flow completed but page selection may not have happened');
      }

      // Check other platform data fields
      if (platformData.longTermUserToken) {
        console.log(`\n🔑 Long-term User Token: Present (${platformData.longTermUserToken.length} chars)`);
      }
      if (platformData.pageVerified) {
        console.log('✅ Page Verification: Completed');
      }
    } else {
      console.log('\n❌ No platform_data found');
      console.log('💡 This suggests the OAuth connection may be incomplete');
    }

    // Check for any pending pages in sessionStorage (from recent OAuth)
    console.log('\n🔄 Checking for Pending Pages from OAuth...');
    try {
      // This would be set by the OAuth callback flow
      const pendingPages = process.env.FACEBOOK_PAGES_PENDING || '[]';
      console.log(`   Pending Pages: ${pendingPages}`);
    } catch (e) {
      console.log('   No pending pages found in environment');
    }

  } catch (error) {
    console.error('❌ Error checking profile data:', error);
  }
}

// Run the check
checkProfilePages();
