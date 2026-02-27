import { QueryClient } from '@tanstack/react-query';

// Utility to ensure returned data is mutable
// This prevents "Cannot add property" errors when data is frozen
export function ensureMutable<T>(data: T): T {
  if (Array.isArray(data)) {
    return Array.from(data) as T;
  }
  if (data && typeof data === 'object') {
    try {
      return JSON.parse(JSON.stringify(data)) as T;
    } catch {
      return data;
    }
  }
  return data;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
