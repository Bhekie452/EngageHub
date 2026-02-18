// Test TikTok credentials in Vercel
// Run with: node scripts/test-tiktok-vercel.js

import https from 'https';

const VERCEL_URL = 'engage-hub-ten.vercel.app';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: VERCEL_URL,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`\n=== ${path} ===`);
        console.log('Status:', res.statusCode);
        console.log('Headers:', JSON.stringify(res.headers, null, 2));
        console.log('Body:', data.substring(0, 2000));
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', (error) => {
      console.error(`Error for ${path}:`, error.message);
      reject(error);
    });

    req.end();
  });
}

async function testTikTokEnv() {
  console.log('Testing TikTok environment variables in Vercel...\n');
  
  // Test the TikTok connection test endpoint
  await makeRequest('/api/tiktok-connection-test');
  
  // Also test OAuth endpoint with a fake code to see error handling
  await makeRequest('/api/oauth?provider=tiktok&action=token');
}

testTikTokEnv().catch(console.error);
