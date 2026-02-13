const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function checkUserFacebookAccounts() {
  console.log('🔍 Checking Bheki Tsabedze Facebook Accounts...\n');

  try {
    // Get the profile connection
    const { data: profileConnections, error: profileError } = await supabase
      .from('social_accounts')
      .select('access_token')
      .eq('platform', 'facebook')
      .eq('account_type', 'profile')
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false })
      .limit(1);

    if (profileError) {
      console.error('❌ Error fetching profile connection:', profileError);
      return;
    }

    const profileConnection = profileConnections?.[0];
    if (!profileConnection?.access_token) {
      console.log('❌ No Facebook profile connection found');
      return;
    }

    console.log('👤 Using Profile Token:', profileConnection.access_token.substring(0, 20) + '...');

    // Call Facebook API to get ALL accounts/pages
    const accountsUrl = `https://graph.facebook.com/v21.0/me/accounts?` +
      `fields=id,name,username,category,access_token,instagram_business_account,fan_count,tasks` +
      `&access_token=${profileConnection.access_token}`;

    console.log('🌐 Fetching from Facebook API...');
    const response = await fetch(accountsUrl);
    const data = await response.json();

    if (data.error) {
      console.error('❌ Facebook API Error:', data.error);
      return;
    }

    console.log('✅ Facebook API Response Received');

    if (data.data && data.data.length > 0) {
      console.log(`\n📊 Found ${data.data.length} Facebook Account(s):`);
      
      data.data.forEach((account, index) => {
        console.log(`\n${index + 1}. Account Details:`);
        console.log(`   ID: ${account.id}`);
        console.log(`   Name: ${account.name}`);
        console.log(`   Username: ${account.username || 'N/A'}`);
        console.log(`   Category: ${account.category || 'N/A'}`);
        console.log(`   Fan Count: ${account.fan_count || 'N/A'}`);
        console.log(`   Access Token: ${account.access_token ? 'Yes (' + account.access_token.length + ' chars)' : 'No'}`);
        
        if (account.instagram_business_account) {
          console.log(`   📷 Instagram Business:`);
          console.log(`      ID: ${account.instagram_business_account.id}`);
          console.log(`      Username: ${account.instagram_business_account.username || 'N/A'}`);
        }
        
        if (account.tasks) {
          console.log(`   🔧 Available Tasks: ${account.tasks.join(', ')}`);
        }
        
        // Determine account type
        if (account.category) {
          const isPage = account.category.toLowerCase().includes('page') || 
                        ['restaurant', 'business', 'brand', 'community'].some(cat => 
                          account.category.toLowerCase().includes(cat));
          console.log(`   📋 Type: ${isPage ? 'Facebook Page' : 'Other Account'}`);
        } else {
          console.log(`   📋 Type: Unknown (no category)`);
        }
      });

      // Separate pages from other accounts
      const pages = data.data.filter(account => 
        account.category && (
          account.category.toLowerCase().includes('page') ||
          ['restaurant', 'business', 'brand', 'community', 'website'].some(cat => 
            account.category.toLowerCase().includes(cat))
        )
      );

      const otherAccounts = data.data.filter(account => !pages.includes(account));

      console.log(`\n📄 Summary:`);
      console.log(`   📄 Facebook Pages: ${pages.length}`);
      console.log(`   👤 Other Accounts: ${otherAccounts.length}`);
      
      if (pages.length > 0) {
        console.log(`\n🎯 Available Pages for Connection:`);
        pages.forEach((page, index) => {
          console.log(`   ${index + 1}. ${page.name} (${page.id})`);
        });
      }

    } else {
      console.log('❌ No Facebook accounts found');
      console.log('💡 This could mean:');
      console.log('   - Token has expired');
      console.log('   - Insufficient permissions');
      console.log('   - Account has no pages/business accounts');
    }

    // Also check what we have stored in database
    console.log('\n🗄️ Database Check:');
    const { data: storedConnections, error: storedError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .eq('workspace_id', '76844eda-1015-4d3b-896b-10a99dfe6f88')
      .order('created_at', { ascending: false });

    if (storedError) {
      console.error('❌ Error fetching stored connections:', storedError);
      return;
    }

    console.log(`📊 Stored Connections: ${storedConnections?.length || 0}`);
    storedConnections?.forEach((conn, index) => {
      console.log(`\n${index + 1}. Stored Connection:`);
      console.log(`   Type: ${conn.account_type}`);
      console.log(`   Name: ${conn.display_name}`);
      console.log(`   Account ID: ${conn.account_id}`);
      console.log(`   Status: ${conn.connection_status}`);
      console.log(`   Created: ${conn.created_at}`);
    });

  } catch (error) {
    console.error('❌ Error checking Facebook accounts:', error);
  }
}

// Run the check
checkUserFacebookAccounts();
