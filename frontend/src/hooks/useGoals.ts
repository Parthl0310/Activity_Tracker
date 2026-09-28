import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export interface AchievedGoal {
  _id: string;
  title: string;
  description: string;
  year: number;
  businessImpact: string;
  projects: string[];
  userId: string;
  createdAt: string;
}

export const useGoals = (params?: { year?: number; project?: string }) => {
  return useQuery({
    queryKey: ['goals', params],
    queryFn: async () => {
      const response: any = await apiClient.achievedGoals.getAll(params);
      return (response.data?.goals || response.data || []) as AchievedGoal[];
    },
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; description: string; year: number; businessImpact: string; projects: string[] }) => {
      const response: any = await apiClient.achievedGoals.create(data);
      return response.data as AchievedGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
};
