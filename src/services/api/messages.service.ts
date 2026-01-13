import { supabase } from '../../lib/supabase';

export interface Message {
  id: string;
  user_id: string;
  customer_id?: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'chat';
  direction: 'inbound' | 'outbound';
  subject?: string;
  body: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const messagesService = {
  async getAll(): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(message: Omit<Message, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert([{ ...message, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Message>): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getByChannel(channel: Message['channel']): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel', channel)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getUnread(): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('direction', 'inbound')
      .neq('status', 'read')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
};
