import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getWorkspaceOwner(workspaceId: string): Promise<string> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single();

  if (error || !data) {
    throw new Error('Workspace not found');
  }

  return data.owner_id;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    workspaceId,
    platform,
    accountId,
    username,
    displayName,
    accessToken,
    platformData,
  } = req.body;

  // Validation
  if (!workspaceId || !platform || !accountId || !accessToken) {
    return res.status(400).json({
      error: 'Missing required fields',
      details: 'workspaceId, platform, accountId, and accessToken are required',
    });
  }

  try {
    const ownerId = await getWorkspaceOwner(workspaceId);

    // Upsert social account connection
    const { data, error } = await supabase
      .from('social_accounts')
      .upsert(
        {
          workspace_id: workspaceId,
          connected_by: ownerId,
          platform: platform,
          account_type: platform === 'instagram' ? 'business' : 'page',
          account_id: accountId,
          username: username || accountId,
          display_name: displayName || username || accountId,
          access_token: accessToken,
          platform_data: platformData || {},
          is_active: true,
          connection_status: 'connected',
          last_sync_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id,platform,account_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        error: 'Failed to save connection',
        details: error.message,
      });
    }

    console.log('✅ Social account connected:', {
      platform,
      accountId,
      username,
      workspaceId,
    });

    return res.status(200).json({
      success: true,
      account: data,
      message: `Successfully connected ${platform}: ${username || accountId}`,
    });
  } catch (error: any) {
    console.error('❌ Connection error:', error);
    return res.status(500).json({
      error: 'Connection failed',
      details: error.message,
    });
  }
}
