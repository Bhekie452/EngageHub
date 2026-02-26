import { supabase } from '../../lib/supabase';
import type { Contact } from './contacts.service';

export interface UnharvestedEngager {
  platform_user_id: string;
  platform: string;
  name: string | null;
  profile_url: string | null;
  engagement_count: number;
  last_engagement: string;
  first_engagement: string;
  action_types: string[];
}

export interface EngagementStats {
  total_engagements: number;
  comments_count: number;
  likes_count: number;
  shares_count: number;
  last_engagement: string | null;
  days_since_engagement: number | null;
  platforms_engaged: string[];
}

export const engagementHarvestService = {
  /**
   * Get unharvested engagers (social users who engaged but aren't contacts yet)
   */
  async getUnharvestedEngagers(): Promise<UnharvestedEngager[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get workspace
    const { data: workspaceData } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!workspaceData) return [];

    // Query unharvested engagers view
    const { data, error } = await supabase
      .from('unharvested_engagers')
      .select('*')
      .eq('workspace_id', workspaceData.id)
      .order('engagement_count', { ascending: false })
      .limit(50);

    if (error) {
      // View might not exist yet, fall back to direct query silently
      return this.getUnharvestedEngagersFallback(workspaceData.id);
    }

    return data || [];
  },

  /**
   * Fallback query if the view doesn't exist
   */
  async getUnharvestedEngagersFallback(workspaceId: string): Promise<UnharvestedEngager[]> {
    // Get all engagement actions with user info
    const { data: engagements, error } = await supabase
      .from('engagement_actions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('source', 'native')
      .in('action_type', ['comment', 'like', 'share', 'subscribe', 'view'])
      .order('created_at', { ascending: false })
      .limit(500);

    if (error || !engagements) {
      console.log('[Harvest] Fallback query error:', error?.message, 'rows:', engagements?.length);
      return [];
    }
    
    console.log('[Harvest] Found engagement_actions rows:', engagements.length);

    // Get existing contacts with platform_user_id
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('platform_user_id, platform')
      .eq('workspace_id', workspaceId)
      .not('platform_user_id', 'is', null);

    const existingSet = new Set(
      (existingContacts || []).map(c => `${c.platform}:${c.platform_user_id}`)
    );

    // Aggregate unique engagers
    const engagerMap = new Map<string, UnharvestedEngager>();
    
    for (const eng of engagements) {
      const platformUserId = eng.action_data?.from_id || eng.platform_user_id;
      if (!platformUserId) continue;

      const key = `${eng.platform}:${platformUserId}`;
      
      // Skip if already a contact
      if (existingSet.has(key)) continue;

      const existing = engagerMap.get(key);
      if (existing) {
        existing.engagement_count++;
        if (!existing.action_types.includes(eng.action_type)) {
          existing.action_types.push(eng.action_type);
        }
        if (new Date(eng.created_at) > new Date(existing.last_engagement)) {
          existing.last_engagement = eng.created_at;
        }
        if (new Date(eng.created_at) < new Date(existing.first_engagement)) {
          existing.first_engagement = eng.created_at;
        }
      } else {
        engagerMap.set(key, {
          platform_user_id: platformUserId,
          platform: eng.platform,
          name: eng.action_data?.from_name || null,
          profile_url: eng.action_data?.profile_url || null,
          engagement_count: 1,
          last_engagement: eng.created_at,
          first_engagement: eng.created_at,
          action_types: [eng.action_type],
        });
      }
    }

    // Sort by engagement count
    return Array.from(engagerMap.values())
      .sort((a, b) => b.engagement_count - a.engagement_count);
  },

  /**
   * Sync all unharvested engagers to contacts (on-demand)
   */
  async syncEngagers(): Promise<{ added: number; updated: number; message?: string }> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return { added: 0, updated: 0, message: 'Not authenticated' };
    }

    // Get workspace
    const { data: workspaceData, error: wsError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (wsError || !workspaceData) {
      console.error('Workspace error:', wsError);
      return { added: 0, updated: 0, message: 'No workspace found' };
    }

    // === DIAGNOSTIC: Check what's actually in engagement_actions ===
    const { data: eaCount, error: eaCountErr } = await supabase
      .from('engagement_actions')
      .select('id, platform, action_type, source, platform_user_id, action_data', { count: 'exact' })
      .eq('workspace_id', workspaceData.id)
      .limit(10);
    
    console.log('=== ENGAGEMENT_ACTIONS DIAGNOSTIC ===');
    console.log('Total rows in engagement_actions:', eaCount?.length ?? 0, 'error:', eaCountErr?.message || 'none');
    if (eaCount && eaCount.length > 0) {
      console.log('Sample rows:', eaCount.map(r => ({
        platform: r.platform,
        action_type: r.action_type,
        source: r.source,
        platform_user_id: r.platform_user_id,
        from_name: r.action_data?.from_name,
      })));
    }
    
    const { data: nativeCount } = await supabase
      .from('engagement_actions')
      .select('id', { count: 'exact' })
      .eq('workspace_id', workspaceData.id)
      .eq('source', 'native');
    
    console.log('Rows with source=native:', nativeCount?.length ?? 0);
    console.log('=== END DIAGNOSTIC ===');

    // Always use JavaScript fallback - it's more reliable than the DB function
    console.log('Using JS fallback for sync engagers');
    const unharvested = await this.getUnharvestedEngagersFallback(workspaceData.id);
    console.log('Found unharvested engagers:', unharvested.length);
    
    if (unharvested.length === 0) {
      return { added: 0, updated: 0, message: `No unharvested engagers found. engagement_actions has ${eaCount?.length ?? 0} rows (${nativeCount?.length ?? 0} native). Open a post in Analytics and click "Fetch Post Metrics" first to store comments.` };
    }
    
    let added = 0;
    let updated = 0;

    for (const engager of unharvested) {
      try {
        const nameParts = (engager.name || '').split(' ');
        const firstName = nameParts[0] || `Social`;
        const lastName = nameParts.slice(1).join(' ') || `User ${engager.platform_user_id.slice(0, 8)}`;
        
        // First, try insert with all harvesting columns
        let { error: insertError } = await supabase
          .from('contacts')
          .insert({
            workspace_id: workspaceData.id,
            created_by: user.id,
            first_name: firstName,
            last_name: lastName,
            platform_user_id: engager.platform_user_id,
            platform: engager.platform,
            profile_url: engager.profile_url,
            type: 'lead',
            status: 'new',
            lead_source: 'social_media',
            lifecycle_stage: 'subscriber',
            engagement_count: engager.engagement_count,
            last_engagement_at: engager.last_engagement,
            harvested_from_engagement: true,
            notes: `Auto-harvested from ${engager.platform} engagement. Actions: ${engager.action_types.join(', ')}`,
          });

        // If harvesting columns don't exist, try basic insert
        if (insertError && (insertError.message?.includes('column') || insertError.code === '42703')) {
          console.log('Harvesting columns not found, using basic insert. Error was:', insertError.message);
          const { error: basicError } = await supabase
            .from('contacts')
            .insert({
              workspace_id: workspaceData.id,
              created_by: user.id,
              first_name: firstName,
              last_name: lastName,
              type: 'lead',
              status: 'new',
              lead_source: 'social_media',
              notes: `Auto-harvested from ${engager.platform} (${engager.platform_user_id}). Actions: ${engager.action_types.join(', ')}`,
            });
          insertError = basicError;
        }

        if (!insertError) {
          added++;
          console.log('[Harvest] Added contact:', firstName, lastName, 'from', engager.platform);
        } else {
          console.error('Insert error for engager:', insertError.message, insertError.code, insertError.details);
        }
      } catch (e) {
        console.error('Error adding engager as contact:', e);
      }
    }

    return { added, updated };
  },

  /**
   * Add a single engager as a contact
   */
  async harvestEngager(engager: UnharvestedEngager): Promise<Contact | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: workspaceData } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!workspaceData) throw new Error('No workspace found');

    // Try with all columns first
    const nameParts = (engager.name || '').split(' ');
    const firstName = nameParts[0] || `Social`;
    const lastName = nameParts.slice(1).join(' ') || `User ${engager.platform_user_id.slice(0, 8)}`;
    
    let { data, error } = await supabase
      .from('contacts')
      .insert({
        workspace_id: workspaceData.id,
        created_by: user.id,
        first_name: firstName,
        last_name: lastName,
        platform_user_id: engager.platform_user_id,
        platform: engager.platform,
        profile_url: engager.profile_url,
        type: 'lead',
        status: 'new',
        lead_source: 'social_media',
        lifecycle_stage: 'subscriber',
        engagement_count: engager.engagement_count,
        last_engagement_at: engager.last_engagement,
        harvested_from_engagement: true,
        notes: `Auto-harvested from ${engager.platform} engagement. Actions: ${engager.action_types.join(', ')}`,
      })
      .select()
      .single();

    // If columns don't exist, try basic insert
    if (error && (error.message?.includes('column') || error.code === '42703')) {
      console.log('Harvesting columns not found, using basic insert');
      const result = await supabase
        .from('contacts')
        .insert({
          workspace_id: workspaceData.id,
          created_by: user.id,
          first_name: firstName,
          last_name: lastName,
          type: 'lead',
          status: 'new',
          lead_source: 'social_media',
          notes: `Auto-harvested from ${engager.platform} (${engager.platform_user_id}). Actions: ${engager.action_types.join(', ')}`,
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error harvesting engager:', error);
      throw error;
    }

    return data;
  },

  /**
   * Get engagement stats for a contact (for lead scoring)
   */
  async getContactEngagementStats(contactId: string): Promise<EngagementStats | null> {
    // Try database function first
    try {
      const { data, error } = await supabase.rpc('get_contact_engagement_stats', {
        p_contact_id: contactId
      });

      if (!error && data && data.length > 0) {
        return data[0];
      }
    } catch (e) {
      // Function doesn't exist, use fallback
    }

    // Fallback: query directly
    const { data: contact } = await supabase
      .from('contacts')
      .select('workspace_id, platform, platform_user_id')
      .eq('id', contactId)
      .single();

    if (!contact || !contact.platform_user_id) {
      return null;
    }

    const { data: engagements } = await supabase
      .from('engagement_actions')
      .select('action_type, created_at')
      .eq('workspace_id', contact.workspace_id)
      .eq('platform', contact.platform)
      .or(`platform_user_id.eq.${contact.platform_user_id},action_data->>from_id.eq.${contact.platform_user_id}`);

    if (!engagements || engagements.length === 0) {
      return {
        total_engagements: 0,
        comments_count: 0,
        likes_count: 0,
        shares_count: 0,
        last_engagement: null,
        days_since_engagement: null,
        platforms_engaged: [],
      };
    }

    const stats: EngagementStats = {
      total_engagements: engagements.length,
      comments_count: engagements.filter(e => e.action_type === 'comment').length,
      likes_count: engagements.filter(e => e.action_type === 'like').length,
      shares_count: engagements.filter(e => ['share', 'repost'].includes(e.action_type)).length,
      last_engagement: engagements.reduce((latest, e) => 
        new Date(e.created_at) > new Date(latest) ? e.created_at : latest, 
        engagements[0].created_at
      ),
      days_since_engagement: null,
      platforms_engaged: [contact.platform],
    };

    if (stats.last_engagement) {
      stats.days_since_engagement = Math.floor(
        (Date.now() - new Date(stats.last_engagement).getTime()) / 86400000
      );
    }

    return stats;
  },

  /**
   * Get top engaged contacts (for dashboard)
   */
  async getTopEngagedContacts(limit = 10): Promise<Contact[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: workspaceData } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!workspaceData) return [];

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspaceData.id)
      .eq('harvested_from_engagement', true)
      .order('engagement_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching top engaged contacts:', error);
      return [];
    }

    return data || [];
  },
};

export default engagementHarvestService;
