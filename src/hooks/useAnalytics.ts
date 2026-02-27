import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsService, AnalyticsDailyRow, AnalyticsEventInput } from '../services/api/analytics.service';
import { ensureMutable } from '../lib/queryClient';

// Utility to ensure returned data is mutable

export function useAnalyticsDaily(fromDay: string, toDay: string) {
  return useQuery({
    queryKey: ['analytics', 'daily', fromDay, toDay],
    queryFn: () => analyticsService.getDaily(fromDay, toDay).then(ensureMutable),
  });
}

export function useAnalyticsTrackEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (event: Omit<AnalyticsEventInput, 'workspace_id'> & { workspace_id?: string }) =>
      analyticsService.track(event),
    onSuccess: () => {
      // don't spam invalidations; dashboards can roll up on demand
      queryClient.invalidateQueries({ queryKey: ['analytics', 'events'] });
    },
  });
}

export function useAnalyticsRollupDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (day: string) => analyticsService.rollupDay(day),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'daily'] });
    },
  });
}

export function useGlobalSocialSummary() {
  return useQuery({
    queryKey: ['analytics', 'global-social'],
    queryFn: () => analyticsService.getGlobalSocialSummary().then(ensureMutable),
  });
}

