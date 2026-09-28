import { create } from 'zustand';

export interface AppNotification {
  id: string;
  type: 'success' | 'info' | 'error' | 'ai' | string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetRoute?: string;
  targetId?: string;
  duration?: number; // ms, defaults to 4500
}

interface NotificationStore {
  notifications: AppNotification[];
  toasts: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  removeToast: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  toasts: [],
  addNotification: (notif) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newEntry: AppNotification = {
      ...notif,
      id,
      timestamp: new Date().toISOString(),
      read: false,
      duration: notif.duration || 4500,
    };

    set((state) => ({
      notifications: [newEntry, ...state.notifications],
      toasts: [newEntry, ...state.toasts].slice(0, 5), // Keep max 5 visible toasts at once
    }));

    return id;
  },
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
    toasts: state.toasts.filter((n) => n.id !== id),
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((n) => n.id !== id),
  })),
}));
