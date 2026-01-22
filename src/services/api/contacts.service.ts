import { supabase } from '../../lib/supabase';

export interface Contact {
  id: string;
  workspace_id: string;
  created_by: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  avatar_url?: string;
  company_name?: string;
  job_title?: string;
  department?: string;
  company_size?: string;
  industry?: string;
  website?: string;
  address?: any;
  social_profiles?: any;
  type: 'lead' | 'contact' | 'customer' | 'partner' | 'vendor';
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'customer' | 'inactive';
  lead_source?: string;
  lead_score?: number;
  lifecycle_stage?: string;
  tags?: string[];
  custom_fields?: any;
  notes?: string;
  last_contacted_at?: string;
  last_activity_at?: string;
  source_campaign_id?: string;
  source_post_id?: string;
  acquisition_channel?: string;
  email_opt_in?: boolean;
  sms_opt_in?: boolean;
  whatsapp_opt_in?: boolean;
  do_not_contact?: boolean;
  unsubscribed_at?: string;
  created_at: string;
  updated_at: string;
}

export const contactsService = {
  async getAll(): Promise<Contact[]> {
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
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspaceData.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
    return data || [];
  },

  async getById(id: string): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching contact:', error);
      throw error;
    }
    return data;
  },

  async create(contact: Omit<Contact, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<Contact> {
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
      // Generate a unique slug from user email
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
      .from('contacts')
      .insert([{ 
        ...contact, 
        workspace_id: workspaceData.id,
        created_by: user.id 
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating contact:', error);
      // Provide more helpful error messages
      if (error.code === '23505') {
        throw new Error('A contact with this email already exists in your workspace');
      } else if (error.code === '23503') {
        throw new Error('Invalid workspace or user reference');
      } else {
        throw new Error(error.message || 'Failed to create contact');
      }
    }
    return data;
  },

  async update(id: string, updates: Partial<Contact>): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  },
};
