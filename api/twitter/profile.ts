import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Twitter/X Profile Fetch Endpoint
 * 
 * This endpoint securely fetches Twitter user profile information,
 * avoiding CORS issues by proxying the call to Twitter API.
 * 
 * POST /api/twitter/profile
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
  if (req.method === 'OPTIONS') {
    setCORSHeaders(req, res);
    return res.status(200).end();
  }

  setCORSHeaders(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ 
        error: 'Missing accessToken',
        message: 'Access token is required'
      });
    }

    // Fetch user profile from Twitter API v2
    const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name,description', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twitter profile fetch error:', {
        status: response.status,
        statusText: response.statusText,
        error: data
      });
      return res.status(response.status).json({ 
        error: data.error || 'Failed to fetch Twitter profile',
        message: data.detail || data.title || 'Failed to fetch Twitter profile',
        details: data
      });
    }

    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Twitter profile fetch error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred while fetching Twitter profile'
    });
  }
}
