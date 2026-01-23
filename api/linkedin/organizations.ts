import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * LinkedIn Organizations API Endpoint
 * 
 * This endpoint securely fetches LinkedIn organizations (Company Pages)
 * from the server-side to avoid CORS issues.
 * 
 * POST /api/linkedin/organizations
 * Body: { accessToken: string }
 * 
 * NOTE: This requires r_organization_social permission which needs Marketing Developer Platform (partner-only)
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

    // NOTE: This endpoint requires r_organization_social which is partner-only
    // For now, return empty array
    // Uncomment below when you have partner access:
    
    /*
    const response = await fetch(
      `https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget~))`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('LinkedIn organizations API error:', {
        status: response.status,
        statusText: response.statusText,
        error: data
      });
      return res.status(response.status).json({ 
        error: data.error || 'Failed to fetch organizations',
        message: data.message || data.error_description || 'Failed to fetch LinkedIn organizations',
        details: data
      });
    }

    return res.status(200).json({ elements: data.elements || [] });
    */

    // For now, return empty array (requires Marketing Developer Platform)
    console.info('LinkedIn organization access requires Marketing Developer Platform (partner-only). Returning empty array.');
    return res.status(200).json({ elements: [] });

  } catch (error: any) {
    console.error('LinkedIn organizations API error:', error);
    // Return empty array on error (user might only have personal profile)
    return res.status(200).json({ elements: [] });
  }
}
