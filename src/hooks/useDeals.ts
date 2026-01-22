import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsService, Deal } from '../services/api/deals.service';

export function useDeals() {
  const queryClient = useQueryClient();

  const { data: deals, isLoading, error } = useQuery({
    queryKey: ['deals'],
    queryFn: dealsService.getAll,
  });

  const { data: wonDeals } = useQuery({
    queryKey: ['deals', 'won'],
    queryFn: () => dealsService.getByStatus('won'),
  });

  const { data: lostDeals } = useQuery({
    queryKey: ['deals', 'lost'],
    queryFn: () => dealsService.getByStatus('lost'),
  });

  const createDeal = useMutation({
    mutationFn: (newDeal: Omit<Deal, 'id' | 'owner_id' | 'created_at' | 'updated_at' | 'stage' | 'contact' | 'company'>) =>
      dealsService.create(newDeal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] }); // Refresh timeline
    },
  });

  const updateDeal = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Deal> }) =>
      dealsService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] }); // Refresh timeline
    },
  });

  const deleteDeal = useMutation({
    mutationFn: (id: string) => dealsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] }); // Refresh timeline
    },
  });

  return {
    deals: deals || [],
    wonDeals: wonDeals || [],
    lostDeals: lostDeals || [],
    isLoading,
    error,
    createDeal,
    updateDeal,
    deleteDeal,
  };
}
