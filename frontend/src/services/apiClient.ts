import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class ApiClient {
  public client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // For refresh cookies if used
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('worklog_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 and we haven't retried yet, and it's not the refresh endpoint itself
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh') && !originalRequest.url.includes('/auth/login')) {
          originalRequest._retry = true;
          
          try {
            // Attempt to refresh token using HttpOnly cookie
            const response: any = await this.client.post('/auth/refresh');
            const newAccessToken = response.data?.tokens?.accessToken || response.tokens?.accessToken;
            
            if (newAccessToken) {
              // Save new access token
              localStorage.setItem('worklog_access_token', newAccessToken);
              // Update authorization header and retry original request
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear token (user will be forced to log in)
            localStorage.removeItem('worklog_access_token');
            return Promise.reject(refreshError);
          }
        }
        
        console.error('[ApiClient Error]', error.response?.data || error.message);
        return Promise.reject(error.response?.data || error);
      }
    );
  }

  auth = {
    login: (email: string, password: string) => 
      this.client.post('/auth/login', { email, password }),
    signup: (name: string, email: string, password: string) => 
      this.client.post('/auth/signup', { name, email, password }),
    refreshToken: (refreshToken: string) => 
      this.client.post('/auth/refresh', { refreshToken }),
    logout: () => 
      this.client.post('/auth/logout'),
  };

  profile = {
    get: () => this.client.get('/profile'),
    setup: (profileData: { name: string; jobRole: string; department: string; reviewYear: number }) => 
      this.client.post('/profile/setup', profileData),
    update: (profileData: any) => this.client.patch('/profile', profileData),
  };

  activities = {
    getAll: (params?: { page?: number; limit?: number; project?: string; category?: string; q?: string }) => 
      this.client.get('/activities', { params }),
    getById: (id: string) => this.client.get(`/activities/${id}`),
    create: (data: any) => this.client.post('/activities', data),
    update: (id: string, data: any) => this.client.patch(`/activities/${id}`, data),
    delete: (id: string) => this.client.delete(`/activities/${id}`),
    improveWithAI: (id: string) => this.client.post(`/activities/${id}/improve`),
    previewEnrich: (data: { text: string; project?: string }) => this.client.post('/activities/enrich-preview', data),
  };

  search = {
    ask: (query: string) => this.client.post('/search/ask', { query })
  };

  achievedGoals = {
    getAll: (params?: { year?: number; project?: string }) => 
      this.client.get('/achieved-goals', { params }),
    getById: (id: string) => this.client.get(`/achieved-goals/${id}`),
    create: (data: any) => this.client.post('/achieved-goals', data),
    update: (id: string, data: any) => this.client.patch(`/achieved-goals/${id}`, data),
    delete: (id: string) => this.client.delete(`/achieved-goals/${id}`),
  };

  reports = {
    checkAvailability: (year: number) => this.client.get(`/reports/yearly/${year}/availability`),
    generate: (year: number, forceNewVersion: boolean = false) => 
      this.client.post(`/reports/yearly/${year}/generate`, { forceNewVersion }),
    get: (year: number, version?: number) => 
      this.client.get(`/reports/yearly/${year}`, { params: version ? { version } : undefined }),
    unlock: (year: number, version?: number) => 
      this.client.post(`/reports/yearly/${year}/unlock`, { version }),
    finalize: (year: number, version?: number) => 
      this.client.post(`/reports/yearly/${year}/finalize`, { version }),
    editSection: (year: number, name: string, content: string, version?: number) =>
      this.client.patch(`/reports/yearly/${year}/section/${name}`, { content }, { params: version ? { version } : undefined }),
    regenerateSection: (year: number, name: string, version?: number) =>
      this.client.post(`/reports/yearly/${year}/section/${name}/regenerate`, {}, { params: version ? { version } : undefined }),
    listVersions: (year: number) => this.client.get(`/reports/yearly/${year}/versions`),
    merge: (year: number, report: any) => this.client.post(`/reports/yearly/${year}/merge`, { report }),
    deleteDraft: (year: number, version?: number) =>
      this.client.delete(`/reports/yearly/${year}`, { params: version ? { version } : undefined }),
  };

  insights = {
    getOverview: (year?: number) => this.client.get('/insights/overview', { params: { year } }),
    getAI: (year?: number) => this.client.get('/insights/ai', { params: { year } }),
  };

  summaries = {
    getWeekly: (weekStart: string) => this.client.get('/summaries/weekly', { params: { weekStart } }),
    generateWeekly: (weekStart: string, weekEnd?: string) =>
      this.client.post('/summaries/weekly/generate', { weekStart, weekEnd }),
    regenerateWeekly: (id: string) => this.client.post(`/summaries/weekly/${id}/regenerate`),
    getMonthly: (year: number, month: number) =>
      this.client.get('/summaries/monthly', { params: { year, month } }),
    generateMonthly: (year: number, month: number) =>
      this.client.post('/summaries/monthly/generate', { year, month }),
    regenerateMonthly: (id: string) => this.client.post(`/summaries/monthly/${id}/regenerate`),
    deleteMonthly: (year: number, month: number) =>
      this.client.delete('/summaries/monthly', { params: { year, month } }),
  };
}

export const apiClient = new ApiClient();
