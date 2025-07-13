import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss'
})
export class ConfirmationDialogComponent {
  public isOpen = signal(false);
  public config = signal<ConfirmationConfig>({
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmButtonClass: 'bg-red-600 hover:bg-red-700'
  });
  
  private resolvePromise: ((value: boolean) => void) | null = null;
  
  open(config: ConfirmationConfig): Promise<boolean> {
    this.config.set({
      ...this.config(),
      ...config
    });
    this.isOpen.set(true);
    
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
    });
  }
  
  confirm(): void {
    this.close(true);
  }
  
  cancel(): void {
    this.close(false);
  }
  
  private close(result: boolean): void {
    this.isOpen.set(false);
    if (this.resolvePromise) {
      this.resolvePromise(result);
      this.resolvePromise = null;
    }
  }
}
