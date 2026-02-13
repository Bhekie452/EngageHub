const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function checkPages() {
  console.log('📄 Checking Facebook Pages...\n');
  
  const { data, error } = await supabase
    .from('social_accounts')
    .select('platform_data')
    .eq('platform', 'facebook')
    .eq('account_type', 'profile')
    .single();
    
  if (error) {
    console.log('❌ Error:', error);
  } else if (data && data.platform_data) {
    const pages = data.platform_data.pages || [];
    console.log('📄 Facebook Pages Found:', pages.length);
    
    if (pages.length > 0) {
      pages.forEach((page, index) => {
        console.log(`   ${index + 1}. ${page.pageName} (${page.pageId})`);
        if (page.hasInstagram) {
          console.log(`      📷 Instagram Business Account: ${page.instagramBusinessAccountId}`);
        }
        console.log(`      📂 Category: ${page.category || 'Unknown'}`);
        console.log(`      🔑 Token Length: ${page.pageAccessToken?.length || 0}`);
      });
    } else {
      console.log('   No pages found in platform_data');
    }
  } else {
    console.log('📄 No platform_data found');
  }
}

checkPages();
