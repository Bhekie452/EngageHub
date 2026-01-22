import { supabase } from '../../lib/supabase';

export type TimelineEventType = 
  | 'customer_created'
  | 'lead_source_detected'
  | 'campaign_viewed'
  | 'campaign_clicked'
  | 'social_like'
  | 'social_comment'
  | 'message_sent'
  | 'message_received'
  | 'call_logged'
  | 'call_completed'
  | 'meeting_held'
  | 'task_created'
  | 'task_completed'
  | 'deal_created'
  | 'deal_stage_changed'
  | 'deal_won'
  | 'deal_lost'
  | 'note_added'
  | 'automation_triggered'
  | 'ai_suggestion_used'
  | 'activity_completed';

export interface TimelineEvent {
  id: string;
  event_type: TimelineEventType;
  timestamp: string;
  title: string;
  summary?: string;
  owner_id?: string;
  owner_name?: string;
  contact_id?: string;
  contact_name?: string;
  deal_id?: string;
  deal_title?: string;
  task_id?: string;
  task_title?: string;
  campaign_id?: string;
  campaign_name?: string;
  platform?: string;
  value?: number;
  metadata?: any;
  source?: string;
}

export const timelineService = {
  async getAll(contactId?: string, dealId?: string): Promise<TimelineEvent[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get workspace - handle case where multiple workspaces exist
    const { data: workspaceData, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (workspaceError) {
      console.error('Error fetching workspace for timeline:', workspaceError);
    }

    if (!workspaceData) {
      console.warn('No workspace found for timeline');
      return [];
    }

    const events: TimelineEvent[] = [];

    // 1. Fetch Activities (crm_activities)
    const activitiesQuery = supabase
      .from('crm_activities')
      .select('*')
      .eq('workspace_id', workspaceData.id)
      .order('activity_date', { ascending: false });

    if (contactId) {
      activitiesQuery.eq('contact_id', contactId);
    }

    const { data: activities } = await activitiesQuery;

    if (activities) {
      for (const activity of activities) {
        // Map activity types to timeline event types
        let eventType: TimelineEventType = 'activity_completed';
        if (activity.activity_type === 'call') eventType = 'call_completed';
        else if (activity.activity_type === 'email') eventType = 'message_sent';
        else if (activity.activity_type === 'message') eventType = 'message_received';
        else if (activity.activity_type === 'meeting') eventType = 'meeting_held';
        else if (activity.activity_type === 'note') eventType = 'note_added';

        events.push({
          id: `activity_${activity.id}`,
          event_type: eventType,
          timestamp: activity.activity_date || activity.created_at,
          title: activity.title || `${activity.activity_type} activity`,
          summary: activity.content || activity.subject,
          owner_id: activity.created_by,
          contact_id: activity.contact_id,
          deal_id: activity.deal_id,
          platform: activity.platform,
          value: activity.value,
          metadata: activity.metadata,
        });
      }
    }

    // 2. Fetch Deals
    const dealsQuery = supabase
      .from('deals')
      .select('*, pipeline_stages(name), contacts(full_name, company_name)')
      .eq('workspace_id', workspaceData.id)
      .order('created_at', { ascending: false });

    if (contactId) {
      dealsQuery.eq('contact_id', contactId);
    }
    if (dealId) {
      dealsQuery.eq('id', dealId);
    }

    const { data: deals } = await dealsQuery;

    if (deals) {
      for (const deal of deals) {
        // Deal created event
        events.push({
          id: `deal_created_${deal.id}`,
          event_type: 'deal_created',
          timestamp: deal.created_at,
          title: `Deal Created: ${deal.title}`,
          summary: `Value: ${deal.amount || 0}`,
          owner_id: deal.owner_id,
          deal_id: deal.id,
          deal_title: deal.title,
          contact_id: deal.contact_id,
          contact_name: (deal.contacts as any)?.full_name || (deal.contacts as any)?.company_name,
          value: Number(deal.amount) || 0,
        });

        // Deal status events
        if (deal.status === 'won') {
          events.push({
            id: `deal_won_${deal.id}`,
            event_type: 'deal_won',
            timestamp: deal.actual_close_date || deal.updated_at,
            title: `Deal Won: ${deal.title}`,
            summary: `Closed for ${deal.amount || 0}`,
            owner_id: deal.owner_id,
            deal_id: deal.id,
            deal_title: deal.title,
            value: Number(deal.amount) || 0,
          });
        } else if (deal.status === 'lost') {
          events.push({
            id: `deal_lost_${deal.id}`,
            event_type: 'deal_lost',
            timestamp: deal.actual_close_date || deal.updated_at,
            title: `Deal Lost: ${deal.title}`,
            summary: deal.lost_reason || 'No reason provided',
            owner_id: deal.owner_id,
            deal_id: deal.id,
            deal_title: deal.title,
          });
        }

        // Deal stage changes (from deal_stage_history if available, or infer from current stage)
        if (deal.pipeline_stages) {
          events.push({
            id: `deal_stage_${deal.id}_${deal.stage_id}`,
            event_type: 'deal_stage_changed',
            timestamp: deal.updated_at,
            title: `Moved to ${(deal.pipeline_stages as any)?.name || 'Stage'}`,
            summary: `Deal: ${deal.title}`,
            owner_id: deal.owner_id,
            deal_id: deal.id,
            deal_title: deal.title,
            metadata: { stage_name: (deal.pipeline_stages as any)?.name },
          });
        }
      }
    }

    // 3. Fetch Tasks
    const tasksQuery = supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceData.id)
      .order('created_at', { ascending: false });

    const { data: tasks } = await tasksQuery;

    if (tasks) {
      for (const task of tasks) {
        // Task created
        events.push({
          id: `task_created_${task.id}`,
          event_type: 'task_created',
          timestamp: task.created_at,
          title: `Task Created: ${task.title}`,
          summary: task.description || '',
          owner_id: task.assigned_to || task.created_by,
          task_id: task.id,
          task_title: task.title,
        });

        // Task completed
        if (task.status === 'done') {
          events.push({
            id: `task_completed_${task.id}`,
            event_type: 'task_completed',
            timestamp: task.updated_at,
            title: `Task Completed: ${task.title}`,
            summary: task.description || '',
            owner_id: task.assigned_to || task.created_by,
            task_id: task.id,
            task_title: task.title,
          });
        }
      }
    }

    // 4. Fetch Contacts (for customer_created events)
    const contactsQuery = supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspaceData.id)
      .order('created_at', { ascending: false })
      .limit(500); // Limit to recent 500 contacts for performance

    if (contactId) {
      contactsQuery.eq('id', contactId);
    }

    const { data: contacts, error: contactsError } = await contactsQuery;

    if (contactsError) {
      console.error('Error fetching contacts for timeline:', contactsError);
    }

    if (contacts && contacts.length > 0) {
      for (const contact of contacts) {
        events.push({
          id: `customer_created_${contact.id}`,
          event_type: 'customer_created',
          timestamp: contact.created_at,
          title: `Customer Created: ${contact.full_name || contact.company_name || 'Unnamed'}`,
          summary: contact.lead_source ? `Source: ${contact.lead_source}` : undefined,
          owner_id: contact.created_by,
          contact_id: contact.id,
          contact_name: contact.full_name || contact.company_name,
          source: contact.lead_source,
        });
      }
    }

    // 5. Fetch Campaigns (for campaign events - simplified)
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .eq('workspace_id', workspaceData.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (campaigns) {
      for (const campaign of campaigns) {
        // Campaign clicked (simplified - in real app, this would come from analytics)
        if (campaign.status === 'active' || campaign.status === 'completed') {
          events.push({
            id: `campaign_clicked_${campaign.id}`,
            event_type: 'campaign_clicked',
            timestamp: campaign.updated_at || campaign.created_at,
            title: `Campaign Clicked: ${campaign.name}`,
            summary: campaign.description || '',
            campaign_id: campaign.id,
            campaign_name: campaign.name,
          });
        }
      }
    }

    // Sort all events by timestamp (newest first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Enrich with owner names
    const ownerIds = [...new Set(events.map(e => e.owner_id).filter(Boolean))];
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', ownerIds);

      if (profiles) {
        const profilesMap = new Map(profiles.map(p => [p.id, p]));
        events.forEach(event => {
          if (event.owner_id) {
            const profile = profilesMap.get(event.owner_id);
            event.owner_name = profile?.full_name || profile?.email || 'Unknown';
          }
        });
      }
    }

    return events;
  },
};
