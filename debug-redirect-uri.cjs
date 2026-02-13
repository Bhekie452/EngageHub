const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function debugRedirectURI() {
  console.log('🔍 Debugging Redirect URI Issue...\n');

  try {
    // Test the backend with detailed logging
    const testCode = 'test_code_' + Date.now();
    const testWorkspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
    const testOrigin = 'https://engage-hub-ten.vercel.app/';
    
    console.log('📤 Sending test OAuth request...');
    console.log('   Code:', testCode);
    console.log('   WorkspaceId:', testWorkspaceId);
    console.log('   Origin:', testOrigin);
    
    const response = await fetch('https://engage-hub-ten.vercel.app/api/facebook?action=simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug-Script/1.0'
      },
      body: JSON.stringify({
        code: testCode,
        workspaceId: testWorkspaceId,
        origin: testOrigin
      })
    });

    const data = await response.json();
    console.log('📥 Backend Response:', data);
    
    if (data.success) {
      console.log('✅ Backend is working correctly');
    } else {
      console.log('❌ Backend error:', data.error);
      console.log('   Message:', data.message);
      console.log('   Type:', data.type);
      console.log('   Code:', data.code);
    }

    // Test with different origins to see what works
    console.log('\n🧪 Testing different origin formats...');
    
    const origins = [
      'https://engage-hub-ten.vercel.app',
      'https://engage-hub-ten.vercel.app/',
      'https://engage-hub-ten.vercel.app/#/',
      'https://engage-hub-ten.vercel.app/#/pages/auth/facebook/callback'
    ];
    
    for (const origin of origins) {
      console.log(`\n📤 Testing with origin: ${origin}`);
      
      try {
        const testResponse = await fetch('https://engage-hub-ten.vercel.app/api/facebook?action=simple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': origin
          },
          body: JSON.stringify({
            code: testCode,
            workspaceId: testWorkspaceId,
            origin: origin
          })
        });
        
        const testData = await testResponse.json();
        console.log(`   Result: ${testData.success ? 'SUCCESS' : 'ERROR'}`);
        
        if (!testData.success) {
          console.log(`   Error: ${testData.error}`);
        }
      } catch (err) {
        console.log(`   Exception: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugRedirectURI();
