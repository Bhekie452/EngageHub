import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsService, Deal } from '../services/api/deals.service';

export function useDeals() {
  const queryClient = useQueryClient();

  const { data: deals, isLoading, error } = useQuery({
    queryKey: ['deals'],
    queryFn: dealsService.getAll,
  });

  const createDeal = useMutation({
    mutationFn: (newDeal: Omit<Deal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
      dealsService.create(newDeal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const updateDeal = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Deal> }) =>
      dealsService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const deleteDeal = useMutation({
    mutationFn: (id: string) => dealsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  return {
    deals: deals || [],
    isLoading,
    error,
    createDeal,
    updateDeal,
    deleteDeal,
  };
}
