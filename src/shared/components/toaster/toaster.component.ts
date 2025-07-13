import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ToasterService, ToastMessage } from "../../services/toaster.service";

@Component({
  selector: "app-toaster",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] space-y-2 pointer-events-none px-4 w-full max-w-lg"
    >
      @for (toast of toasterService.toasts(); track toast.id) {
      <div
        class="pointer-events-auto w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-slideInDown"
        [class]="getToastClasses(toast.type)"
      >
        <div class="p-3 sm:p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <i
                [class]="getIconClass(toast.type)"
                class="text-lg sm:text-xl"
              ></i>
            </div>
            <div class="ml-3 flex-1 min-w-0">
              <p
                class="text-sm font-medium truncate"
                [class]="getTitleClasses(toast.type)"
              >
                {{ toast.title }}
              </p>
              @if (toast.message) {
              <p
                class="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
              >
                {{ toast.message }}
              </p>
              }
            </div>
            @if (toast.dismissible) {
            <div class="ml-4 flex-shrink-0 flex">
              <button
                (click)="dismissToast(toast.id)"
                class="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
              >
                <span class="sr-only">Close</span>
                <i class="ri-close-line text-lg"></i>
              </button>
            </div>
            }
          </div>
        </div>
        <!-- Progress bar for auto-dismiss -->
        @if (toast.duration && toast.duration > 0) {
        <div class="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            class="h-full bg-current animate-shrink"
            [class]="getProgressBarClass(toast.type)"
            [style.animation-duration]="toast.duration + 'ms'"
          ></div>
        </div>
        }
      </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes slideInDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes shrink {
        from {
          width: 100%;
        }
        to {
          width: 0%;
        }
      }

      .animate-slideInDown {
        animation: slideInDown 0.3s ease-out;
      }

      .animate-shrink {
        animation: shrink linear;
      }
    `,
  ],
})
export class ToasterComponent implements OnInit {
  public toasterService = inject(ToasterService);

  ngOnInit(): void {
    // Component is ready
  }

  dismissToast(id: string): void {
    this.toasterService.dismissToast(id);
  }

  getToastClasses(type: string): string {
    const baseClasses = "border-l-4";
    switch (type) {
      case "success":
        return `${baseClasses} border-green-500`;
      case "error":
        return `${baseClasses} border-red-500`;
      case "warning":
        return `${baseClasses} border-yellow-500`;
      case "info":
        return `${baseClasses} border-blue-500`;
      default:
        return `${baseClasses} border-gray-500`;
    }
  }

  getTitleClasses(type: string): string {
    switch (type) {
      case "success":
        return "text-green-800 dark:text-green-400";
      case "error":
        return "text-red-800 dark:text-red-400";
      case "warning":
        return "text-yellow-800 dark:text-yellow-400";
      case "info":
        return "text-blue-800 dark:text-blue-400";
      default:
        return "text-gray-800 dark:text-gray-400";
    }
  }

  getIconClass(type: string): string {
    switch (type) {
      case "success":
        return "ri-check-circle-fill text-green-500";
      case "error":
        return "ri-error-warning-fill text-red-500";
      case "warning":
        return "ri-alert-fill text-yellow-500";
      case "info":
        return "ri-information-fill text-blue-500";
      default:
        return "ri-notification-3-fill text-gray-500";
    }
  }

  getProgressBarClass(type: string): string {
    switch (type) {
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  }
}
