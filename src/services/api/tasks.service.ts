import { supabase } from '../../lib/supabase';

export interface Task {
  id: string;
  workspace_id: string;
  created_by: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in-progress' | 'done' | 'in_progress' | 'review' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  assigned_to: string | null;
  project_id?: string | null;
  contact_id?: string | null;
  deal_id?: string | null;
  activity_id?: string | null;
  outcome?: string | null;
  reminder_time?: string | null;
  tags?: string[];
  metadata?: any;
  created_at: string;
  updated_at: string;
  // Joined data
  contacts?: {
    id: string;
    full_name?: string;
    company_name?: string;
  };
  deals?: {
    id: string;
    title: string;
    amount: number;
  };
  assigned_to_profile?: {
    id: string;
    full_name?: string;
    email?: string;
  };
  created_by_profile?: {
    id: string;
    full_name?: string;
    email?: string;
  };
}

export const tasksService = {
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get workspace
    const { data: workspaceData } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!workspaceData) return [];

    // Fetch tasks with related data
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceData.id)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw tasksError;
    }

    if (!tasksData || tasksData.length === 0) {
      return [];
    }

    // Fetch related data
    const contactIds = [...new Set(tasksData.map(t => (t as any).contact_id).filter(Boolean))];
    const dealIds = [...new Set(tasksData.map(t => (t as any).deal_id).filter(Boolean))];
    const userIds = [...new Set([
      ...tasksData.map(t => t.assigned_to).filter(Boolean),
      ...tasksData.map(t => t.created_by).filter(Boolean),
    ])];

    const [contactsResult, dealsResult, profilesResult] = await Promise.all([
      contactIds.length > 0 
        ? supabase.from('contacts').select('id, full_name, company_name').in('id', contactIds)
        : { data: [], error: null },
      dealIds.length > 0 
        ? supabase.from('deals').select('id, title, amount').in('id', dealIds)
        : { data: [], error: null },
      userIds.length > 0 
        ? supabase.from('profiles').select('id, full_name, email').in('id', userIds)
        : { data: [], error: null },
    ]);

    const contactsMap = new Map((contactsResult.data || []).map((c: any) => [c.id, c]));
    const dealsMap = new Map((dealsResult.data || []).map((d: any) => [d.id, d]));
    const profilesMap = new Map((profilesResult.data || []).map((p: any) => [p.id, p]));

    // Combine the data
    return tasksData.map(task => {
      const taskData = task as any;
      return {
        ...taskData,
        status: taskData.status === 'in_progress' ? 'in-progress' : taskData.status,
        contacts: taskData.contact_id ? contactsMap.get(taskData.contact_id) : undefined,
        deals: taskData.deal_id ? dealsMap.get(taskData.deal_id) : undefined,
        assigned_to_profile: taskData.assigned_to ? profilesMap.get(taskData.assigned_to) : undefined,
        created_by_profile: taskData.created_by ? profilesMap.get(taskData.created_by) : undefined,
        outcome: taskData.metadata?.outcome || null,
        reminder_time: taskData.metadata?.reminder_time || null,
      };
    }) as Task[];
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

  async create(task: Omit<Task, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'updated_at' | 'contacts' | 'deals' | 'assigned_to_profile' | 'created_by_profile'>) {
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

    // Extract metadata fields
    const { outcome, reminder_time, ...taskFields } = task;
    const metadata: any = {};
    if (outcome) metadata.outcome = outcome;
    if (reminder_time) metadata.reminder_time = reminder_time;

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ 
        title: taskFields.title,
        description: taskFields.description,
        status: normalizedStatus,
        priority: taskFields.priority,
        due_date: taskFields.due_date,
        assigned_to: taskFields.assigned_to || user.id, // Default to creator if not assigned
        contact_id: (taskFields as any).contact_id || null,
        deal_id: (taskFields as any).deal_id || null,
        activity_id: (taskFields as any).activity_id || null,
        tags: taskFields.tags || [],
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
        created_by: user.id,
        workspace_id: workspace.id,
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
    const normalizedUpdates: any = {};
    
    // Handle status normalization
    if (updates.status !== undefined) {
      normalizedUpdates.status = updates.status === 'in-progress' ? 'in_progress' : updates.status;
    }
    
    // Handle other fields
    if (updates.title !== undefined) normalizedUpdates.title = updates.title;
    if (updates.description !== undefined) normalizedUpdates.description = updates.description;
    if (updates.priority !== undefined) normalizedUpdates.priority = updates.priority;
    if (updates.due_date !== undefined) normalizedUpdates.due_date = updates.due_date;
    if (updates.assigned_to !== undefined) normalizedUpdates.assigned_to = updates.assigned_to;
    if ((updates as any).contact_id !== undefined) normalizedUpdates.contact_id = (updates as any).contact_id;
    if ((updates as any).deal_id !== undefined) normalizedUpdates.deal_id = (updates as any).deal_id;
    if ((updates as any).activity_id !== undefined) normalizedUpdates.activity_id = (updates as any).activity_id;
    if (updates.tags !== undefined) normalizedUpdates.tags = updates.tags;

    // Handle metadata (outcome, reminder_time)
    if (updates.outcome !== undefined || (updates as any).reminder_time !== undefined) {
      // Fetch current task to preserve existing metadata
      const { data: currentTask } = await supabase
        .from('tasks')
        .select('metadata')
        .eq('id', id)
        .single();

      const currentMetadata = (currentTask?.metadata as any) || {};
      if (updates.outcome !== undefined) currentMetadata.outcome = updates.outcome;
      if ((updates as any).reminder_time !== undefined) currentMetadata.reminder_time = (updates as any).reminder_time;
      normalizedUpdates.metadata = currentMetadata;
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
