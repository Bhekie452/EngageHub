const fetch = require('node-fetch');

// Usage: node scripts/debug-facebook-token.js <ACCESS_TOKEN>
const token = process.argv[2];

if (!token) {
    console.error('Please provide an access token as an argument.');
    console.log('Usage: node scripts/debug-facebook-token.js <ACCESS_TOKEN>');
    process.exit(1);
}

async function debugToken() {
    console.log('🔍 Debugging Facebook Token...');
    console.log(`🔑 Token: ${token.substring(0, 10)}...`);

    try {
        // 1. Check /me
        console.log('\nTesting /me endpoint...');
        const meResp = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${token}`);
        const meData = await meResp.json();
        console.log('👤 Me:', meData);

        if (meData.error) {
            console.error('❌ Token invalid:', meData.error);
            return;
        }

        // 2. Check permissions
        console.log('\nChecking permissions...');
        const permResp = await fetch(`https://graph.facebook.com/v21.0/me/permissions?access_token=${token}`);
        const permData = await permResp.json();

        if (permData.data) {
            console.log('🔐 Permissions:');
            permData.data.forEach(p => console.log(`   - ${p.permission}: ${p.status}`));

            const hasPagesShowList = permData.data.some(p => p.permission === 'pages_show_list' && p.status === 'granted');
            if (!hasPagesShowList) {
                console.error('\n❌ CRITICAL: pages_show_list permission is MISSING!');
            } else {
                console.log('\n✅ pages_show_list permission is present.');
            }
        } else {
            console.error('❌ Failed to fetch permissions:', permData);
        }

        // 3. Check accounts
        console.log('\nFetching accounts...');
        const accResp = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${token}`);
        const accData = await accResp.json();

        console.log('📋 Accounts Response:', JSON.stringify(accData, null, 2));

    } catch (error) {
        console.error('❌ Error during debug:', error);
    }
}

debugToken();
