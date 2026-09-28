import { create } from 'zustand';
import { Activity, ActivityCategory, WorkType, CreateActivityInput } from '../types/activity';

interface ActivityStoreState {
  activities: Activity[];
  selectedActivity: Activity | null;
  filter: {
    searchQuery: string;
    tab: 'all' | 'work' | 'achievements' | 'goals';
    project: string;
    category: string;
    date: Date | null;
  };
  isLoading: boolean;
  setSearchQuery: (query: string) => void;
  setTab: (tab: 'all' | 'work' | 'achievements' | 'goals') => void;
  setProjectFilter: (project: string) => void;
  setCategoryFilter: (category: string) => void;
  setDateFilter: (date: Date | null) => void;
  setSelectedActivity: (activity: Activity | null) => void;
  getActivityById: (id: string) => Activity | undefined;
  addActivity: (input: CreateActivityInput) => Promise<Activity>;
  updateActivity: (id: string, updates: Partial<Activity>) => Promise<Activity | null>;
  deleteActivity: (id: string) => Promise<boolean>;
  fetchActivities: () => Promise<void>;
  getFilteredActivities: () => Activity[];
}

import { apiClient } from '../services/apiClient';

export const useActivityStore = create<ActivityStoreState>((set, get) => ({
  activities: [],
  selectedActivity: null,
  filter: {
    searchQuery: '',
    tab: 'all',
    project: 'all',
    category: 'all',
    date: null,
  },
  isLoading: false,

  setSearchQuery: (searchQuery) =>
    set((state) => ({ filter: { ...state.filter, searchQuery } })),

  setTab: (tab) =>
    set((state) => ({ filter: { ...state.filter, tab } })),

  setProjectFilter: (project) =>
    set((state) => ({ filter: { ...state.filter, project } })),

  setCategoryFilter: (category) =>
    set((state) => ({ filter: { ...state.filter, category } })),

  setDateFilter: (date) =>
    set((state) => ({ filter: { ...state.filter, date } })),

  setSelectedActivity: (activity) =>
    set({ selectedActivity: activity }),

  getActivityById: (id: string) => {
    return get().activities.find((a) => a.id === id);
  },

  fetchActivities: async () => {
    set({ isLoading: true });
    try {
      const response: any = await apiClient.activities.getAll();
      const rawActivities = response.data?.activities || [];
      const formattedActivities = rawActivities.map((act: any) => {
        const dateObj = new Date(act.workDate);
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const title = act.title || act.project || (act.text ? (act.text.length > 50 ? act.text.slice(0, 50).trim() + '...' : act.text) : 'Work Entry');
        return {
          ...act,
          title,
          displayDate: `${day} ${month}`,
          dayNum: day,
          monthStr: month,
        };
      });
      set({ activities: formattedActivities, isLoading: false });
    } catch (e) {
      console.error(e);
      set({ activities: [], isLoading: false });
    }
  },

  addActivity: async (input: CreateActivityInput) => {
    set({ isLoading: true });
    try {
      const response: any = await apiClient.activities.create(input);
      const act = response.data?.activity || response.activity;
      
      const dateObj = new Date(act.workDate);
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      
      const title = act.title || act.project || (act.text ? (act.text.length > 50 ? act.text.slice(0, 50).trim() + '...' : act.text) : 'Work Entry');
      const newActivity = {
        ...act,
        title,
        displayDate: `${day} ${month}`,
        dayNum: day,
        monthStr: month,
      };

      set((state) => ({
        activities: [newActivity, ...state.activities],
        isLoading: false,
      }));
      return newActivity;
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  updateActivity: async (id: string, updates: Partial<Activity>) => {
    set({ isLoading: true });
    try {
      const response: any = await apiClient.activities.update(id, updates);
      const updatedData = response.data?.activity || response.activity;
      
      const dateObj = new Date(updatedData.workDate);
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      
      const title = updatedData.title || updatedData.project || (updatedData.text ? (updatedData.text.length > 50 ? updatedData.text.slice(0, 50).trim() + '...' : updatedData.text) : 'Work Entry');
      const updatedActivity = {
        ...updatedData,
        title,
        displayDate: `${day} ${month}`,
        dayNum: day,
        monthStr: month,
      };

      set((state) => ({
        activities: state.activities.map((item) => item.id === id ? updatedActivity : item),
        selectedActivity: state.selectedActivity?.id === id ? updatedActivity : state.selectedActivity,
        isLoading: false,
      }));

      return updatedActivity;
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  deleteActivity: async (id: string) => {
    set({ isLoading: true });
    try {
      await apiClient.activities.delete(id);
      set((state) => ({
        activities: state.activities.filter((a) => a.id !== id),
        selectedActivity: state.selectedActivity?.id === id ? null : state.selectedActivity,
        isLoading: false,
      }));
      return true;
    } catch (e) {
      set({ isLoading: false });
      return false;
    }
  },

  getFilteredActivities: () => {
    const { activities, filter } = get();
    return activities.filter((act) => {
      // Tab filter
      if (filter.tab === 'work' && act.category === 'Documentation') return false;
      if (filter.tab === 'achievements' && !act.isAchievement) return false;

      // Project filter
      if (filter.project && filter.project !== 'all' && act.project !== filter.project) {
        return false;
      }

      // Category filter
      if (filter.category && filter.category !== 'all' && act.category !== filter.category) {
        return false;
      }

      // Date filter
      if (filter.date) {
        const d = new Date(act.workDate);
        if (d.getDate() !== filter.date.getDate() || d.getMonth() !== filter.date.getMonth() || d.getFullYear() !== filter.date.getFullYear()) {
          return false;
        }
      }

      // Search query
      if (filter.searchQuery.trim()) {
        const query = filter.searchQuery.toLowerCase();
        const titleStr = act.title || act.project || act.text || '';
        const textStr = act.text || '';
        const projectStr = act.project || '';
        const matchesTitle = titleStr.toLowerCase().includes(query);
        const matchesText = textStr.toLowerCase().includes(query);
        const matchesProject = projectStr.toLowerCase().includes(query);
        const matchesSkills = (act.skills || []).some((s) => s.toLowerCase().includes(query));
        const matchesKeywords = (act.keywords || []).some((k) => k.toLowerCase().includes(query));
        return matchesTitle || matchesText || matchesProject || matchesSkills || matchesKeywords;
      }

      return true;
    });
  },
}));
