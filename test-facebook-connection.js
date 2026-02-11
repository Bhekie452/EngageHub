/**
 * Facebook Connection Test Script
 * Run this in browser console to debug OAuth issues
 */

// Test Facebook Connection
window.testFacebookConnection = async function() {
    console.log('🧪 Starting Facebook Connection Test...');
    
    // 1. Clear all state
    console.log('\n📋 Step 1: Clearing state...');
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('current_workspace_id', 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9');
    console.log('✅ State cleared');
    
    // 2. Check current state
    console.log('\n📋 Step 2: Checking current state...');
    console.log('🔑 localStorage:', Object.keys(localStorage));
    console.log('🔑 sessionStorage:', Object.keys(sessionStorage));
    console.log('🔑 URL:', window.location.href);
    
    // 3. Test OAuth initiation
    console.log('\n📋 Step 3: Testing OAuth initiation...');
    
    // Check if initiateFacebookOAuth exists
    if (typeof window.initiateFacebookOAuth === 'function') {
        console.log('✅ initiateFacebookOAuth function found');
        
        // Mock the function to see if it's called multiple times
        let callCount = 0;
        const originalFunction = window.initiateFacebookOAuth;
        
        window.initiateFacebookOAuth = function() {
            callCount++;
            console.log(`🔄 initiateFacebookOAuth called ${callCount} times`);
            console.log('🔍 Call stack:', new Error().stack);
            
            // Check state before calling
            const oauthKey = 'facebook_oauth_in_progress';
            console.log('🔍 State before check:', {
                hasExisting: !!sessionStorage.getItem(oauthKey),
                existingValue: sessionStorage.getItem(oauthKey),
                allKeys: Object.keys(sessionStorage).filter(k => k.includes('facebook')),
                timestamp: new Date().toISOString()
            });
            
            return originalFunction.apply(this, arguments);
        };
        
        console.log('🧪 Mocked initiateFacebookOAuth - ready to test');
        
    } else {
        console.log('❌ initiateFacebookOAuth function not found');
        console.log('🔍 Available window functions:', Object.keys(window).filter(k => k.includes('facebook')));
    }
    
    // 4. Test callback handling
    console.log('\n📋 Step 4: Testing callback handling...');
    
    if (typeof window.handleFacebookCallback === 'function') {
        console.log('✅ handleFacebookCallback function found');
        
        // Mock callback to see if it's called multiple times
        let callbackCount = 0;
        const originalCallback = window.handleFacebookCallback;
        
        window.handleFacebookCallback = async function() {
            callbackCount++;
            console.log(`🔄 handleFacebookCallback called ${callbackCount} times`);
            console.log('🔍 Call stack:', new Error().stack);
            
            // Check state before processing
            console.log('🔍 Callback state:', {
                url: window.location.href,
                search: window.location.search,
                timestamp: new Date().toISOString(),
                sessionStorageKeys: Object.keys(sessionStorage).filter(k => k.includes('facebook'))
            });
            
            return originalCallback.apply(this, arguments);
        };
        
        console.log('🧪 Mocked handleFacebookCallback - ready to test');
        
    } else {
        console.log('❌ handleFacebookCallback function not found');
        console.log('🔍 Available window functions:', Object.keys(window).filter(k => k.includes('facebook')));
    }
    
    // 5. Test direct API call
    console.log('\n📋 Step 5: Testing direct API call...');
    
    try {
        const testResponse = await fetch('/api/facebook?action=diagnostics', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const testData = await testResponse.json();
        console.log('✅ API diagnostics response:', testData);
        
    } catch (error) {
        console.log('❌ API diagnostics failed:', error);
    }
    
    // 6. Test with mock code
    console.log('\n📋 Step 6: Testing with mock authorization code...');
    
    try {
        const mockCode = 'mock_authorization_code_test_' + Date.now();
        const testResponse = await fetch('/api/facebook?action=simple', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: mockCode,
                redirectUri: 'https://engage-hub-ten.vercel.app/auth/facebook/callback',
                workspaceId: 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9'
            })
        });
        
        const testData = await testResponse.json();
        console.log('✅ Mock token exchange response:', testData);
        
    } catch (error) {
        console.log('❌ Mock token exchange failed:', error);
    }
    
    console.log('\n🎯 Test Complete!');
    console.log('📝 Instructions:');
    console.log('1. Click "Connect Facebook" button');
    console.log('2. Watch console for multiple calls');
    console.log('3. Complete OAuth flow');
    console.log('4. Check for duplicate processing');
    
    return {
        status: 'test_ready',
        functions: {
            initiateFacebookOAuth: typeof window.initiateFacebookOAuth === 'function',
            handleFacebookCallback: typeof window.handleFacebookCallback === 'function'
        }
    };
};

// Auto-run test
console.log('🧪 Facebook Connection Test Script Loaded');
console.log('💡 Run: testFacebookConnection() to start testing');
