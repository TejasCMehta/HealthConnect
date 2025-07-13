import { Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-field-error",
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (errorMessage()) {
    <div
      class="mt-1 flex items-center text-sm text-red-600 dark:text-red-400 animate-slideIn"
    >
      <i class="ri-error-warning-line mr-1 text-xs"></i>
      <span>{{ errorMessage() }}</span>
    </div>
    }
  `,
  styles: [
    `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-slideIn {
        animation: slideIn 0.2s ease-out;
      }
    `,
  ],
})
export class FieldErrorComponent {
  errorMessage = input<string | null>(null);
}
