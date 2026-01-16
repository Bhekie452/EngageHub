import { supabase } from '../../lib/supabase';

export interface Deal {
  id: string;
  workspace_id: string;
  pipeline_id: string;
  stage_id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  contact_id?: string;
  company_id?: string;
  owner_id: string;
  expected_close_date?: string;
  actual_close_date?: string;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  probability: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  pipeline_stages?: {
    id: string;
    name: string;
    probability: number;
  };
  contacts?: {
    id: string;
    full_name?: string;
    company_name?: string;
  };
  companies?: {
    id: string;
    name: string;
  };
}

export const dealsService = {
  async getAll(): Promise<Deal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's workspace_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        pipeline_stages!stage_id(id, name, probability),
        contacts!contact_id(id, full_name, company_name),
        companies!company_id(id, name)
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Deal> {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        pipeline_stages!stage_id(id, name, probability),
        contacts!contact_id(id, full_name, company_name),
        companies!company_id(id, name)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByStatus(status: 'open' | 'won' | 'lost' | 'abandoned'): Promise<Deal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        pipeline_stages!stage_id(id, name, probability),
        contacts!contact_id(id, full_name, company_name),
        companies!company_id(id, name)
      `)
      .eq('owner_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getByStageName(stageName: string): Promise<Deal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // First get the stage_id from pipeline_stages
    const { data: stages } = await supabase
      .from('pipeline_stages')
      .select('id')
      .ilike('name', `%${stageName}%`)
      .limit(1);

    if (!stages || stages.length === 0) return [];

    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        pipeline_stages!stage_id(id, name, probability),
        contacts!contact_id(id, full_name, company_name),
        companies!company_id(id, name)
      `)
      .eq('owner_id', user.id)
      .eq('stage_id', stages[0].id)
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(deal: Omit<Deal, 'id' | 'owner_id' | 'created_at' | 'updated_at' | 'stage' | 'contact' | 'company'>): Promise<Deal> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('deals')
      .insert([{ ...deal, owner_id: user.id }])
      .select(`
        *,
        pipeline_stages!stage_id(id, name, probability),
        contacts!contact_id(id, full_name, company_name),
        companies!company_id(id, name)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Deal>): Promise<Deal> {
    const { data, error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        pipeline_stages!stage_id(id, name, probability),
        contacts!contact_id(id, full_name, company_name),
        companies!company_id(id, name)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};
