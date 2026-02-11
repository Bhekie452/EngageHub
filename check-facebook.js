import { createClient } from "@supabase/supabase-js";

// 🔥 REPLACE WITH YOUR ACTUAL SUPABASE CREDENTIALS
const SUPABASE_URL = "https://zourlqrkoyugzymxkbgn.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXJscXJrb3l1Z3p5bXhrYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIxMTM2MiwiZXhwIjoyMDgzNzg3MzYyfQ.ic8p6qw_KJw5QtojcZwpIJ7ISJo3bxz9ef5RQA1wzfM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('🔍 Checking Facebook connections for workspace: 26caa666-2797-40f9-aa99-399be01d57eb');
  console.log('📋 Using Supabase URL:', SUPABASE_URL);
  console.log('');

  try {
    const workspaceId = "26caa666-2797-40f9-aa99-399be01d57eb";

    const { data, error } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("platform", "facebook")
      .eq("workspace_id", workspaceId);

    if (error) {
      console.error("❌ Supabase Error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log("📄 No Facebook connections found for this workspace.");
      console.log("💡 This means either:");
      console.log("   - No Facebook connection was ever created");
      console.log("   - The workspace ID is incorrect");
      console.log("   - The connection was deleted");
      return;
    }

    console.log(`✅ Found ${data.length} Facebook connection(s):`);
    console.log('');

    data.forEach((row, index) => {
      console.log(`📄 Connection ${index + 1}:`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Account Type: ${row.account_type}`);
      console.log(`   Account ID: ${row.account_id}`);
      console.log(`   Display Name: ${row.display_name}`);
      console.log(`   Connection Status: ${row.connection_status}`);
      console.log(`   Created: ${row.created_at}`);
      console.log(`   Last Sync: ${row.last_sync_at}`);
      
      // Show token info (safely)
      if (row.access_token) {
        console.log(`   Access Token: ${row.access_token.substring(0, 20)}...${row.access_token.slice(-4)}`);
        console.log(`   Token Length: ${row.access_token.length} characters`);
      }
      
      if (row.token_expires_at) {
        console.log(`   Token Expires: ${row.token_expires_at}`);
      }
      
      // Show platform data
      if (row.platform_data) {
        console.log(`   Platform Data:`);
        
        if (row.platform_data.pages) {
          console.log(`     Pages Count: ${row.platform_data.pages.length}`);
          row.platform_data.pages.forEach((page, i) => {
            console.log(`     Page ${i + 1}: ${page.pageName} (${page.pageId})`);
            console.log(`       Has Instagram: ${page.hasInstagram ? '✅' : '❌'}`);
            if (page.pageAccessToken) {
              console.log(`       Token: ${page.pageAccessToken.substring(0, 20)}...${page.pageAccessToken.slice(-4)}`);
            }
          });
        }
        
        if (row.platform_data.longTermUserToken) {
          console.log(`     Long-term User Token: ${row.platform_data.longTermUserToken.substring(0, 20)}...${row.platform_data.longTermUserToken.slice(-4)}`);
        }
      }
      
      console.log('');
    });

    console.log('🎯 Summary:');
    console.log(`   Total Connections: ${data.length}`);
    console.log(`   User Profiles: ${data.filter(r => r.account_type === 'profile').length}`);
    console.log(`   Pages: ${data.filter(r => r.account_type === 'page').length}`);
    console.log(`   Connected: ${data.filter(r => r.connection_status === 'connected').length}`);
    console.log(`   With Instagram: ${data.filter(r => r.platform_data?.pages?.some(p => p.hasInstagram)).length}`);

  } catch (err) {
    console.error("❌ Unexpected Error:", err);
    process.exit(1);
  }
}

run();
