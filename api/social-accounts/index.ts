import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { workspaceId } = req.query;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Database configuration missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: accounts, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    return res.status(200).json({
      accounts: accounts || []
    });
  } catch (error: any) {
    console.error('Error fetching social accounts:', error);
    return res.status(500).json({ error: error.message });
  }
}
