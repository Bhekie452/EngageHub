const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function debugConnectionDetails() {
  console.log('🔍 Debugging Connection Details...\n');
  
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('platform', 'facebook')
    .eq('account_type', 'profile')
    .single();
    
  if (error) {
    console.log('❌ Error:', error);
  } else if (data) {
    console.log('📊 Connection Details:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Display Name: ${data.display_name}`);
    console.log(`   Account ID: ${data.account_id}`);
    console.log(`   Connection Status: ${data.connection_status}`);
    console.log(`   Created: ${data.created_at}`);
    console.log(`   Token Expires: ${data.token_expires_at}`);
    console.log(`   Scopes: ${data.scopes?.join(', ') || 'None'}`);
    
    if (data.platform_data) {
      console.log('\n📄 Platform Data:');
      console.log(`   Pages Count: ${data.platform_data.pages?.length || 0}`);
      console.log(`   Long Term Token: ${data.platform_data.longTermUserToken ? 'Present' : 'Missing'}`);
      console.log(`   Token Expires In: ${data.platform_data.userTokenExpiresIn || 'Unknown'}`);
      
      if (data.platform_data.pages && data.platform_data.pages.length > 0) {
        console.log('\n📄 Facebook Pages:');
        data.platform_data.pages.forEach((page, index) => {
          console.log(`   ${index + 1}. ${page.pageName} (${page.pageId})`);
          console.log(`      Category: ${page.category || 'Unknown'}`);
          console.log(`      Has Instagram: ${page.hasInstagram ? 'Yes' : 'No'}`);
          console.log(`      Token Length: ${page.pageAccessToken?.length || 0}`);
        });
      }
    }
  }
}

debugConnectionDetails();
