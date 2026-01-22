import { supabase } from '../../lib/supabase';

export interface Lead {
  id: string;
  workspace_id: string;
  created_by: string;
  name: string;
  email?: string;
  phone?: string;
  source: 'web_form' | 'manual' | 'facebook' | 'whatsapp' | 'instagram' | 'email' | 'referral' | 'other';
  message?: string;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted' | 'lost';
  estimated_value: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export const leadsService = {
  async getAll(): Promise<Lead[]> {
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
      .from('leads')
      .select('*')
      .eq('workspace_id', workspaceData.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
    return data || [];
  },

  async getById(id: string): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching lead:', error);
      throw error;
    }
    return data;
  },

  async create(lead: Omit<Lead, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<Lead> {
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
      .from('leads')
      .insert([{ 
        ...lead, 
        workspace_id: workspaceData.id,
        created_by: user.id 
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating lead:', error);
      throw new Error(error.message || 'Failed to create lead');
    }
    return data;
  },

  async update(id: string, updates: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  },
};
