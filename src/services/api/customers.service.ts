import { supabase } from '../../lib/supabase';

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'lead' | 'active' | 'inactive';
  tags?: string[];
  notes?: string;
  last_contact?: string;
  created_at: string;
  updated_at: string;
}

export const customersService = {
  async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(customer: Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('customers')
      .insert([{ ...customer, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};
