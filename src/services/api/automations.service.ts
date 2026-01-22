import { supabase } from '../../lib/supabase';

export interface AutomationRule {
  id: string;
  workspace_id: string;
  created_by: string;
  name: string;
  description?: string;
  trigger_type: 'deal_stage_changed' | 'activity_completed' | 'task_overdue' | 'task_created' | 'message_received' | 'campaign_clicked' | 'time_elapsed' | 'record_created' | 'record_updated' | 'status_changed';
  trigger_config: {
    entity_type?: 'deal' | 'task' | 'activity' | 'contact' | 'message' | 'campaign';
    stage_id?: string;
    stage_name?: string;
    days?: number;
    field?: string;
    value?: any;
    [key: string]: any;
  };
  conditions: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
    value: any;
  }>;
  actions: Array<{
    type: 'create_task' | 'assign_owner' | 'send_notification' | 'update_field' | 'move_stage' | 'add_tag' | 'create_deal' | 'send_email' | 'alert_manager' | 'log_timeline';
    config: {
      task_title?: string;
      task_due_days?: number;
      owner_id?: string;
      field?: string;
      value?: any;
      stage_id?: string;
      tag?: string;
      notification_type?: string;
      [key: string]: any;
    };
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

export interface AutomationExecution {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed' | 'canceled';
  trigger_data?: any;
  execution_log?: Array<{
    action: string;
    status: 'success' | 'failed';
    message?: string;
    timestamp: string;
  }>;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
}

export const automationsService = {
  async getAll(): Promise<AutomationRule[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get workspace
    const { data: workspaceData, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1)
      .single();

    if (workspaceError || !workspaceData) {
      throw new Error('Workspace not found');
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('workspace_id', workspaceData.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AutomationRule[];
  },

  async getById(id: string): Promise<AutomationRule> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AutomationRule;
  },

  async create(automation: Omit<AutomationRule, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'updated_at' | 'total_runs' | 'successful_runs' | 'failed_runs'>): Promise<AutomationRule> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get workspace
    const { data: workspaceData, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1)
      .single();

    if (workspaceError || !workspaceData) {
      throw new Error('Workspace not found');
    }

    const { data, error } = await supabase
      .from('workflows')
      .insert([{
        ...automation,
        workspace_id: workspaceData.id,
        created_by: user.id,
        total_runs: 0,
        successful_runs: 0,
        failed_runs: 0,
      }])
      .select()
      .single();

    if (error) throw error;
    return data as AutomationRule;
  },

  async update(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    const { data, error } = await supabase
      .from('workflows')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AutomationRule;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async toggleActive(id: string, isActive: boolean): Promise<AutomationRule> {
    return this.update(id, { is_active: isActive, status: isActive ? 'active' : 'paused' });
  },

  async getExecutions(workflowId: string): Promise<AutomationExecution[]> {
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('started_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []) as AutomationExecution[];
  },
};
