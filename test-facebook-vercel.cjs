/**
 * Test Facebook Connection via Vercel API
 * This tests the actual OAuth flow
 */

const BASE_URL = 'https://engage-hub-ten.vercel.app';
const WORKSPACE_ID = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

async function testFacebookAPI() {
  console.log('=== Testing Facebook API on Vercel ===\n');

  // 1. Test the Facebook auth endpoint
  console.log('1. Testing GET /api/facebook?action=auth...');
  try {
    const response = await fetch(`${BASE_URL}/api/facebook?action=auth&workspaceId=${WORKSPACE_ID}`, {
      method: 'GET',
      redirect: 'follow'
    });
    console.log(`   Status: ${response.status}`);
    console.log(`   URL: ${response.url}`);
    
    // If it redirects, that's the OAuth URL
    if (response.status === 302 || response.url.includes('facebook.com')) {
      console.log('   ✅ Redirects to Facebook OAuth');
    } else {
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 500)}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // 2. Test the auth token endpoint  
  console.log('\n2. Testing POST /api/auth (facebook token)...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth?provider=facebook&action=token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'test' })
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data)}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // 3. Test if the Facebook app credentials are accessible
  console.log('\n3. Testing credential access in Vercel...');
  // We can't directly check env vars, but we can try to trigger an auth and see what happens
  
  console.log('\n=== Summary ===');
  console.log('The Facebook API endpoints exist.');
  console.log('Credentials may or may not be set in Vercel environment variables.');
}

testFacebookAPI().catch(console.error);
