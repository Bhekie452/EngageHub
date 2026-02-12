// Connect Facebook Profile - Helper Script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function connectFacebookNow() {
  console.log('🔗 Facebook Profile Connection Helper');
  console.log('=====================================');
  
  const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
  
  try {
    // Check current state
    console.log('1️⃣ Checking current state...');
    const { data: connections, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook');
    
    if (error) {
      console.error('❌ Database error:', error);
      return;
    }
    
    console.log('Current Facebook connections:', connections?.length || 0);
    if (connections && connections.length > 0) {
      connections.forEach(conn => {
        console.log('  -', conn.account_type, ':', conn.display_name, '(Status:', conn.connection_status, ')');
      });
    }
    
    // Check environment variables
    console.log('\n2️⃣ Checking Facebook App Configuration...');
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    
    console.log('FACEBOOK_APP_ID:', appId ? '✅ Set' : '❌ Missing');
    console.log('FACEBOOK_APP_SECRET:', appSecret ? '✅ Set' : '❌ Missing');
    
    if (!appId || !appSecret) {
      console.log('\n❌ Facebook App not configured properly');
      console.log('Please check your environment variables');
      return;
    }
    
    // Generate OAuth URL
    console.log('\n3️⃣ Generating Facebook OAuth URL...');
    const redirectUri = 'https://engage-hub-ten.vercel.app/auth/facebook/callback';
    const state = 'facebook_oauth';
    const scope = encodeURIComponent('public_profile,email,pages_show_list,pages_read_engagement,instagram_basic');
    
    const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?` +
      `client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}` +
      `&response_type=code` +
      `&state=${state}`;
    
    console.log('\n🔗 Facebook OAuth URL:');
    console.log(oauthUrl);
    
    console.log('\n4️⃣ Connection Steps:');
    console.log('1. Click the URL above OR use the "Connect Facebook Profile" button in your app');
    console.log('2. Log into Facebook');
    console.log('3. Grant permissions (pages_show_list, pages_read_engagement, etc.)');
    console.log('4. Wait for redirect back to your app');
    console.log('5. Check if connection is saved in database');
    
    console.log('\n✅ Ready to connect Facebook!');
    console.log('💡 Use the OAuth URL above or your app\'s "Connect Facebook Profile" button');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

connectFacebookNow();
