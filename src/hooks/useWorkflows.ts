import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsService, Workflow } from '../services/api/workflows.service';

export function useWorkflows() {
  const queryClient = useQueryClient();

  const { data: workflows, isLoading, error } = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsService.getAll,
  });

  const createWorkflow = useMutation({
    mutationFn: (workflow: Omit<Workflow, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'updated_at' | 'total_runs' | 'successful_runs' | 'failed_runs'>) =>
      workflowsService.create(workflow),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const updateWorkflow = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Workflow> }) =>
      workflowsService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const deleteWorkflow = useMutation({
    mutationFn: (id: string) => workflowsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      workflowsService.toggleActive(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  return {
    workflows: workflows || [],
    isLoading,
    error,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleActive,
  };
}
