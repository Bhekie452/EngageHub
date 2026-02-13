const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function checkFacebookConnections() {
  console.log('🔍 Checking Facebook connections...\n');

  try {
    // Check ALL Facebook connections
    const { data: allConnections, error: allError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Error fetching all connections:', allError);
      return;
    }

    console.log(`📊 Total Facebook Connections: ${allConnections?.length || 0}`);
    
    if (allConnections && allConnections.length > 0) {
      allConnections.forEach((conn, index) => {
        console.log(`\n${index + 1}. Connection Details:`);
        console.log(`   ID: ${conn.id}`);
        console.log(`   Workspace ID: ${conn.workspace_id}`);
        console.log(`   Account Type: ${conn.account_type}`);
        console.log(`   Account ID: ${conn.account_id}`);
        console.log(`   Display Name: ${conn.display_name}`);
        console.log(`   Username: ${conn.username || 'N/A'}`);
        console.log(`   Connection Status: ${conn.connection_status}`);
        console.log(`   Is Active: ${conn.is_active}`);
        console.log(`   Connected By: ${conn.connected_by}`);
        console.log(`   Created At: ${conn.created_at}`);
        console.log(`   Last Sync: ${conn.last_sync_at}`);
        console.log(`   Token Expires: ${conn.token_expires_at || 'Not set'}`);
        
        // Check platform data
        if (conn.platform_data) {
          const platformData = typeof conn.platform_data === 'string' 
            ? JSON.parse(conn.platform_data) 
            : conn.platform_data;
          
          console.log(`   Platform Data:`);
          if (platformData.pages) {
            console.log(`     - Available Pages: ${platformData.pages?.length || 0}`);
            platformData.pages?.forEach((page, i) => {
              console.log(`       ${i + 1}. ${page.pageName} (${page.pageId})`);
            });
          }
          if (platformData.hasInstagram) {
            console.log(`     - Instagram Connected: Yes`);
          }
          if (platformData.pageVerified) {
            console.log(`     - Page Verified: Yes`);
          }
          if (platformData.instagramBusinessAccountId) {
            console.log(`     - Instagram Business ID: ${platformData.instagramBusinessAccountId}`);
          }
        }
        console.log('   ---');
      });
    } else {
      console.log('❌ No Facebook connections found');
    }

    // Check specifically for PAGE connections (what we want)
    console.log('\n🎯 Page Connections (Target for Posting):');
    const { data: pageConnections, error: pageError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .eq('account_type', 'page')
      .eq('connection_status', 'connected')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (pageError) {
      console.error('❌ Error fetching page connections:', pageError);
      return;
    }

    if (pageConnections && pageConnections.length > 0) {
      console.log(`✅ Found ${pageConnections.length} connected Facebook Page(s):`);
      pageConnections.forEach((page, index) => {
        console.log(`\n📄 Page ${index + 1}:`);
        console.log(`   Name: ${page.display_name}`);
        console.log(`   Page ID: ${page.account_id}`);
        console.log(`   Workspace: ${page.workspace_id}`);
        console.log(`   Connected: ${page.created_at}`);
        console.log(`   Token Present: ${page.access_token ? 'Yes' : 'No'}`);
        console.log(`   Token Length: ${page.access_token?.length || 0} chars`);
        
        if (page.platform_data) {
          const platformData = typeof page.platform_data === 'string' 
            ? JSON.parse(page.platform_data) 
            : page.platform_data;
          
          if (platformData.hasInstagram) {
            console.log(`   📷 Instagram Business: ${platformData.instagramBusinessAccountId || 'Connected'}`);
          }
          if (platformData.category) {
            console.log(`   📂 Category: ${platformData.category}`);
          }
        }
      });
    } else {
      console.log('❌ No connected Facebook Pages found');
      console.log('💡 Users need to: Connect Facebook Profile → Select Page → Connect Page');
    }

    // Check for PROFILE connections (OAuth)
    console.log('\n👤 Profile Connections (OAuth):');
    const { data: profileConnections, error: profileError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .eq('account_type', 'profile')
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false });

    if (profileError) {
      console.error('❌ Error fetching profile connections:', profileError);
      return;
    }

    if (profileConnections && profileConnections.length > 0) {
      console.log(`✅ Found ${profileConnections.length} connected Facebook Profile(s):`);
      profileConnections.forEach((profile, index) => {
        console.log(`\n👤 Profile ${index + 1}:`);
        console.log(`   Name: ${profile.display_name}`);
        console.log(`   Workspace: ${profile.workspace_id}`);
        console.log(`   Connected: ${profile.created_at}`);
        console.log(`   Token Present: ${profile.access_token ? 'Yes' : 'No'}`);
        console.log(`   Token Length: ${profile.access_token?.length || 0} chars`);
        console.log(`   Token Expires: ${profile.token_expires_at || 'Not set'}`);
        
        if (profile.platform_data) {
          const platformData = typeof profile.platform_data === 'string' 
            ? JSON.parse(profile.platform_data) 
            : profile.platform_data;
          
          if (platformData.pages) {
            console.log(`   📄 Available Pages: ${platformData.pages?.length || 0}`);
          }
        }
      });
    } else {
      console.log('❌ No connected Facebook Profiles found');
      console.log('💡 Users need to: Connect Facebook Profile first via OAuth');
    }

    console.log('\n🎯 Summary:');
    console.log(`   - Total Connections: ${allConnections?.length || 0}`);
    console.log(`   - Connected Pages: ${pageConnections?.length || 0}`);
    console.log(`   - Connected Profiles: ${profileConnections?.length || 0}`);
    console.log(`   - Ready for Posting: ${pageConnections?.length > 0 ? 'YES' : 'NO'}`);

  } catch (error) {
    console.error('❌ Error checking connections:', error);
  }
}

// Run the check
checkFacebookConnections();
