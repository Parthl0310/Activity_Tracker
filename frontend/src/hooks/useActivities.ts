import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

// Types
export interface Activity {
  _id: string;
  text: string;
  workDate: string;
  aiEnriched: boolean;
  skills: string[];
  projects: string[];
  categories: string[];
  userId: string;
  createdAt: string;
}

export const useActivities = (params?: { page?: number; limit?: number; search?: string }) => {
  return useQuery({
    queryKey: ['activities', params],
    queryFn: async () => {
      const response: any = await apiClient.activities.getAll(params);
      return (response.data?.activities || response.data || []) as Activity[];
    },
  });
};

export const useActivity = (id: string) => {
  return useQuery({
    queryKey: ['activity', id],
    queryFn: async () => {
      const response: any = await apiClient.activities.getById(id);
      return response.data as Activity;
    },
    enabled: !!id,
  });
};

export const useCreateActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { text: string; workDate: string }) => {
      const response: any = await apiClient.activities.create(data);
      return response.data as Activity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
};

export const useSearchActivities = () => {
  return useMutation({
    mutationFn: async (query: string) => {
      const response: any = await apiClient.search.ask(query);
      return response.data;
    },
  });
};
