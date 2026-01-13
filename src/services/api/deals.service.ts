import { supabase } from '../../lib/supabase';

export interface Deal {
  id: string;
  user_id: string;
  customer_id?: string;
  title: string;
  amount: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expected_close_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const dealsService = {
  async getAll(): Promise<Deal[]> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Deal> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(deal: Omit<Deal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Deal> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('deals')
      .insert([{ ...deal, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Deal>): Promise<Deal> {
    const { data, error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', id)
      .select()
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

  async getByStage(stage: Deal['stage']): Promise<Deal[]> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('stage', stage)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
};
