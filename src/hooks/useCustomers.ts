import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersService, Customer } from '../services/api/customers.service';

export function useCustomers() {
  const queryClient = useQueryClient();

  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: customersService.getAll,
  });

  const createCustomer = useMutation({
    mutationFn: (newCustomer: Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
      customersService.create(newCustomer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const updateCustomer = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Customer> }) =>
      customersService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: (id: string) => customersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  return {
    customers: customers || [],
    isLoading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
