/**
 * TikTok Connection Test Script
 * Tests TikTok OAuth connectivity through Vercel
 * 
 * Run with: node scripts/test-tiktok-vercel.js
 */

const https = require('https');

const VERCEL_URL = 'https://engage-hub-ten.vercel.app';

async function testTikTokConnection() {
  console.log('=== TikTok Connection Test via Vercel ===\n');
  console.log(`Testing endpoint: ${VERCEL_URL}/api/tiktok-connection-test\n`);

  return new Promise((resolve, reject) => {
    const url = new URL('/api/tiktok-connection-test', VERCEL_URL);
    
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:\n');
        
        try {
          const json = JSON.parse(data);
          console.log(JSON.stringify(json, null, 2));
          
          if (json.status === 'SUCCESS') {
            console.log('\n✅ TikTok is properly configured!');
          } else {
            console.log('\n❌ TikTok configuration issue:');
            console.log('   - Check TIKTOK_CLIENT_SECRET in Vercel');
            console.log('   - Check TIKTOK_REDIRECT_URI in Vercel');
          }
        } catch (e) {
          console.log('Raw response:', data);
        }
        
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.error('Request error:', e.message);
      reject(e);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.error('Request timed out');
      reject(new Error('Request timed out'));
    });
  });
}

// Run the test
testTikTokConnection()
  .then(() => {
    console.log('\nTest complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nTest failed:', err);
    process.exit(1);
  });
