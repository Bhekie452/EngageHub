import { supabase } from '../../lib/supabase';

export interface Company {
  id: string;
  workspace_id: string;
  created_by: string;
  name: string;
  legal_name?: string;
  website?: string;
  domain?: string;
  logo_url?: string;
  industry?: string;
  company_size?: string;
  annual_revenue?: number;
  currency?: string;
  employee_count?: number;
  founded_year?: number;
  address?: any;
  phone?: string;
  email?: string;
  social_profiles?: any;
  description?: string;
  tags?: string[];
  custom_fields?: any;
  lifecycle_stage?: 'lead' | 'opportunity' | 'customer' | 'partner' | 'inactive';
  account_owner_id?: string;
  created_at: string;
  updated_at: string;
}

export const companiesService = {
  async getAll(): Promise<Company[]> {
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
      .from('companies')
      .select('*')
      .eq('workspace_id', workspaceData.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
    return data || [];
  },

  async getById(id: string): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
    return data;
  },

  async create(company: Omit<Company, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<Company> {
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
      .from('companies')
      .insert([{ 
        ...company, 
        workspace_id: workspaceData.id,
        created_by: user.id 
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating company:', error);
      if (error.code === '23505') {
        throw new Error('A company with this name already exists in your workspace');
      } else if (error.code === '23503') {
        throw new Error('Invalid workspace or user reference');
      } else {
        throw new Error(error.message || 'Failed to create company');
      }
    }
    return data;
  },

  async update(id: string, updates: Partial<Company>): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating company:', error);
      throw error;
    }
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  },
};
