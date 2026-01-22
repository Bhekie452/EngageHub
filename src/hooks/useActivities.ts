import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesService, Activity } from '../services/api/activities.service';

export function useActivities() {
  const queryClient = useQueryClient();

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activities'],
    queryFn: activitiesService.getAll,
  });

  const createActivity = useMutation({
    mutationFn: (newActivity: Omit<Activity, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'updated_at'>) =>
      activitiesService.create(newActivity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] }); // Refresh timeline
      queryClient.invalidateQueries({ queryKey: ['customer-timeline'] }); // Refresh customer timeline
    },
  });

  const updateActivity = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Activity> }) =>
      activitiesService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] }); // Refresh timeline
      queryClient.invalidateQueries({ queryKey: ['customer-timeline'] }); // Refresh customer timeline
    },
  });

  const deleteActivity = useMutation({
    mutationFn: (id: string) => activitiesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] }); // Refresh timeline
      queryClient.invalidateQueries({ queryKey: ['customer-timeline'] }); // Refresh customer timeline
    },
  });

  return {
    activities: activities || [],
    isLoading,
    error,
    createActivity,
    updateActivity,
    deleteActivity,
  };
}
