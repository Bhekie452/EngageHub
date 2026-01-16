import { supabase } from '../../lib/supabase';

export interface Task {
  id: string;
  workspace_id: string;
  created_by: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in-progress' | 'done' | 'in_progress' | 'review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  assigned_to: string | null;
  project_id?: string | null;
  created_at: string;
  updated_at: string;
}

export const tasksService = {
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
    
    // Normalize status from database format to component format
    return (data || []).map(task => ({
      ...task,
      status: task.status === 'in_progress' ? 'in-progress' : task.status,
    })) as Task[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Task;
  },

  async create(task: Omit<Task, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's workspace_id from workspaces table
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1)
      .single();

    if (workspaceError || !workspace) {
      console.error('Error fetching workspace:', workspaceError);
      throw new Error('Workspace not found. Please ensure you have a workspace.');
    }

    // Normalize status: convert 'in-progress' to 'in_progress' for database
    const normalizedStatus = task.status === 'in-progress' ? 'in_progress' : task.status;

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ 
        ...task, 
        created_by: user.id,
        workspace_id: workspace.id,
        status: normalizedStatus,
        assigned_to: task.assigned_to || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }
    
    // Normalize status from database format to component format
    const normalizedData = {
      ...data,
      status: data.status === 'in_progress' ? 'in-progress' : data.status,
    };
    return normalizedData as Task;
  },

  async update(id: string, updates: Partial<Task>) {
    // Normalize status if present
    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.status === 'in-progress') {
      normalizedUpdates.status = 'in_progress' as any;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(normalizedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }
    
    // Normalize status from database format to component format
    const normalizedData = {
      ...data,
      status: data.status === 'in_progress' ? 'in-progress' : data.status,
    };
    return normalizedData as Task;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
