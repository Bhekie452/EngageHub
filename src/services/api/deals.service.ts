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
  lead_source?: string;
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

    // Fetch deals
    const { data: dealsData, error: dealsError } = await supabase
      .from('deals')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (dealsError) {
      console.error('Error fetching deals:', dealsError);
      throw dealsError;
    }

    if (!dealsData || dealsData.length === 0) {
      return [];
    }

    // Fetch related data
    const stageIds = [...new Set(dealsData.map(d => d.stage_id).filter(Boolean))];
    const contactIds = [...new Set(dealsData.map(d => d.contact_id).filter(Boolean))];
    const companyIds = [...new Set(dealsData.map(d => d.company_id).filter(Boolean))];

    const [stagesResult, contactsResult, companiesResult] = await Promise.all([
      stageIds.length > 0
        ? supabase.from('pipeline_stages').select('id, name, probability').in('id', stageIds)
        : { data: [], error: null },
      contactIds.length > 0
        ? supabase.from('contacts').select('id, full_name, company_name').in('id', contactIds)
        : { data: [], error: null },
      companyIds.length > 0
        ? supabase.from('companies').select('id, name').in('id', companyIds)
        : { data: [], error: null },
    ]);

    const stagesMap = new Map((stagesResult.data || []).map((s: any) => [s.id, s]));
    const contactsMap = new Map((contactsResult.data || []).map((c: any) => [c.id, c]));
    const companiesMap = new Map((companiesResult.data || []).map((c: any) => [c.id, c]));

    // Combine the data
    return dealsData.map(deal => ({
      ...deal,
      pipeline_stages: deal.stage_id ? stagesMap.get(deal.stage_id) : undefined,
      contacts: deal.contact_id ? contactsMap.get(deal.contact_id) : undefined,
      companies: deal.company_id ? companiesMap.get(deal.company_id) : undefined,
    }));
  },

  async getById(id: string): Promise<Deal> {
    const { data: deal, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching deal:', error);
      throw error;
    }

    // Fetch related data
    const [stageResult, contactResult, companyResult] = await Promise.all([
      deal.stage_id ? supabase.from('pipeline_stages').select('id, name, probability').eq('id', deal.stage_id).single() : { data: null, error: null },
      deal.contact_id ? supabase.from('contacts').select('id, full_name, company_name').eq('id', deal.contact_id).single() : { data: null, error: null },
      deal.company_id ? supabase.from('companies').select('id, name').eq('id', deal.company_id).single() : { data: null, error: null },
    ]);

    return {
      ...deal,
      pipeline_stages: stageResult.data || undefined,
      contacts: contactResult.data || undefined,
      companies: companyResult.data || undefined,
    };
  },

  async getByStatus(status: 'open' | 'won' | 'lost' | 'abandoned'): Promise<Deal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: dealsData, error: dealsError } = await supabase
      .from('deals')
      .select('*')
      .eq('owner_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (dealsError) {
      console.error('Error fetching deals by status:', dealsError);
      throw dealsError;
    }

    if (!dealsData || dealsData.length === 0) {
      return [];
    }

    // Fetch related data
    const stageIds = [...new Set(dealsData.map(d => d.stage_id).filter(Boolean))];
    const contactIds = [...new Set(dealsData.map(d => d.contact_id).filter(Boolean))];
    const companyIds = [...new Set(dealsData.map(d => d.company_id).filter(Boolean))];

    const [stagesResult, contactsResult, companiesResult] = await Promise.all([
      stageIds.length > 0
        ? supabase.from('pipeline_stages').select('id, name, probability').in('id', stageIds)
        : { data: [], error: null },
      contactIds.length > 0
        ? supabase.from('contacts').select('id, full_name, company_name').in('id', contactIds)
        : { data: [], error: null },
      companyIds.length > 0
        ? supabase.from('companies').select('id, name').in('id', companyIds)
        : { data: [], error: null },
    ]);

    const stagesMap = new Map((stagesResult.data || []).map((s: any) => [s.id, s]));
    const contactsMap = new Map((contactsResult.data || []).map((c: any) => [c.id, c]));
    const companiesMap = new Map((companiesResult.data || []).map((c: any) => [c.id, c]));

    return dealsData.map(deal => ({
      ...deal,
      pipeline_stages: deal.stage_id ? stagesMap.get(deal.stage_id) : undefined,
      contacts: deal.contact_id ? contactsMap.get(deal.contact_id) : undefined,
      companies: deal.company_id ? companiesMap.get(deal.company_id) : undefined,
    }));
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

    return this.getByStatus('open').then(deals =>
      deals.filter(deal => deal.stage_id === stages[0].id)
    );
  },

  async create(deal: Omit<Deal, 'id' | 'owner_id' | 'created_at' | 'updated_at' | 'pipeline_stages' | 'contacts' | 'companies'>): Promise<Deal> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('deals')
      .insert([{ ...deal, owner_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('Error creating deal:', error);
      throw error;
    }

    return this.getById(data.id);
  },

  async update(id: string, updates: Partial<Deal>): Promise<Deal> {
    const { data, error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating deal:', error);
      throw error;
    }

    return this.getById(data.id);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting deal:', error);
      throw error;
    }
  },
};
