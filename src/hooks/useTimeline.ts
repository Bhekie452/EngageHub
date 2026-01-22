import { useQuery } from '@tanstack/react-query';
import { timelineService, TimelineEvent } from '../services/api/timeline.service';

export function useTimeline(contactId?: string, dealId?: string) {
  const { data: events = [], isLoading, error, refetch } = useQuery({
    queryKey: ['timeline', contactId, dealId],
    queryFn: () => timelineService.getAll(contactId, dealId),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to ensure fresh data
    gcTime: 0, // Don't cache to ensure immediate updates
  });

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    let dateLabel: string;
    if (date >= today) {
      dateLabel = 'Today';
    } else if (date >= yesterday) {
      dateLabel = 'Yesterday';
    } else if (date >= lastWeek) {
      dateLabel = 'Last Week';
    } else {
      dateLabel = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    if (!acc[dateLabel]) {
      acc[dateLabel] = [];
    }
    acc[dateLabel].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  return {
    events,
    groupedEvents,
    isLoading,
    error,
    refetch, // Expose refetch function
  };
}
