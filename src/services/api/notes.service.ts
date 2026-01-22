import { supabase } from '../../lib/supabase';

export interface Note {
  id: string;
  workspace_id: string;
  created_by: string;
  content: string;
  note_type: 'general' | 'objection' | 'preference' | 'insight' | 'warning' | 'manager';
  visibility: 'team' | 'private' | 'manager';
  is_pinned: boolean;
  is_important: boolean;
  // Attachments - can be to multiple entities
  contact_id?: string;
  deal_id?: string;
  activity_id?: string;
  task_id?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  created_by_profile?: {
    id: string;
    full_name?: string;
    email?: string;
  };
}

export const notesService = {
  async getAll(): Promise<Note[]> {
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

    // For now, we'll use crm_activities table if it exists, or create a notes view
    // Since there's no dedicated notes table, we'll use a workaround with crm_activities
    // where activity_type = 'note'
    const { data, error } = await supabase
      .from('crm_activities')
      .select('*')
      .eq('workspace_id', workspaceData.id)
      .eq('activity_type', 'note')
      .order('created_at', { ascending: false });

    // Fetch profile data separately if needed
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((item: any) => item.created_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

      return (data || []).map((item: any) => ({
        id: item.id,
        workspace_id: item.workspace_id,
        created_by: item.created_by,
        content: item.notes || item.content || '',
        note_type: item.note_type || 'general',
        visibility: item.visibility || 'team',
        is_pinned: item.is_pinned || false,
        is_important: item.is_important || false,
        contact_id: item.contact_id,
        deal_id: item.deal_id,
        activity_id: item.activity_id,
        task_id: item.task_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        created_by_profile: profileMap.get(item.created_by),
      })) as Note[];
    }

    if (error) {
      // If crm_activities doesn't exist or doesn't have the right structure,
      // return empty array for now
      console.warn('Notes table not found, returning empty array:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      workspace_id: item.workspace_id,
      created_by: item.created_by,
      content: item.notes || item.content || '',
      note_type: item.note_type || 'general',
      visibility: item.visibility || 'team',
      is_pinned: item.is_pinned || false,
      is_important: item.is_important || false,
      contact_id: item.contact_id,
      deal_id: item.deal_id,
      activity_id: item.activity_id,
      task_id: item.task_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      created_by_profile: item.created_by_profile,
    })) as Note[];
  },

  async getByContactId(contactId: string): Promise<Note[]> {
    const allNotes = await this.getAll();
    return allNotes.filter(note => note.contact_id === contactId);
  },

  async getByDealId(dealId: string): Promise<Note[]> {
    const allNotes = await this.getAll();
    return allNotes.filter(note => note.deal_id === dealId);
  },

  async create(note: Omit<Note, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<Note> {
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

    // Use crm_activities table with activity_type = 'note'
    const { data, error } = await supabase
      .from('crm_activities')
      .insert([{
        workspace_id: workspaceData.id,
        created_by: user.id,
        activity_type: 'note',
        notes: note.content,
        note_type: note.note_type,
        visibility: note.visibility,
        is_pinned: note.is_pinned,
        is_important: note.is_important,
        contact_id: note.contact_id || null,
        deal_id: note.deal_id || null,
        activity_id: note.activity_id || null,
        task_id: note.task_id || null,
        activity_date: new Date().toISOString(),
        status: 'completed',
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      workspace_id: data.workspace_id,
      created_by: data.created_by,
      content: data.notes || data.content || '',
      note_type: data.note_type || 'general',
      visibility: data.visibility || 'team',
      is_pinned: data.is_pinned || false,
      is_important: data.is_important || false,
      contact_id: data.contact_id,
      deal_id: data.deal_id,
      activity_id: data.activity_id,
      task_id: data.task_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    } as Note;
  },

  async update(id: string, updates: Partial<Note>): Promise<Note> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Only update fields that are provided
    if (updates.content !== undefined) {
      updateData.notes = updates.content;
    }
    if (updates.note_type !== undefined) {
      updateData.note_type = updates.note_type;
    }
    if (updates.visibility !== undefined) {
      updateData.visibility = updates.visibility;
    }
    if (updates.is_pinned !== undefined) {
      updateData.is_pinned = updates.is_pinned;
    }
    if (updates.is_important !== undefined) {
      updateData.is_important = updates.is_important;
    }
    if (updates.contact_id !== undefined) {
      updateData.contact_id = updates.contact_id || null;
    }
    if (updates.deal_id !== undefined) {
      updateData.deal_id = updates.deal_id || null;
    }
    if (updates.activity_id !== undefined) {
      updateData.activity_id = updates.activity_id || null;
    }
    if (updates.task_id !== undefined) {
      updateData.task_id = updates.task_id || null;
    }

    const { data, error } = await supabase
      .from('crm_activities')
      .update(updateData)
      .eq('id', id)
      .eq('activity_type', 'note')
      .select()
      .single();

    if (error) {
      console.error('Error updating note:', error);
      // If error is about missing columns, try without them
      if (error.message?.includes('is_pinned') || error.message?.includes('is_important')) {
        const fallbackData: any = {
          notes: updates.content,
          note_type: updates.note_type,
          visibility: updates.visibility,
          updated_at: new Date().toISOString(),
        };
        if (updates.contact_id !== undefined) fallbackData.contact_id = updates.contact_id || null;
        if (updates.deal_id !== undefined) fallbackData.deal_id = updates.deal_id || null;
        if (updates.activity_id !== undefined) fallbackData.activity_id = updates.activity_id || null;
        if (updates.task_id !== undefined) fallbackData.task_id = updates.task_id || null;

        const { data: fallbackResult, error: fallbackError } = await supabase
          .from('crm_activities')
          .update(fallbackData)
          .eq('id', id)
          .eq('activity_type', 'note')
          .select()
          .single();

        if (fallbackError) {
          console.error('Error updating note (fallback):', fallbackError);
          throw fallbackError;
        }
        return {
          id: fallbackResult.id,
          workspace_id: fallbackResult.workspace_id,
          created_by: fallbackResult.created_by,
          content: fallbackResult.notes || fallbackResult.content || '',
          note_type: fallbackResult.note_type || 'general',
          visibility: fallbackResult.visibility || 'team',
          is_pinned: false,
          is_important: false,
          contact_id: fallbackResult.contact_id,
          deal_id: fallbackResult.deal_id,
          activity_id: fallbackResult.activity_id,
          task_id: fallbackResult.task_id,
          created_at: fallbackResult.created_at,
          updated_at: fallbackResult.updated_at,
        } as Note;
      }
      throw error;
    }

    return {
      id: data.id,
      workspace_id: data.workspace_id,
      created_by: data.created_by,
      content: data.notes || data.content || '',
      note_type: data.note_type || 'general',
      visibility: data.visibility || 'team',
      is_pinned: data.is_pinned || false,
      is_important: data.is_important || false,
      contact_id: data.contact_id,
      deal_id: data.deal_id,
      activity_id: data.activity_id,
      task_id: data.task_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    } as Note;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_activities')
      .delete()
      .eq('id', id)
      .eq('activity_type', 'note');

    if (error) throw error;
  },
};
