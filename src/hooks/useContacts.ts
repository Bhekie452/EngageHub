import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsService, Contact } from '../services/api/contacts.service';

export function useContacts() {
  const queryClient = useQueryClient();

  const { data: contacts, isLoading, error } = useQuery({
    queryKey: ['contacts'],
    queryFn: contactsService.getAll,
  });

  const createContact = useMutation({
    mutationFn: (newContact: Omit<Contact, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'updated_at'>) =>
      contactsService.create(newContact),
    onSuccess: async () => {
      // Invalidate and refetch immediately
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
      await queryClient.invalidateQueries({ queryKey: ['timeline'] }); // Refresh timeline to show customer creation
      // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: ['timeline'] });
    },
  });

  const updateContact = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Contact> }) =>
      contactsService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const deleteContact = useMutation({
    mutationFn: (id: string) => contactsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  return {
    contacts: contacts || [],
    isLoading,
    error,
    createContact,
    updateContact,
    deleteContact,
  };
}
