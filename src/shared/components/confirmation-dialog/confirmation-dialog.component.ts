import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  trigger,
  transition,
  style,
  animate,
  state,
} from "@angular/animations";

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

@Component({
  selector: "app-confirmation-dialog",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./confirmation-dialog.component.html",
  styleUrl: "./confirmation-dialog.component.scss",
  animations: [
    trigger("fadeInOut", [
      transition(":enter", [
        style({ opacity: 0 }),
        animate("300ms ease-in", style({ opacity: 1 })),
      ]),
      transition(":leave", [animate("200ms ease-out", style({ opacity: 0 }))]),
    ]),
    trigger("slideInOut", [
      transition(":enter", [
        style({
          transform: "scale(0.7) translateY(-50px)",
          opacity: 0,
        }),
        animate(
          "300ms cubic-bezier(0.35, 0, 0.25, 1)",
          style({
            transform: "scale(1) translateY(0)",
            opacity: 1,
          })
        ),
      ]),
      transition(":leave", [
        animate(
          "200ms ease-in",
          style({
            transform: "scale(0.9) translateY(-20px)",
            opacity: 0,
          })
        ),
      ]),
    ]),
  ],
})
export class ConfirmationDialogComponent {
  public isOpen = signal(false);
  public config = signal<ConfirmationConfig>({
    title: "Confirm Action",
    message: "Are you sure you want to proceed?",
    confirmText: "Confirm",
    cancelText: "Cancel",
    confirmButtonClass: "bg-red-600 hover:bg-red-700",
  });

  private resolvePromise: ((value: boolean) => void) | null = null;

  open(config: ConfirmationConfig): Promise<boolean> {
    this.config.set({
      ...this.config(),
      ...config,
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
    // Small delay to allow exit animation to complete
    setTimeout(() => {
      if (this.resolvePromise) {
        this.resolvePromise(result);
        this.resolvePromise = null;
      }
    }, 250);
  }
}
