import { create } from 'zustand';
import { AchievedGoal, CreateGoalInput } from '../types/goal';

interface GoalStoreState {
  goals: AchievedGoal[];
  isLoading: boolean;
  selectedGoal: AchievedGoal | null;
  addGoal: (input: CreateGoalInput) => Promise<AchievedGoal>;
  deleteGoal: (id: string) => Promise<boolean>;
  getGoalById: (id: string) => AchievedGoal | undefined;
  fetchGoals: () => Promise<void>;
}

import { apiClient } from '../services/apiClient';

export const useGoalStore = create<GoalStoreState>((set, get) => ({
  goals: [],
  isLoading: false,
  selectedGoal: null,

  fetchGoals: async () => {
    set({ isLoading: true });
    try {
      const response: any = await apiClient.achievedGoals.getAll();
      set({ goals: response.data?.goals || response.goals || [], isLoading: false });
    } catch (e) {
      console.error(e);
      set({ goals: [], isLoading: false });
    }
  },

  addGoal: async (input: CreateGoalInput) => {
    set({ isLoading: true });
    try {
      const response: any = await apiClient.achievedGoals.create(input);
      const newGoal = response.data?.goal || response.goal;
      set((state) => ({
        goals: [newGoal, ...state.goals],
        isLoading: false,
      }));
      return newGoal;
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  deleteGoal: async (id: string) => {
    set({ isLoading: true });
    try {
      await apiClient.achievedGoals.delete(id);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (e) {
      set({ isLoading: false });
      return false;
    }
  },

  getGoalById: (id: string) => {
    return get().goals.find((g) => g.id === id);
  },
}));
