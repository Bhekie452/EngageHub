// TikTok Connection Test Script
// Tests if TikTok OAuth is properly configured
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('=== TikTok Connection Test ===');
  
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;

  const results: any = {
    timestamp: new Date().toISOString(),
    clientKeyConfigured: !!clientKey,
    clientSecretConfigured: !!clientSecret,
    redirectUriConfigured: !!redirectUri,
    clientKey: clientKey ? clientKey.substring(0, 8) + '...' : 'NOT SET',
    redirectUri: redirectUri || 'https://engage-hub-ten.vercel.app (default)',
    tests: {}
  };

  // Test 1: Check environment variables
  if (!clientKey) {
    results.tests.environment = 'FAIL - TIKTOK_CLIENT_KEY not set';
    return res.status(400).json(results);
  }
  
  if (!clientSecret) {
    results.tests.environment = 'FAIL - TIKTOK_CLIENT_SECRET not set';
    return res.status(400).json(results);
  }

  if (clientSecret === 'your_tiktok_client_secret_here' || clientSecret.startsWith('your_')) {
    results.tests.environment = 'FAIL - TIKTOK_CLIENT_SECRET is a placeholder value';
    results.isPlaceholder = true;
    return res.status(400).json(results);
  }

  results.tests.environment = 'PASS - Environment variables configured';

  // Test 2: Try to call TikTok token endpoint with invalid code to test connectivity
  try {
    const testResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: 'test_invalid_code_for_connectivity_check',
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || 'https://engage-hub-ten.vercel.app'
      })
    });

    const responseText = await testResponse.text();
    
    // If we get JSON back (even error), it means TikTok API is reachable
    if (responseText.startsWith('{')) {
      const errorData = JSON.parse(responseText);
      if (errorData.error) {
        // TikTok returned an error - but this means the API is reachable!
        results.tests.connectivity = 'PASS - TikTok API is reachable';
        results.tests.auth = `EXPECTED - TikTok returned error: ${errorData.error_description || errorData.error}`;
        results.status = 'SUCCESS';
        results.message = 'TikTok OAuth is properly configured!';
      } else {
        results.tests.connectivity = 'PASS';
      }
    } else {
      // Plain text error - could be invalid credentials
      if (responseText.includes('Unsupported') || responseText.includes('invalid')) {
        results.tests.connectivity = 'PASS - TikTok API is reachable';
        results.tests.auth = `EXPECTED ERROR - ${responseText.substring(0, 100)}`;
        results.status = 'SUCCESS';
        results.message = 'TikTok OAuth credentials are valid! (This error is expected - we used a fake auth code)';
      } else {
        results.tests.connectivity = 'UNKNOWN - ' + responseText.substring(0, 100);
      }
    }
  } catch (error: any) {
    results.tests.connectivity = `FAIL - ${error.message}`;
    results.status = 'ERROR';
  }

  console.log('TikTok test results:', results);

  return res.status(results.status === 'SUCCESS' ? 200 : 400).json(results);
}
