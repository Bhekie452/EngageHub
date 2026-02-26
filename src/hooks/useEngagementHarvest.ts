import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { engagementHarvestService, UnharvestedEngager, EngagementStats } from '../services/api/engagement-harvest.service';
import { analyticsService } from '../services/api/analytics.service';
import { Contact } from '../services/api/contacts.service';
import { useState } from 'react';

export function useEngagementHarvest() {
  const queryClient = useQueryClient();
  const [fetchProgress, setFetchProgress] = useState<{ current: number; total: number; platform: string; postTitle: string } | null>(null);

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
      console.log('Sync result:', result);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['unharvested-engagers'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['top-engaged-contacts'] });
      
      // Show result to user
      if (result.added > 0) {
        alert(`Successfully added ${result.added} engager(s) as contacts!`);
      } else if (result.message) {
        alert(result.message);
      } else {
        alert('No new engagers to add. They may already be contacts.');
      }
      return result;
    },
    onError: (error: any) => {
      console.error('Sync error:', error);
      alert(`Sync failed: ${error.message || 'Unknown error'}`);
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

  // Fetch all engagement across all platforms
  const fetchAllEngagement = useMutation({
    mutationFn: () => analyticsService.fetchAllEngagement(
      (current, total, platform, postTitle) => {
        setFetchProgress({ current, total, platform, postTitle });
      }
    ),
    onSuccess: (result) => {
      setFetchProgress(null);
      console.log('Fetch all engagement result:', result);
      // Refresh unharvested engagers
      queryClient.invalidateQueries({ queryKey: ['unharvested-engagers'] });
      queryClient.invalidateQueries({ queryKey: ['top-engaged-contacts'] });
      
      const platformList = result.platforms.join(', ') || 'none';
      if (result.commentsStored > 0) {
        alert(`Done! Scanned ${result.postsProcessed} posts across ${platformList}. Found ${result.commentsStored} new engagements.${result.errors.length > 0 ? `\n\n${result.errors.length} post(s) had errors.` : ''}`);
      } else if (result.postsProcessed > 0) {
        alert(`Scanned ${result.postsProcessed} posts across ${platformList}. No new comments found (they may already be stored).${result.errors.length > 0 ? `\n\n${result.errors.length} post(s) had errors.` : ''}`);
      } else {
        alert(result.errors.length > 0 
          ? `No posts could be processed. Errors: ${result.errors.join('; ')}` 
          : 'No published posts found to scan.');
      }
    },
    onError: (error: any) => {
      setFetchProgress(null);
      console.error('Fetch all engagement error:', error);
      alert(`Failed to fetch engagement: ${error.message || 'Unknown error'}`);
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
    fetchAllEngagement,
    refetchUnharvested,
    
    // Progress
    fetchProgress,
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
