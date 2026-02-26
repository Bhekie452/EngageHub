import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { engagementHarvestService, UnharvestedEngager, EngagementStats } from '../services/api/engagement-harvest.service';
import { Contact } from '../services/api/contacts.service';

export function useEngagementHarvest() {
  const queryClient = useQueryClient();

  // Get unharvested engagers
  const {
    data: unharvestedEngagers = [],
    isLoading: isLoadingUnharvested,
    error: unharvestedError,
    refetch: refetchUnharvested,
  } = useQuery({
    queryKey: ['unharvested-engagers'],
    queryFn: () => engagementHarvestService.getUnharvestedEngagers(),
    staleTime: 60000, // 1 minute
  });

  // Get top engaged contacts
  const {
    data: topEngagedContacts = [],
    isLoading: isLoadingTopEngaged,
    error: topEngagedError,
  } = useQuery({
    queryKey: ['top-engaged-contacts'],
    queryFn: () => engagementHarvestService.getTopEngagedContacts(10),
    staleTime: 60000,
  });

  // Sync all unharvested engagers
  const syncEngagers = useMutation({
    mutationFn: () => engagementHarvestService.syncEngagers(),
    onSuccess: (result) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['unharvested-engagers'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['top-engaged-contacts'] });
      return result;
    },
  });

  // Harvest a single engager
  const harvestEngager = useMutation({
    mutationFn: (engager: UnharvestedEngager) => 
      engagementHarvestService.harvestEngager(engager),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unharvested-engagers'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['top-engaged-contacts'] });
    },
  });

  return {
    // Data
    unharvestedEngagers,
    topEngagedContacts,
    
    // Loading states
    isLoadingUnharvested,
    isLoadingTopEngaged,
    
    // Errors
    unharvestedError,
    topEngagedError,
    
    // Actions
    syncEngagers,
    harvestEngager,
    refetchUnharvested,
  };
}

// Hook to get engagement stats for a specific contact
export function useContactEngagementStats(contactId: string | null) {
  return useQuery<EngagementStats | null>({
    queryKey: ['contact-engagement-stats', contactId],
    queryFn: () => contactId 
      ? engagementHarvestService.getContactEngagementStats(contactId)
      : null,
    enabled: !!contactId,
    staleTime: 60000,
  });
}

export default useEngagementHarvest;
