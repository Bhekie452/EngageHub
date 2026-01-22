import { useQuery } from '@tanstack/react-query';
import { activitiesService, Activity } from '../services/api/activities.service';

export interface TimelineItem {
  id: string;
  type: Activity['activity_type'];
  title: string;
  content?: string;
  activityDate: string;
  value?: number;
  status?: string;
  platform?: string;
}

export function useCustomerTimeline(contactId?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-timeline', contactId],
    queryFn: () => {
      if (!contactId) return Promise.resolve([]);
      return activitiesService.getByContact(contactId);
    },
    enabled: !!contactId,
  });

  const items: TimelineItem[] = (data || []).map((activity) => ({
    id: activity.id,
    type: activity.activity_type,
    title: activity.title || activity.subject || activity.content?.slice(0, 80) || 'Activity',
    content: activity.content,
    activityDate: activity.activity_date || activity.created_at,
    value: activity.value || undefined,
    status: activity.status || undefined,
    platform: activity.platform || undefined,
  }));

  return {
    items,
    isLoading,
    error,
  };
}
