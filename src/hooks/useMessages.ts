import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesService, Message } from '../services/api/messages.service';

export function useMessages() {
  const queryClient = useQueryClient();

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['messages'],
    queryFn: messagesService.getAll,
  });

  const { data: unreadMessages } = useQuery({
    queryKey: ['messages', 'unread'],
    queryFn: messagesService.getUnread,
  });

  const createMessage = useMutation({
    mutationFn: (newMessage: Omit<Message, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
      messagesService.create(newMessage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const updateMessage = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Message> }) =>
      messagesService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: (id: string) => messagesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  return {
    messages: messages || [],
    unreadMessages: unreadMessages || [],
    isLoading,
    error,
    createMessage,
    updateMessage,
    deleteMessage,
  };
}
