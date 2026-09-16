export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

type Listener = (toasts: ToastMessage[]) => void;

class ToastManager {
  private toasts: ToastMessage[] = [];
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  show(message: string, type: ToastType = 'info', duration: number = 3500) {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const toast: ToastMessage = { id, type, message, duration };
    this.toasts = [...this.toasts, toast];
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  success(message: string, duration: number = 3500) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration: number = 4500) {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration: number = 4000) {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration: number = 3500) {
    this.show(message, 'info', duration);
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }
}

export const toast = new ToastManager();
