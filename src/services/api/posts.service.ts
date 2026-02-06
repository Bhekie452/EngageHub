import { supabase } from '../../lib/supabase';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube';
  platforms?: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_for?: string;
  published_at?: string;
  media_urls?: string[];
  hashtags?: string[];
  mentions?: string[];
  created_at: string;
  updated_at: string;
}

export interface PostAnalytics {
  id: string;
  post_id: string;
  likes: number;
  shares: number;
  comments: number;
  views: number;
  clicks: number;
  engagement_rate: number;
  recorded_at: string;
}

export const postsService = {
  async getAll(): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(post: Omit<Post, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Post> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert([{ ...post, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Post>): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getByPlatform(platform: Post['platform']): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('platform', platform)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getScheduled(): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'scheduled')
      .order('scheduled_for', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getAnalytics(postId: string): Promise<PostAnalytics[]> {
    const { data, error } = await supabase
      .from('post_analytics')
      .select('*')
      .eq('post_id', postId)
      .order('recorded_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
};
