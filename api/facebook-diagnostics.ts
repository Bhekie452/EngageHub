import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📋 Facebook diagnostics request');

    // Check environment variables
    const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID;
    const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
    const FACEBOOK_LONG_TERM_TOKEN = process.env.FACEBOOK_LONG_TERM_TOKEN;

    const environment = {
      FACEBOOK_APP_ID: {
        exists: !!FACEBOOK_APP_ID,
        value: FACEBOOK_APP_ID ? `${FACEBOOK_APP_ID.substring(0, 8)}...` : 'NOT SET',
        length: FACEBOOK_APP_ID?.length || 0
      },
      FACEBOOK_APP_SECRET: {
        exists: !!FACEBOOK_APP_SECRET,
        value: FACEBOOK_APP_SECRET ? `***${FACEBOOK_APP_SECRET.slice(-4)}` : 'NOT SET',
        length: FACEBOOK_APP_SECRET?.length || 0
      },
      FACEBOOK_LONG_TERM_TOKEN: {
        exists: !!FACEBOOK_LONG_TERM_TOKEN,
        value: FACEBOOK_LONG_TERM_TOKEN ? `***${FACEBOOK_LONG_TERM_TOKEN.slice(-4)}` : 'NOT SET',
        length: FACEBOOK_LONG_TERM_TOKEN?.length || 0
      }
    };

    const recommendations = [];

    if (!FACEBOOK_APP_ID) {
      recommendations.push('❌ Set FACEBOOK_APP_ID in Vercel environment variables');
    } else {
      recommendations.push('✅ FACEBOOK_APP_ID is set');
    }

    if (!FACEBOOK_APP_SECRET) {
      recommendations.push('❌ Set FACEBOOK_APP_SECRET in Vercel environment variables');
    } else {
      recommendations.push('✅ FACEBOOK_APP_SECRET is set');
    }

    if (!FACEBOOK_LONG_TERM_TOKEN) {
      recommendations.push('⚠️ FACEBOOK_LONG_TERM_TOKEN not set (optional, for GET requests)');
    } else {
      recommendations.push('✅ FACEBOOK_LONG_TERM_TOKEN is set (optional)');
    }

    // Test Facebook API connectivity
    let facebookApiTest = null;
    if (FACEBOOK_APP_ID) {
      try {
        console.log('📡 Testing Facebook API connectivity...');
        const testUrl = `https://graph.facebook.com/v21.0/${FACEBOOK_APP_ID}?fields=id,name`;
        const testResponse = await fetch(testUrl);
        const testData = await testResponse.json();
        
        facebookApiTest = {
          reachable: testResponse.ok,
          status: testResponse.status,
          hasData: !!testData.id,
          appName: testData.name || 'Unknown',
          error: testData.error?.message || null
        };

        if (testResponse.ok && testData.id) {
          recommendations.push('✅ Facebook API is reachable and app is valid');
        } else {
          recommendations.push('❌ Facebook API test failed - check app ID and permissions');
        }
      } catch (error: any) {
        facebookApiTest = {
          reachable: false,
          status: 0,
          hasData: false,
          appName: null,
          error: error.message
        };
        recommendations.push('❌ Facebook API unreachable - check network connectivity');
      }
    }

    // Get deployment info
    const deployment = {
      vercelEnv: process.env.VERCEL_ENV || 'unknown',
      nodeEnv: process.env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString(),
      region: process.env.VERCEL_REGION || 'unknown'
    };

    const diagnostics = {
      success: true,
      environment,
      recommendations,
      facebookApiTest,
      deployment,
      nextSteps: [
        '1. Ensure all required environment variables are set in Vercel',
        '2. Update Facebook App settings with correct redirect URIs',
        '3. Test OAuth flow end-to-end',
        '4. Check Vercel function logs for detailed error messages'
      ]
    };

    console.log('✅ Facebook diagnostics completed');
    return res.status(200).json(diagnostics);

  } catch (error: any) {
    console.error('❌ Facebook diagnostics failed:', error);
    return res.status(500).json({ 
      error: 'Diagnostics failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
