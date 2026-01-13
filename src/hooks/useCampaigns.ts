import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsService, Campaign } from '../services/api/campaigns.service';

export function useCampaigns() {
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignsService.getAll,
  });

  const createCampaign = useMutation({
    mutationFn: (newCampaign: Omit<Campaign, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
      campaignsService.create(newCampaign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const updateCampaign = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Campaign> }) =>
      campaignsService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: (id: string) => campaignsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  return {
    campaigns: campaigns || [],
    isLoading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
}
