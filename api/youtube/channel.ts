import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * YouTube Channel API Endpoint
 * 
 * This endpoint securely fetches YouTube channel information
 * from the server-side to avoid CORS issues.
 * 
 * POST /api/youtube/channel
 * Body: { accessToken: string }
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://engage-hub-ten.vercel.app',
];

// Helper function to set CORS headers
function setCORSHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin.includes('vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    setCORSHeaders(req, res);
    return res.status(200).end();
  }

  // Set CORS headers for actual request
  setCORSHeaders(req, res);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    const { accessToken } = req.body;

    // Validate required parameters
    if (!accessToken) {
      return res.status(400).json({ 
        error: 'Missing accessToken',
        message: 'Access token is required'
      });
    }

    // First get user info from Google
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.json();
      console.error('Google user info error:', errorData);
      return res.status(userInfoResponse.status).json({ 
        error: 'Failed to fetch user info',
        message: errorData.error?.message || 'Could not retrieve Google user information',
        details: errorData
      });
    }
    
    const userInfo = await userInfoResponse.json();
    
    // Then get YouTube channel info
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!channelResponse.ok) {
      const errorData = await channelResponse.json();
      console.error('YouTube channel API error:', {
        status: channelResponse.status,
        statusText: channelResponse.statusText,
        error: errorData
      });
      return res.status(channelResponse.status).json({ 
        error: errorData.error?.message || 'Failed to fetch YouTube channel',
        message: errorData.error?.message || 'Could not retrieve YouTube channel information',
        details: errorData
      });
    }
    
    const channelData = await channelResponse.json();
    
    console.log('YouTube channel fetched successfully');

    // Return success response
    return res.status(200).json({
      user: userInfo,
      channels: channelData.items || []
    });

  } catch (error: any) {
    console.error('YouTube channel API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred while fetching YouTube channel'
    });
  }
}
