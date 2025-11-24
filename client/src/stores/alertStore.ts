import { create } from 'zustand';

interface AlertOptions {
  title?: string;
  message: string;
}

interface AlertStore {
  alert: AlertOptions | null;
  showAlert: (message: string, title?: string) => void;
  closeAlert: () => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alert: null,
  showAlert: (message: string, title?: string) => set({ alert: { message, title } }),
  closeAlert: () => set({ alert: null }),
}));
