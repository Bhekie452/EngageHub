import { supabase } from '../../lib/supabase';

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  type: 'email' | 'sms' | 'social' | 'ads';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  start_date?: string;
  end_date?: string;
  budget?: number;
  target_audience?: Record<string, any>;
  metrics?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const campaignsService = {
  async getAll(): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(campaign: Omit<Campaign, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Campaign> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('campaigns')
      .insert([{ ...campaign, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getByStatus(status: Campaign['status']): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
};
