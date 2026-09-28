export interface User {
  id: string;
  name: string;
  email: string;
  jobRole: string;
  department: string;
  reviewYear: number;
  skills?: string[];
  currentProjects?: string[];
  joiningDate?: string;
  professionalBackground?: string;
  avatarUrl?: string;
  initials: string;
  isProfileCompleted: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profile: Partial<User> | ProfileSetupFormData) => Promise<boolean>;
  fetchProfile: () => Promise<void>;
}

export interface ProfileSetupFormData {
  name: string;
  jobRole: string;
  department: string;
  reviewYear: number;
  skills?: string[];
  currentProjects?: string[];
  joiningDate?: string;
  professionalBackground?: string;
}
