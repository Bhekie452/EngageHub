import { supabase } from '../../lib/supabase';

export interface Workflow {
  id: string;
  workspace_id: string;
  created_by: string;
  name: string;
  description?: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  conditions: Array<{
    field: string;
    operator: string;
    value: string | number;
  }>;
  actions: Array<{
    type: string;
    config: Record<string, any>;
  }>;
  is_active: boolean;
  status: 'active' | 'paused' | 'draft' | 'archived';
  last_run_at?: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  created_at: string;
  updated_at: string;
}

export const workflowsService = {
  async getAll(): Promise<Workflow[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get workspace
    let { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    // If workspace doesn't exist, create one
    if (!workspace && workspaceError?.code === 'PGRST116') {
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
      workspace = newWorkspace;
    }

    if (!workspace) return [];

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching workflows:', error);
      throw error;
    }
    return data || [];
  },

  async getById(id: string): Promise<Workflow> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(workflow: Omit<Workflow, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'updated_at' | 'total_runs' | 'successful_runs' | 'failed_runs'>): Promise<Workflow> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get workspace
    let { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    // If workspace doesn't exist, create one
    if (!workspace && workspaceError?.code === 'PGRST116') {
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
      workspace = newWorkspace;
    }

    if (!workspace) throw new Error('Workspace not found');

    const { data, error } = await supabase
      .from('workflows')
      .insert([{
        ...workflow,
        workspace_id: workspace.id,
        created_by: user.id,
        total_runs: 0,
        successful_runs: 0,
        failed_runs: 0,
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
    return data;
  },

  async update(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    const { data, error } = await supabase
      .from('workflows')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  },

  async toggleActive(id: string, is_active: boolean): Promise<Workflow> {
    return this.update(id, { is_active, status: is_active ? 'active' : 'paused' });
  },
};
