import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-lunch-break",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="lunch-break-indicator h-full w-full flex items-center justify-center relative"
    >
      <!-- Diagonal stripes background -->
      <div class="absolute inset-0 lunch-break-stripes opacity-20"></div>

      <!-- Content -->
      <div class="relative z-10 text-center">
        <div class="text-2xl mb-1">🍽️</div>
        <div class="text-xs font-medium text-orange-700 dark:text-orange-300">
          Lunch Break
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .lunch-break-indicator {
        background: linear-gradient(
          45deg,
          rgba(251, 146, 60, 0.1) 25%,
          transparent 25%,
          transparent 50%,
          rgba(251, 146, 60, 0.1) 50%,
          rgba(251, 146, 60, 0.1) 75%,
          transparent 75%
        );
        background-size: 20px 20px;
        border: 1px dashed #f59e0b;
        border-radius: 6px;
      }

      .lunch-break-stripes {
        background: repeating-linear-gradient(
          45deg,
          rgba(251, 146, 60, 0.1),
          rgba(251, 146, 60, 0.1) 2px,
          transparent 2px,
          transparent 8px
        );
      }

      :host {
        cursor: not-allowed;
      }
    `,
  ],
})
export class LunchBreakComponent {}
