import { create } from 'zustand';

interface Notification {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  description?: string;
}

interface Modal {
  isOpen: boolean;
  content?: React.ReactNode;
  title?: string;
}

interface UIState {
  loading: boolean;
  notification: Notification | null;
  modal: Modal;
  setLoading: (loading: boolean) => void;
  showNotification: (notification: Notification) => void;
  hideNotification: () => void;
  openModal: (content: React.ReactNode, title?: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  loading: false,
  notification: null,
  modal: { isOpen: false },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  showNotification: (notification: Notification) => {
    set({ notification });
    setTimeout(() => {
      set({ notification: null });
    }, 3000);
  },

  hideNotification: () => {
    set({ notification: null });
  },

  openModal: (content, title) => {
    set({ modal: { isOpen: true, content, title } });
  },

  closeModal: () => {
    set({ modal: { isOpen: false } });
  },
}));
