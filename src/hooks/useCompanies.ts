import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesService, Company } from '../services/api/companies.service';

export function useCompanies() {
  const queryClient = useQueryClient();

  const { data: companies, isLoading, error } = useQuery({
    queryKey: ['companies'],
    queryFn: companiesService.getAll,
  });

  const createCompany = useMutation({
    mutationFn: (newCompany: Omit<Company, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'updated_at'>) =>
      companiesService.create(newCompany),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const updateCompany = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Company> }) =>
      companiesService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const deleteCompany = useMutation({
    mutationFn: (id: string) => companiesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  return {
    companies: companies || [],
    isLoading,
    error,
    createCompany,
    updateCompany,
    deleteCompany,
  };
}
