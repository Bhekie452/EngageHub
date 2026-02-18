/**
 * Facebook Connection Test Script
 * Tests the Facebook OAuth flow by checking the API endpoints
 */

const SUPABASE_URL = 'https://zourlqrkoyugzymxkbgn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXJscXJrb3l1Z3p5bXhrYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTEzNjIsImV4cCI6MjA4Mzc4NzM2Mn0.vm_vt_YV6YBchtC3IsEZ-yPLFpQH90WfJ81yVw7PlWA';
const WORKSPACE_ID = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

async function testFacebookConnection() {
  console.log('=== Testing Facebook Connection ===\n');

  // 1. Check current social accounts
  console.log('1. Checking current social accounts in database...');
  const accountsResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/social_accounts?workspace_id=eq.${WORKSPACE_ID}&select=*`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );
  const accounts = await accountsResponse.json();
  console.log(`   Found ${accounts.length} social accounts:`);
  accounts.forEach(acc => {
    console.log(`   - ${acc.platform}: ${acc.display_name || acc.account_id} (active: ${acc.is_active})`);
  });

  // 2. Test Facebook API endpoint
  console.log('\n2. Testing /api/facebook endpoint...');
  try {
    const fbResponse = await fetch(
      `https://engage-hub-ten.vercel.app/api/facebook?action=auth&workspaceId=${WORKSPACE_ID}`,
      { 
        method: 'GET',
        redirect: 'manual'
      }
    );
    console.log(`   Status: ${fbResponse.status}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(fbResponse.headers))}`);
    
    const fbText = await fbResponse.text();
    console.log(`   Response (first 500 chars): ${fbText.substring(0, 500)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // 3. Check environment variables (simulated)
  console.log('\n3. Checking Facebook credentials in .env.local...');
  const envVars = require('fs').readFileSync('.env.local', 'utf8');
  const fbAppId = envVars.match(/FACEBOOK_APP_ID=(.*)/)?.[1];
  const fbAppSecret = envVars.match(/FACEBOOK_APP_SECRET=(.*)/)?.[1];
  console.log(`   FACEBOOK_APP_ID: ${fbAppId ? 'SET' : 'MISSING'}`);
  console.log(`   FACEBOOK_APP_SECRET: ${fbAppSecret ? 'SET (length: ' + fbAppSecret.length + ')' : 'MISSING'}`);

  // 4. Test direct Facebook Graph API
  console.log('\n4. Testing Facebook Graph API (debug_token)...');
  // This is just to check if we have a valid token format - we don't have one yet
  console.log('   (Skipping - need OAuth code first)');

  // 5. Check if there's a Facebook auth endpoint
  console.log('\n5. Checking API routes for Facebook...');
  const apiAuthResponse = await fetch(
    `https://engage-hub-ten.vercel.app/api/auth?provider=facebook&action=token`,
    { method: 'POST' }
  );
  console.log(`   /api/auth (facebook/token): ${apiAuthResponse.status}`);

  console.log('\n=== Test Complete ===');
}

testFacebookConnection().catch(console.error);
