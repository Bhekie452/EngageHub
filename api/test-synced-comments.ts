import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Get platform from query param, default to youtube
    const platform = (req.query.platform as string) || 'youtube';
    const limit = parseInt(req.query.limit as string) || 10;

    const { data, error } = await supabase
      .from('engagement_actions')
      .select('id, action_type, action_data, source, platform, platform_post_id, created_at')
      .eq('platform', platform.toLowerCase())
      .eq('action_type', 'comment')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      platform,
      count: data?.length || 0,
      comments: data
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
