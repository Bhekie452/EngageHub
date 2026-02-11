/**
 * Check Facebook Token Permissions
 * Run this in browser console to see exactly what permissions you have
 */

window.checkFacebookPermissions = async function() {
    console.log('🔐 Checking Facebook Token Permissions...');
    
    const token = localStorage.getItem('facebook_access_token');
    if (!token) {
        console.log('❌ No token found - connect Facebook first');
        return;
    }
    
    console.log('🔑 Token found:', token.substring(0, 20) + '...');
    
    try {
        // Check permissions
        const permsResponse = await fetch(`https://graph.facebook.com/v21.0/me/permissions?access_token=${token}`);
        const permsData = await permsResponse.json();
        
        console.log('📋 Full Permissions Response:', permsData);
        
        if (permsData.error) {
            console.log('❌ Error checking permissions:', permsData.error);
            return;
        }
        
        const permissions = permsData.data || [];
        console.log(`🔐 Total permissions: ${permissions.length}`);
        
        // Check for critical permissions
        const criticalPerms = ['pages_show_list', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish'];
        
        console.log('\n🔍 CRITICAL PERMISSIONS CHECK:');
        criticalPerms.forEach(perm => {
            const hasPermission = permissions.some(p => p.permission === perm && p.status === 'granted');
            console.log(`${hasPermission ? '✅' : '❌'} ${perm}: ${hasPermission ? 'GRANTED' : 'MISSING'}`);
        });
        
        console.log('\n📄 ALL PERMISSIONS:');
        permissions.forEach(p => {
            console.log(`   ${p.permission}: ${p.status}`);
        });
        
        // Check if pages_show_list is missing
        const hasPagesPermission = permissions.some(p => p.permission === 'pages_show_list' && p.status === 'granted');
        
        if (!hasPagesPermission) {
            console.log('\n❌ DIAGNOSIS: MISSING pages_show_list PERMISSION!');
            console.log('🔧 SOLUTION:');
            console.log('   1. Disconnect current Facebook connection');
            console.log('   2. Click "Connect Facebook" again');
            console.log('   3. Make sure to grant ALL requested permissions');
            console.log('   4. pages_show_list is REQUIRED to access Facebook Pages');
        } else {
            console.log('\n✅ pages_show_list permission found!');
            
            // If permissions are OK, check what accounts are returned
            console.log('\n📄 Testing /me/accounts with proper permissions...');
            try {
                const accountsResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${token}`);
                const accountsData = await accountsResponse.json();
                console.log('📋 Accounts Response:', accountsData);
                
                if (accountsData.data && accountsData.data.length > 0) {
                    console.log(`✅ Found ${accountsData.data.length} accounts/pages`);
                    accountsData.data.forEach((item, i) => {
                        console.log(`\n📄 Item ${i+1}:`);
                        console.log(`   Name: ${item.name}`);
                        console.log(`   Category: ${item.category || 'NO CATEGORY'}`);
                        console.log(`   Has Instagram: ${item.instagram_business_account ? '✅' : '❌'}`);
                    });
                } else {
                    console.log('❌ No accounts returned - even with proper permissions');
                    console.log('💡 This means:');
                    console.log('   1. You have no Facebook Pages');
                    console.log('   2. Pages exist but you\'re not an admin');
                    console.log('   3. Pages are restricted/inactive');
                }
            } catch (error) {
                console.log('❌ Error checking accounts:', error);
            }
        }
        
    } catch (error) {
        console.log('❌ Permission check failed:', error);
    }
};

console.log('🔐 Permission checker loaded');
console.log('💡 Run: checkFacebookPermissions()');
