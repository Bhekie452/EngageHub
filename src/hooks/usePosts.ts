import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsService, Post } from '../services/api/posts.service';

export function usePosts() {
  const queryClient = useQueryClient();

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: postsService.getAll,
  });

  const { data: scheduledPosts } = useQuery({
    queryKey: ['posts', 'scheduled'],
    queryFn: postsService.getScheduled,
  });

  const createPost = useMutation({
    mutationFn: (newPost: Omit<Post, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
      postsService.create(newPost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const updatePost = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Post> }) =>
      postsService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const deletePost = useMutation({
    mutationFn: (id: string) => postsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  return {
    posts: posts || [],
    scheduledPosts: scheduledPosts || [],
    isLoading,
    error,
    createPost,
    updatePost,
    deletePost,
  };
}
