require('dotenv').config();

async function debugPageConnection() {
  console.log('🔍 Debugging Page Connection Request...\n');

  try {
    // Simulate the exact request the frontend sends
    const testPayload = {
      pageId: 'test_page_123',
      pageAccessToken: 'test_token_abc123',
      workspaceId: 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9',
      pageName: 'Test Page',
      instagramBusinessAccountId: 'test_instagram_456'
    };

    console.log('📤 Sending payload:', JSON.stringify(testPayload, null, 2));

    const response = await fetch('https://engage-hub-ten.vercel.app/api/facebook?action=connect-page', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      'User-Agent': 'Debug-Script/1.0'
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();
    console.log('📥 Backend Response:', data);
    console.log('📊 Status Code:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (data.error) {
      console.log('❌ Error Details:');
      console.log('   Error:', data.error);
      console.log('   Details:', data.details);
      console.log('   Type:', data.type);
      console.log('   Code:', data.code);
    } else {
      console.log('✅ Success! Page connection would work');
    }

  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

debugPageConnection();
