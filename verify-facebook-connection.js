/**
 * Facebook Connection Verification Script
 * Run this in browser console to verify Facebook Pages are connecting correctly
 */

window.verifyFacebookConnection = async function() {
    console.log('🔍 Verifying Facebook Connection...');
    
    // 1. Check if we have a token
    const token = localStorage.getItem('facebook_access_token');
    console.log('🔑 Token exists:', !!token);
    
    if (!token) {
        console.log('❌ No Facebook token found. Please connect Facebook first.');
        return { success: false, error: 'No token found' };
    }
    
    // 2. Test token validity
    console.log('🧪 Testing token validity...');
    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${token}`);
        const data = await response.json();
        
        if (data.error) {
            console.log('❌ Token invalid:', data.error);
            return { success: false, error: data.error };
        }
        
        console.log('✅ Token valid for user:', data.name);
    } catch (error) {
        console.log('❌ Token test failed:', error);
        return { success: false, error: error.message };
    }
    
    // 3. Fetch Facebook Pages
    console.log('📄 Fetching Facebook Pages...');
    try {
        const pagesResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,instagram_business_account&access_token=${token}`);
        const pagesData = await pagesResponse.json();
        
        if (pagesData.error) {
            console.log('❌ Pages fetch failed:', pagesData.error);
            return { success: false, error: pagesData.error };
        }
        
        console.log('📋 Raw Facebook API Response:', pagesData);
        
        // 4. Analyze the response
        const allItems = pagesData.data || [];
        console.log(`📊 Total items returned: ${allItems.length}`);
        
        // Filter for actual Facebook Pages (not personal profiles)
        const actualPages = allItems.filter(item => item.category);
        console.log(`✅ Actual Facebook Pages (with category): ${actualPages.length}`);
        
        // Filter for pages with Instagram accounts
        const pagesWithInstagram = actualPages.filter(page => page.instagram_business_account);
        console.log(`📸 Pages with Instagram linked: ${pagesWithInstagram.length}`);
        
        // 5. Display results
        if (actualPages.length === 0) {
            console.log('⚠️ No Facebook Pages found - only personal profiles');
            console.log('💡 Solution: Create Facebook Pages and link Instagram accounts');
            return { 
                success: false, 
                error: 'No Facebook Pages found',
                type: 'personal_profile_only',
                raw_data: allItems
            };
        }
        
        if (pagesWithInstagram.length === 0) {
            console.log('⚠️ Facebook Pages found but no Instagram accounts linked');
            console.log('💡 Solution: Link Instagram Business/Creator accounts to your Facebook Pages');
            return { 
                success: false, 
                error: 'No Instagram accounts linked',
                type: 'no_instagram_linked',
                pages: actualPages
            };
        }
        
        console.log('🎉 SUCCESS: Facebook Pages with Instagram found!');
        console.log('📄 Facebook Pages:');
        actualPages.forEach(page => {
            const hasInstagram = page.instagram_business_account ? '📸 Yes' : '❌ No';
            console.log(`  • ${page.name} (${page.category}) - Instagram: ${hasInstagram}`);
        });
        
        console.log('📸 Instagram Accounts:');
        pagesWithInstagram.forEach(page => {
            const ig = page.instagram_business_account;
            console.log(`  • ${ig.username || 'Unknown'} (Page: ${page.name})`);
        });
        
        return {
            success: true,
            total_pages: actualPages.length,
            instagram_pages: pagesWithInstagram.length,
            pages: actualPages,
            instagram_accounts: pagesWithInstagram.map(p => p.instagram_business_account)
        };
        
    } catch (error) {
        console.log('❌ Pages fetch failed:', error);
        return { success: false, error: error.message };
    }
};

// Quick test function
window.quickFacebookTest = function() {
    console.log('⚡ Quick Facebook Test...');
    
    const token = localStorage.getItem('facebook_access_token');
    const pages = localStorage.getItem('facebook_pages');
    
    console.log('🔑 Token:', token ? '✅ Found' : '❌ Not found');
    console.log('📄 Pages:', pages ? JSON.parse(pages).length + ' items' : '❌ Not found');
    
    if (token && pages) {
        console.log('🎯 Running full verification...');
        verifyFacebookConnection();
    } else {
        console.log('❌ Please connect Facebook first');
    }
};

console.log('🔍 Facebook Verification Scripts Loaded');
console.log('💡 Run: verifyFacebookConnection() for full test');
console.log('⚡ Run: quickFacebookTest() for quick check');
