import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesService, Note } from '../services/api/notes.service';

export function useNotes() {
  const queryClient = useQueryClient();

  const { data: notes, isLoading, error } = useQuery({
    queryKey: ['notes'],
    queryFn: notesService.getAll,
  });

  const createNote = useMutation({
    mutationFn: notesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const updateNote = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Note> }) =>
      notesService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: notesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  return {
    notes: notes || [],
    isLoading,
    error,
    createNote,
    updateNote,
    deleteNote,
  };
}
