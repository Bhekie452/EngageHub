/**
 * Vercel Facebook Environment Checker
 * Run with: node check-vercel-facebook.cjs
 */

const https = require('https');

const VERCEL_URL = 'https://engage-hub-ten.vercel.app';

console.log('🔍 Checking Vercel Facebook Integration Status\n');
console.log('=' .repeat(60));

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

async function main() {
  console.log(`\n1️⃣ Checking Vercel Site Availability...`);
  try {
    const siteResponse = await makeRequest(VERCEL_URL);
    console.log(`   ✅ Site is accessible: ${VERCEL_URL}`);
    console.log(`   Status: ${siteResponse.statusCode}`);
  } catch (error) {
    console.log(`   ❌ Site not accessible: ${error.message}`);
    process.exit(1);
  }

  console.log(`\n2️⃣ Checking Facebook OAuth Endpoint...`);
  const oauthUrl = `${VERCEL_URL}/api/facebook-auth?action=auth`;
  try {
    const oauthResponse = await makeRequest(oauthUrl);
    console.log(`   URL: ${oauthUrl}`);
    console.log(`   Status: ${oauthResponse.statusCode}`);
    
    if (oauthResponse.statusCode === 302) {
      const location = oauthResponse.headers.location || '';
      console.log(`   ✅ Redirecting to Facebook OAuth`);
      console.log(`   Location: ${location.substring(0, 80)}...`);
      
      if (location.includes('facebook.com')) {
        console.log(`   ✅ Facebook OAuth URL is correct`);
        
        // Extract and show client_id
        const clientIdMatch = location.match(/client_id=([^&]+)/);
        if (clientIdMatch) {
          console.log(`   ✅ Client ID: ${clientIdMatch[1]}`);
        }
        
        // Check redirect URI
        const redirectMatch = location.match(/redirect_uri=([^&]+)/);
        if (redirectMatch) {
          const decodedRedirect = decodeURIComponent(redirectMatch[1]);
          console.log(`   ✅ Redirect URI: ${decodedRedirect}`);
          
          if (decodedRedirect.includes('engage-hub-ten.vercel.app')) {
            console.log(`   ✅ Production redirect URI configured!`);
          }
        }
      }
    } else if (oauthResponse.statusCode === 500) {
      console.log(`   ❌ Server Error (500)`);
      console.log(`   Response: ${oauthResponse.body.substring(0, 300)}`);
      console.log(`\n   ⚠️  This means FACEBOOK_APP_ID or FACEBOOK_APP_SECRET`);
      console.log(`      is NOT set in Vercel Environment Variables!`);
    } else if (oauthResponse.statusCode === 404) {
      console.log(`   ❌ API route not found (404)`);
      console.log(`   Response: ${oauthResponse.body.substring(0, 200)}`);
    } else if (oauthResponse.statusCode === 200) {
      console.log(`   ⚠️  Got HTML response instead of redirect`);
      console.log(`   This might mean the route is being caught by the React app`);
    } else {
      console.log(`   Response: ${oauthResponse.body.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log(`\n3️⃣ Checking Token Exchange Endpoint...`);
  const tokenUrl = `${VERCEL_URL}/api/facebook-auth?action=token`;
  try {
    const tokenResponse = await makeRequest(tokenUrl, 'POST');
    console.log(`   URL: ${tokenUrl}`);
    console.log(`   Status: ${tokenResponse.statusCode}`);
    
    if (tokenResponse.statusCode === 400) {
      console.log(`   ✅ Token endpoint is reachable (needs code parameter)`);
    } else if (tokenResponse.statusCode === 500) {
      console.log(`   ❌ Server Error - FACEBOOK_APP_SECRET may not be set`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📋 SUMMARY:\n');
  
  console.log('To fix Facebook connection on Vercel, you need to:');
  console.log('');
  console.log('1. Go to: https://vercel.com/dashboard');
  console.log('2. Select your project: engage-hub-ten');
  console.log('3. Go to Settings → Environment Variables');
  console.log('');
  console.log('4. Add these variables (ALL environments: Production, Preview, Development):');
  console.log('');
  console.log('   ┌─────────────────────────────────────────────┐');
  console.log('   │ Name                  │ Value              │');
  console.log('   ├─────────────────────────────────────────────┤');
  console.log('   │ FACEBOOK_APP_ID       │ 2106228116796555  │');
  console.log('   │ FACEBOOK_APP_SECRET   │ (your app secret)  │');
  console.log('   │ VITE_FACEBOOK_APP_ID  │ 2106228116796555  │');
  console.log('   └─────────────────────────────────────────────┘');
  console.log('');
  console.log('   ⚠️  FACEBOOK_APP_SECRET must NOT have VITE_ prefix!');
  console.log('   ⚠️  It should be in Production environment only');
  console.log('');
  console.log('5. After adding variables:');
  console.log('   • Go to Deployments tab');
  console.log('   • Click "Redeploy" on the latest deployment');
  console.log('');
  console.log('6. Test again with: node check-vercel-facebook.cjs');
  
  console.log('\n' + '=' .repeat(60));
}

main().catch(console.error);
