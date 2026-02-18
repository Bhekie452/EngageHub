import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state } = req.query;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('[facebook-callback] Received callback with code:', !!code);

  if (!code) {
    const error = req.query.error as string;
    const errorDescription = req.query.error_description as string;
    console.error('[facebook-callback] Error:', error, errorDescription);
    return res.redirect(`/social-media?error=${encodeURIComponent(error || 'OAuth error')}`);
  }

  // Parse state to get workspaceId
  let workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
  try {
    if (state) {
      const stateData = JSON.parse(state as string);
      workspaceId = stateData.workspaceId || workspaceId;
    }
  } catch (e) {
    console.log('[facebook-callback] Could not parse state:', e);
  }

  // Redirect to frontend with the code
  // The frontend will then exchange the code for a token
  return res.redirect(`/social-media?facebook_code=${code}&workspaceId=${workspaceId}`);
}
