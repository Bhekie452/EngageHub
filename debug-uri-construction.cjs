require('dotenv').config();

async function debugURIConstruction() {
  console.log('🔍 Debugging URI Construction...\n');

  const testState = JSON.stringify({
    workspaceId: 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9',
    origin: 'https://engage-hub-ten.vercel.app/'
  });

  console.log('📤 Test state:', testState);
  console.log('📤 Encoded state:', encodeURIComponent(testState));

  const testCode = 'test_code_' + Date.now();
  
  // Test different redirect URI formats
  const redirectURIs = [
    'https://engage-hub-ten.vercel.app/#/pages/auth/facebook/callback',
    'https://engage-hub-ten.vercel.app/#/pages/auth/facebook/callback/',
    'https://engage-hub-ten.vercel.app/pages/auth/facebook/callback',
    'https://engage-hub-ten.vercel.app/pages/auth/facebook/callback/',
  ];

  for (const redirectUri of redirectURIs) {
    console.log(`\n📤 Testing redirect URI: ${redirectUri}`);
    
    try {
      const testUrl = `https://www.facebook.com/v21.0/dialog/oauth?` +
        `client_id=2106228116796555` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${encodeURIComponent(testState)}` +
        `&scope=email,public_profile,pages_show_list,instagram_basic,pages_read_engagement,pages_manage_posts`;

      console.log(`📤 Full OAuth URL: ${testUrl}`);
      
      // Test if Facebook accepts this redirect URI
      const validationResponse = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?` +
        `client_id=2106228116796555` +
        `&client_secret=***` + // Secret would be here
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&code=test_code_validation`, {
        method: 'POST'
      });

      const validationData = await validationResponse.json();
      console.log(`   Result: ${validationData.error ? 'REJECTED' : 'ACCEPTED'}`);
      
      if (validationData.error) {
        console.log(`   Error: ${validationData.error.message}`);
      }

    } catch (err) {
      console.log(`   Exception: ${err.message}`);
    }
  }
}

debugURIConstruction();
