/**
 * Debug Vercel API - Get detailed response
 */

const https = require('https');

const VERCEL_URL = 'https://engage-hub-ten.vercel.app';

function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: VERCEL_URL.replace('https://', ''),
      port: 443,
      path: url.replace(VERCEL_URL, ''),
      method: method,
      headers: {
        'Accept': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
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
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testAPI() {
  console.log('Testing API endpoint directly...\n');
  
  // Test GET to auth
  console.log('GET /api/auth?provider=facebook&action=auth');
  const getResp = await makeRequest(`${VERCEL_URL}/api/auth?provider=facebook&action=auth`);
  console.log('Status:', getResp.statusCode);
  console.log('Content-Type:', getResp.headers['content-type']);
  console.log('Body:', getResp.body.substring(0, 500));
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test POST to token
  console.log('POST /api/auth?provider=facebook&action=token');
  const postResp = await makeRequest(
    `${VERCEL_URL}/api/auth?provider=facebook&action=token`,
    'POST',
    { code: 'test' }
  );
  console.log('Status:', postResp.statusCode);
  console.log('Content-Type:', postResp.headers['content-type']);
  console.log('Body:', postResp.body.substring(0, 500));
}

testAPI().catch(console.error);
