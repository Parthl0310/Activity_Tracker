import { create } from 'zustand';
import { AuthState, ProfileSetupFormData, User } from '../types/auth';
import { apiClient } from '../services/apiClient';
import { getInitials } from '../utils/stringUtils';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('worklog_access_token') || null,
  refreshToken: null,
  isAuthenticated: !!localStorage.getItem('worklog_access_token'),
  isInitialized: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response: any = await apiClient.auth.login(email, password);
      // The backend wraps response in { success: true, data: { user, tokens } }
      const { user, tokens } = response.data || response;
      
      const initials = getInitials(user.name);

      const appUser: User = {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        jobRole: user.jobRole || '',
        department: user.department || '',
        reviewYear: user.reviewYear || 2026,
        skills: user.skills || [],
        currentProjects: user.currentProjects || [],
        joiningDate: user.joiningDate ? new Date(user.joiningDate).toISOString().slice(0, 10) : '',
        professionalBackground: user.professionalBackground || '',
        initials,
        isProfileCompleted: Boolean(user.profileCompleted || user.jobRole || (user.skills && user.skills.length > 0)),
      };

      localStorage.setItem('worklog_access_token', tokens.accessToken);
      set({ user: appUser, token: tokens.accessToken, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signup: async (name: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response: any = await apiClient.auth.signup(name, email, password);
      const { user, tokens } = response.data || response;

      const initials = name
        .split(' ')
        .map((n) => n[0]?.toUpperCase())
        .join('')
        .slice(0, 2) || 'US';

      const appUser: User = {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        jobRole: '',
        department: '',
        reviewYear: 2026,
        initials,
        isProfileCompleted: false,
      };

      localStorage.setItem('worklog_access_token', tokens.accessToken);
      set({ user: appUser, token: tokens.accessToken, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiClient.auth.logout();
    } catch (e) {
      console.warn("Logout request failed, clearing local state anyway");
    }
    localStorage.removeItem('worklog_access_token');
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  updateProfile: async (profileData: Partial<User> | ProfileSetupFormData) => {
    set({ isLoading: true });
    try {
      let response: any;
      try {
        response = await apiClient.profile.update(profileData as any);
      } catch (patchErr) {
        response = await apiClient.profile.setup(profileData as any);
      }
      const user = response.data?.profile || response.profile;
      
      const initials = getInitials(user.name);

      const appUser: User = {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        jobRole: user.jobRole || '',
        department: user.department || '',
        reviewYear: user.reviewYear || 2026,
        skills: user.skills || [],
        currentProjects: user.currentProjects || [],
        joiningDate: user.joiningDate ? new Date(user.joiningDate).toISOString().slice(0, 10) : '',
        professionalBackground: user.professionalBackground || '',
        initials,
        isProfileCompleted: true,
      };

      set({ user: appUser, isLoading: false });
      return true;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchProfile: async () => {
    const token = localStorage.getItem('worklog_access_token');
    if (!token) {
      set({ isInitialized: true });
      return;
    }
    
    set({ isLoading: true });
    try {
      const response: any = await apiClient.profile.get();
      const user = response.data?.profile || response.profile;
      
      const initials = getInitials(user.name);

      const appUser: User = {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        jobRole: user.jobRole || '',
        department: user.department || '',
        reviewYear: user.reviewYear || 2026,
        skills: user.skills || [],
        currentProjects: user.currentProjects || [],
        joiningDate: user.joiningDate ? new Date(user.joiningDate).toISOString().slice(0, 10) : '',
        professionalBackground: user.professionalBackground || '',
        initials,
        isProfileCompleted: Boolean(user.profileCompleted || user.jobRole || (user.skills && user.skills.length > 0)),
      };

      set({ user: appUser, isAuthenticated: true, isLoading: false, isInitialized: true });
    } catch (error: any) {
      console.error('Failed to fetch profile', error);
      // Clear token on auth error
      const isAuthError =
        error?.response?.status === 401 ||
        error?.response?.status === 403 ||
        error?.status === 401 ||
        error?.statusCode === 401 ||
        error?.code === 'TOKEN_EXPIRED' ||
        (typeof error?.message === 'string' && error.message.toLowerCase().includes('token'));

      if (isAuthError) {
        localStorage.removeItem('worklog_access_token');
      }
      set({ user: null, token: null, isAuthenticated: false, isLoading: false, isInitialized: true });
    }
  },
}));
