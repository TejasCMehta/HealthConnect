import { Injectable, signal } from "@angular/core";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

@Injectable({
  providedIn: "root",
})
export class ToasterService {
  private messages = signal<ToastMessage[]>([]);
  private idCounter = 0;

  public readonly toasts = this.messages.asReadonly();

  showSuccess(title: string, message?: string, duration: number = 4000): void {
    this.addToast({
      type: "success",
      title,
      message,
      duration,
      dismissible: true,
    });
  }

  showError(title: string, message?: string, duration: number = 6000): void {
    this.addToast({
      type: "error",
      title,
      message,
      duration,
      dismissible: true,
    });
  }

  showWarning(title: string, message?: string, duration: number = 5000): void {
    this.addToast({
      type: "warning",
      title,
      message,
      duration,
      dismissible: true,
    });
  }

  showInfo(title: string, message?: string, duration: number = 4000): void {
    this.addToast({
      type: "info",
      title,
      message,
      duration,
      dismissible: true,
    });
  }

  private addToast(toast: Omit<ToastMessage, "id">): void {
    const id = (++this.idCounter).toString();
    const newToast: ToastMessage = {
      ...toast,
      id,
    };

    this.messages.update((messages) => [...messages, newToast]);

    // Auto-dismiss after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.dismissToast(id);
      }, toast.duration);
    }
  }

  dismissToast(id: string): void {
    this.messages.update((messages) =>
      messages.filter((message) => message.id !== id)
    );
  }

  clearAll(): void {
    this.messages.set([]);
  }
}
