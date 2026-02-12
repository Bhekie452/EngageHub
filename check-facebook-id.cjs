// Check Facebook ID Type
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFacebookId() {
  console.log('🔍 Checking Facebook ID: 61587396402869');
  console.log('==========================================');
  
  const facebookId = '61587396402869';
  
  try {
    // Step 1: Try to get profile info
    console.log('1️⃣ Testing as User Profile...');
    await testAsProfile(facebookId);
    
    // Step 2: Try to get page info
    console.log('\n2️⃣ Testing as Facebook Page...');
    await testAsPage(facebookId);
    
    // Step 3: Check if it's in our database
    console.log('\n3️⃣ Checking Database...');
    await checkDatabase(facebookId);
    
  } catch (err) {
    console.error('❌ Check failed:', err.message);
  }
}

async function testAsProfile(id) {
  try {
    const url = `https://graph.facebook.com/v21.0/${id}?fields=id,name,first_name,last_name,link&access_token=${process.env.FACEBOOK_LONG_TERM_TOKEN}`;
    const resp = await fetch(url);
    const data = await resp.json();
    
    if (data.error) {
      console.log('  ❌ Not accessible as profile:', data.error.message);
    } else {
      console.log('  ✅ Accessible as profile:');
      console.log('    👤 Name:', data.name);
      console.log('    🔗 Link:', data.link);
      console.log('    🆔 ID:', data.id);
    }
  } catch (error) {
    console.log('  ❌ Profile test error:', error.message);
  }
}

async function testAsPage(id) {
  try {
    const url = `https://graph.facebook.com/v21.0/${id}?fields=id,name,category,link,fan_count,talking_about_count&access_token=${process.env.FACEBOOK_LONG_TERM_TOKEN}`;
    const resp = await fetch(url);
    const data = await resp.json();
    
    if (data.error) {
      console.log('  ❌ Not accessible as page:', data.error.message);
    } else {
      console.log('  ✅ Accessible as page:');
      console.log('    📄 Name:', data.name);
      console.log('    📂 Category:', data.category);
      console.log('    👥 Fans:', data.fan_count || 'N/A');
      console.log('    💬 Talking About:', data.talking_about_count || 'N/A');
      console.log('    🔗 Link:', data.link);
    }
  } catch (error) {
    console.log('  ❌ Page test error:', error.message);
  }
}

async function checkDatabase(id) {
  try {
    const { data: connections } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .eq('connection_status', 'connected');
    
    if (!connections || connections.length === 0) {
      console.log('  ℹ️ No Facebook connections in database');
      return;
    }
    
    const found = connections.filter(c => 
      c.account_id === id || 
      c.account_id === `profile_${id}` || 
      c.display_name?.includes(id.toString())
    );
    
    if (found.length > 0) {
      console.log('  ✅ Found in database:');
      found.forEach((conn, index) => {
        console.log(`    ${index + 1}. ${conn.display_name} (${conn.account_type})`);
        console.log(`       ID: ${conn.account_id}`);
        console.log(`       Workspace: ${conn.workspace_id}`);
      });
    } else {
      console.log('  ❌ Not found in database connections');
    }
    
  } catch (error) {
    console.log('  ❌ Database check error:', error.message);
  }
}

checkFacebookId();
