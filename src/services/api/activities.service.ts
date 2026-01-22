import { supabase } from '../../lib/supabase';

export interface Activity {
  id: string;
  workspace_id: string;
  created_by: string;
  activity_type: 'note' | 'call' | 'email' | 'meeting' | 'deal' | 'task' | 'campaign' | 'message' | 'social';
  contact_id?: string;
  company_id?: string;
  deal_id?: string;
  title?: string;
  content?: string;
  subject?: string;
  platform?: string;
  value?: number;
  status?: string;
  tags?: string[];
  metadata?: any;
  activity_date: string;
  created_at: string;
  updated_at: string;
}

export const activitiesService = {
  async getAll(): Promise<Activity[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get workspace
    const { data: workspaceData } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!workspaceData) return [];

    const { data, error } = await supabase
      .from('crm_activities')
      .select('*')
      .eq('workspace_id', workspaceData.id)
      .order('activity_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
    return data || [];
  },

  async getByContact(contactId: string): Promise<Activity[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get workspace
    const { data: workspaceData } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!workspaceData) return [];

    const { data, error } = await supabase
      .from('crm_activities')
      .select('*')
      .eq('workspace_id', workspaceData.id)
      .eq('contact_id', contactId)
      .order('activity_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching activities by contact:', error);
      throw error;
    }
    return data || [];
  },

  async create(activity: Omit<Activity, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<Activity> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get or create workspace
    let { data: workspaceData, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    // If workspace doesn't exist, create one
    if (!workspaceData && workspaceError?.code === 'PGRST116') {
      const userEmail = user.email || 'user';
      const baseSlug = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const uniqueSlug = `${baseSlug}-${Date.now()}`;
      
      const { data: newWorkspace, error: createWorkspaceError } = await supabase
        .from('workspaces')
        .insert({
          owner_id: user.id,
          name: 'My Workspace',
          slug: uniqueSlug,
        })
        .select()
        .single();
      
      if (createWorkspaceError) {
        console.error('Error creating workspace:', createWorkspaceError);
        throw new Error(`Failed to create workspace: ${createWorkspaceError.message}`);
      }
      workspaceData = newWorkspace;
    }

    if (!workspaceData) {
      throw new Error('Workspace not found and could not be created');
    }

    const { data, error } = await supabase
      .from('crm_activities')
      .insert([{ 
        ...activity, 
        workspace_id: workspaceData.id,
        created_by: user.id 
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
    return data;
  },

  async update(id: string, updates: Partial<Activity>): Promise<Activity> {
    const { data, error } = await supabase
      .from('crm_activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_activities')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  },
};
