import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

/** Publish message to one social account (server-side, no CORS). Facebook: Page or personal profile (me/feed). */
async function publishOne(
  platform: string,
  account: { account_id: string; access_token: string },
  content: string
): Promise<{ ok: boolean; platform: string; error?: string }> {
  const p = (platform || '').toLowerCase();
  if (!account?.access_token) return { ok: false, platform: p, error: 'No token' };
  try {
    if (p === 'facebook') {
      const isProfile = (account.account_id || '').startsWith('profile_');
      const feedUrl = isProfile
        ? 'https://graph.facebook.com/v21.0/me/feed'
        : `https://graph.facebook.com/v21.0/${account.account_id}/feed`;
      const res = await fetch(feedUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, access_token: account.access_token }),
      });
      const data = await res.json();
      if (data?.error) return { ok: false, platform: p, error: data.error.message };
      return { ok: true, platform: p };
    }
    if (p === 'twitter') {
      const res = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${account.access_token}` },
        body: JSON.stringify({ text: content.slice(0, 280) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, platform: p, error: (data as any)?.detail || res.statusText };
      return { ok: true, platform: p };
    }
    if (p === 'linkedin') {
      const authorUrn = (account.account_id || '').startsWith('urn:') ? account.account_id : `urn:li:person:${account.account_id}`;
      const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
          Authorization: `Bearer ${account.access_token}`,
        },
        body: JSON.stringify({
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': { shareCommentary: { text: content }, shareMediaCategory: 'NONE' },
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, platform: p, error: (data as any)?.message || res.statusText };
      return { ok: true, platform: p };
    }
    if (p === 'youtube') return { ok: false, platform: p, error: 'YouTube does not support text posts' };
    return { ok: false, platform: p, error: 'Unsupported platform' };
  } catch (e: any) {
    return { ok: false, platform: p, error: e?.message || 'Request failed' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: 'Supabase not configured' });

  const { campaignId, message } = (req.body || {}) as { campaignId?: string; message?: string };
  if (!campaignId || !message?.trim()) return res.status(400).json({ error: 'Missing campaignId or message' });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: campaign, error: campError } = await supabase.from('campaigns').select('workspace_id').eq('id', campaignId).single();
  if (campError || !campaign) return res.status(404).json({ error: 'Campaign not found' });

  const { data: links } = await supabase.from('campaign_social_accounts').select('social_account_id').eq('campaign_id', campaignId);
  if (!links?.length) return res.status(200).json({ succeeded: [], failed: [], message: 'No linked accounts' });

  const accountIds = links.map((l: any) => l.social_account_id);
  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('id, platform, account_id, access_token')
    .eq('workspace_id', campaign.workspace_id)
    .in('id', accountIds)
    .eq('is_active', true);

  const results = await Promise.all((accounts || []).map((acc: any) => publishOne(acc.platform, acc, message)));
  const succeeded = results.filter((r) => r.ok).map((r) => r.platform);
  const failed = results.filter((r) => !r.ok).map((r) => ({ platform: r.platform, error: r.error }));

  return res.status(200).json({ succeeded, failed });
}
