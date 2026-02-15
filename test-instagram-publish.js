// Test Instagram Publishing with Media
console.log('📸 Testing Instagram Publishing with Media...\n');

async function testInstagramPublish() {
  try {
    // Test 1: Check if the fix is deployed
    console.log('🔍 Step 1: Testing if Instagram fix is deployed...');
    
    const testResponse = await fetch('/api/publish-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Test Instagram post with media',
        platforms: ['instagram'],
        mediaUrls: ['https://picsum.photos/800/600'] // Test image URL
      })
    });
    
    const testResult = await testResponse.json();
    console.log('📊 Test Response Status:', testResponse.status);
    console.log('📊 Test Response Data:', testResult);
    
    if (testResult.success && testResult.platforms?.instagram?.status === 'published') {
      console.log('✅ SUCCESS: Instagram publishing is working!');
      console.log('📸 Post ID:', testResult.platforms.instagram.postId);
      console.log('📄 Page:', testResult.platforms.instagram.pageName);
    } else {
      console.log('❌ ERROR: Instagram publishing still has issues');
      console.log('🔍 Error Details:', testResult.platforms?.instagram?.error);
      console.log('📋 Full Response:', JSON.stringify(testResult, null, 2));
    }
    
    // Test 2: Check deployment status
    console.log('\n🔍 Step 2: Checking deployment status...');
    
    const deployCheck = await fetch('/api/publish-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Deployment check',
        platforms: ['instagram'],
        mediaUrls: ['https://via.placeholder.com/150/150/000000/FFFFFF?text=CHECK']
      })
    });
    
    const deployResult = await deployCheck.json();
    console.log('🚀 Deployment Check Response:', deployResult);
    
    // Test 3: Test without media (should show proper error)
    console.log('\n🔍 Step 3: Testing without media (should show error)...');
    
    const noMediaTest = await fetch('/api/publish-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Test without media',
        platforms: ['instagram']
        // No mediaUrls - should trigger error
      })
    });
    
    const noMediaResult = await noMediaTest.json();
    console.log('📸 No Media Test Response:', noMediaResult);
    
    if (noMediaResult.platforms?.instagram?.error?.includes('No media URLs provided')) {
      console.log('✅ SUCCESS: Proper error handling for missing media');
    } else {
      console.log('❌ ERROR: Missing media error not working correctly');
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('='.repeat(50));
    console.log('1. With Media:', testResult.platforms?.instagram?.status || 'ERROR');
    console.log('2. Deployment Check:', deployResult.platforms?.instagram?.status || 'ERROR');
    console.log('3. No Media Error:', noMediaResult.platforms?.instagram?.error?.includes('No media URLs') ? 'WORKING' : 'BROKEN');
    console.log('='.repeat(50));
    
    console.log('\n💡 If tests show errors, the fix might not be deployed yet.');
    console.log('🔄 Wait 1-2 minutes for Vercel deployment, then run again.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testInstagramPublish();
