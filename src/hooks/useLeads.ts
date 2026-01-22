import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsService, Lead } from '../services/api/leads.service';

export function useLeads() {
  const queryClient = useQueryClient();

  const { data: leads, isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: leadsService.getAll,
  });

  const createLead = useMutation({
    mutationFn: (newLead: Omit<Lead, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'updated_at'>) =>
      leadsService.create(newLead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const updateLead = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Lead> }) =>
      leadsService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const deleteLead = useMutation({
    mutationFn: (id: string) => leadsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  return {
    leads: leads || [],
    isLoading,
    error,
    createLead,
    updateLead,
    deleteLead,
  };
}
