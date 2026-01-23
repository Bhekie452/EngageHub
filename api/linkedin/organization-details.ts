import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * LinkedIn Organization Details API Endpoint
 * 
 * This endpoint securely fetches LinkedIn organization details
 * from the server-side to avoid CORS issues.
 * 
 * POST /api/linkedin/organization-details
 * Body: { accessToken: string, organizationUrn: string }
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
    const { accessToken, organizationUrn } = req.body;

    // Validate required parameters
    if (!accessToken) {
      return res.status(400).json({ 
        error: 'Missing accessToken',
        message: 'Access token is required'
      });
    }

    if (!organizationUrn) {
      return res.status(400).json({ 
        error: 'Missing organizationUrn',
        message: 'Organization URN is required'
      });
    }

    // Extract organization ID from URN (format: urn:li:organization:123456)
    const orgId = organizationUrn.split(':').pop();

    // Call LinkedIn API from server-side (no CORS issues)
    const response = await fetch(
      `https://api.linkedin.com/v2/organizations/${orgId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();

    // Handle LinkedIn API errors
    if (!response.ok) {
      console.error('LinkedIn organization details API error:', {
        status: response.status,
        statusText: response.statusText,
        error: data
      });
      return res.status(response.status).json({ 
        error: data.error || 'Failed to fetch organization details',
        message: data.message || data.error_description || 'Failed to fetch LinkedIn organization details',
        details: data
      });
    }

    // Return success response
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('LinkedIn organization details API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred while fetching LinkedIn organization details'
    });
  }
}
