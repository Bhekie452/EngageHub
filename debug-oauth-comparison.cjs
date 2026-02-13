require('dotenv').config();

async function debugOAuthComparison() {
  console.log('🔍 Comparing Manual vs Backend OAuth Flow...\n');

  // 1. Check what scopes backend is actually using
  console.log('📋 Manual OAuth URL Scopes:');
  console.log('   email,public_profile,pages_show_list,instagram_basic,pages_read_engagement,pages_manage_posts');
  
  console.log('\n📋 Backend Scopes (from code):');
  const backendScopes = process.env.VITE_FACEBOOK_SCOPES || 
    'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights';
  console.log('   ', backendScopes);
  
  console.log('\n🔍 Scope Comparison:');
  const manualScopes = ['email', 'public_profile', 'pages_show_list', 'instagram_basic', 'pages_read_engagement', 'pages_manage_posts'];
  const backendScopeList = backendScopes.split(',');
  
  console.log('   Manual scopes:', manualScopes.length);
  console.log('   Backend scopes:', backendScopeList.length);
  console.log('   Match:', JSON.stringify(manualScopes.sort()) === JSON.stringify(backendScopeList.sort()));
  
  // 2. Check backend OAuth URL generation
  console.log('\n🔗 Backend OAuth URL Generation:');
  console.log('   Client ID:', process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID);
  console.log('   Redirect URI:', 'https://engage-hub-ten.vercel.app/#/pages/auth/facebook/callback');
  
  // 3. Check if backend is using different API version
  console.log('\n📊 API Version Check:');
  console.log('   Manual URL uses: v21.0');
  console.log('   Backend should use: v21.0');
  
  // 4. Check token exchange process
  console.log('\n🔄 Token Exchange Process:');
  console.log('   Step 1: Exchange code for short-term token');
  console.log('   Step 2: Exchange short-term for long-term token');
  console.log('   Step 3: Call /me/accounts with long-term token');
  
  // 5. Test the actual backend endpoint
  console.log('\n🧪 Testing Backend OAuth Endpoint:');
  
  try {
    const testCode = 'test_real_oauth_flow';
    const testWorkspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
    const testState = JSON.stringify({
      workspaceId: testWorkspaceId,
      origin: 'https://engage-hub-ten.vercel.app/'
    });

    console.log('   Sending test request to backend...');
    
    const response = await fetch('https://engage-hub-ten.vercel.app/api/facebook?action=simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: testCode,
        workspaceId: testWorkspaceId,
        origin: 'https://engage-hub-ten.vercel.app/'
      })
    });

    const data = await response.json();
    console.log('   Backend Response:', data);
    
    if (data.error) {
      console.log('   ❌ Error Type:', data.error);
      console.log('   Message:', data.message);
      console.log('   Facebook Error:', data.type);
      console.log('   Code:', data.code);
      
      // Analyze the error
      if (data.code === 100) {
        console.log('   🔍 Analysis: Invalid verification code format');
        console.log('   💡 This means backend is calling Facebook API with wrong parameters');
      }
      if (data.code === 191) {
        console.log('   🔍 Analysis: Redirect URI mismatch');
        console.log('   💡 Check Facebook App settings');
      }
    }
    
  } catch (err) {
    console.log('   ❌ Request failed:', err.message);
  }
  
  console.log('\n🎯 Key Differences to Check:');
  console.log('1. Scopes: Manual vs Backend');
  console.log('2. Redirect URI: Exact match');
  console.log('3. State parameter: Proper encoding');
  console.log('4. Token exchange: Same process');
  console.log('5. API version: v21.0 consistency');
  
  console.log('\n💡 Most Likely Issues:');
  console.log('1. Backend using different scopes than manual URL');
  console.log('2. Backend token exchange process differs');
  console.log('3. Backend API call format different');
  console.log('4. Backend using different token type');
}

debugOAuthComparison();
