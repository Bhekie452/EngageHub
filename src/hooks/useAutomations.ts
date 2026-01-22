import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationsService, AutomationRule } from '../services/api/automations.service';

export function useAutomations() {
  const queryClient = useQueryClient();

  const { data: automations, isLoading, error } = useQuery({
    queryKey: ['automations'],
    queryFn: automationsService.getAll,
  });

  const createAutomation = useMutation({
    mutationFn: automationsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });

  const updateAutomation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AutomationRule> }) =>
      automationsService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });

  const deleteAutomation = useMutation({
    mutationFn: automationsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });

  const toggleAutomation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      automationsService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });

  return {
    automations: automations || [],
    isLoading,
    error,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
  };
}
