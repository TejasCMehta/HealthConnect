import {
  Component,
  input,
  computed,
  signal,
  ElementRef,
  inject,
  OnInit,
  OnDestroy,
  effect,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Appointment } from "../../../../shared/models/appointment.model";

export interface FloatingDragData {
  appointment: Appointment;
  newStartTime: string;
  newEndTime: string;
  newDate?: string; // For month view
  isValidTarget: boolean;
  mouseX: number;
  mouseY: number;
  viewType: "week" | "day" | "month";
  errorMessage?: string | null; // Specific error message for invalid targets
}

@Component({
  selector: "app-floating-drag-preview",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="dragData()"
      class="floating-drag-preview"
      [class.valid-target]="dragData()!.isValidTarget"
      [class.invalid-target]="!dragData()!.isValidTarget"
      [style.left.px]="cardPosition().x"
      [style.top.px]="cardPosition().y"
    >
      <div
        class="floating-card bg-white dark:bg-gray-800 border-2 rounded-lg shadow-xl p-3 min-w-[250px] max-w-[300px]"
        [class]="
          dragData()!.isValidTarget
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-red-500 bg-red-50 dark:bg-red-900/20'
        "
      >
        <div class="card-header mb-2">
          <h4
            class="appointment-title text-sm font-semibold mb-1 text-gray-900 dark:text-white"
          >
            {{ dragData()!.appointment.title }}
          </h4>
          <div class="patient-name text-xs text-gray-600 dark:text-gray-300">
            {{ dragData()!.appointment.patient?.name || "Patient" }}
          </div>
        </div>
        <div class="time-info mb-2">
          @if (dragData()!.viewType === 'month') {
          <div class="date-info flex items-center mb-1">
            <span
              class="label text-xs font-medium text-gray-500 dark:text-gray-400 mr-2 min-w-[35px]"
              >New Date:</span
            >
            <span
              class="value text-xs font-medium text-gray-700 dark:text-gray-200"
              >{{
                formatDate(dragData()!.newDate || dragData()!.newStartTime)
              }}</span
            >
          </div>
          <div class="time-range flex items-center">
            <span
              class="value text-xs font-medium text-gray-700 dark:text-gray-200"
              >{{ formatTime(originalStartTime()) }} –
              {{ formatTime(originalEndTime()) }}</span
            >
          </div>
          } @else {
          <div class="date-info flex items-center mb-1">
            <span
              class="label text-xs font-medium text-gray-500 dark:text-gray-400 mr-2 min-w-[35px]"
              >Date:</span
            >
            <span
              class="value text-xs font-medium text-gray-700 dark:text-gray-200"
              >{{ formatDate(dragData()!.newStartTime) }}</span
            >
          </div>
          <div class="time-range flex items-center">
            <span
              class="label text-xs font-medium text-gray-500 dark:text-gray-400 mr-2 min-w-[35px]"
              >Time:</span
            >
            <span
              class="value text-xs font-medium text-gray-700 dark:text-gray-200"
              >{{ formatTime(dragData()!.newStartTime) }} –
              {{ formatTime(dragData()!.newEndTime) }}</span
            >
          </div>
          }
        </div>
        <div class="status-indicator flex items-center text-xs">
          @if (dragData()!.isValidTarget) {
          <i
            class="ri-check-line text-green-600 dark:text-green-400 mr-1 text-sm"
          ></i>
          <span
            class="status-text font-medium text-green-700 dark:text-green-300"
            >Valid position</span
          >
          } @else {
          <i
            class="ri-close-line text-red-600 dark:text-red-400 mr-1 text-sm"
          ></i>
          <span
            class="status-text font-medium text-red-700 dark:text-red-300"
            >{{ dragData()!.errorMessage || "Invalid position" }}</span
          >
          }
        </div>
      </div>
    </div>
  `,
  styleUrl: "./floating-drag-preview.component.scss",
})
export class FloatingDragPreviewComponent implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);

  public dragData = input<FloatingDragData | null>(null);

  private cardOffset = signal({ x: 15, y: -10 }); // Offset from cursor

  // Computed original times for month view
  public originalStartTime = computed(() => {
    const data = this.dragData();
    return data ? data.appointment.startTime : "";
  });

  public originalEndTime = computed(() => {
    const data = this.dragData();
    return data ? data.appointment.endTime : "";
  });

  // Computed card position with viewport boundary checks
  public cardPosition = computed(() => {
    const data = this.dragData();
    if (!data) return { x: 0, y: 0 };

    const offset = this.cardOffset();
    let x = data.mouseX + offset.x;
    let y = data.mouseY + offset.y;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Estimate card dimensions (will be refined after DOM update)
    const cardWidth = 280;
    const cardHeight = 120;

    // Adjust position if card would go outside viewport
    if (x + cardWidth > viewportWidth) {
      x = data.mouseX - cardWidth - 15; // Flip to left side
    }

    if (y + cardHeight > viewportHeight) {
      y = data.mouseY - cardHeight - 15; // Flip to top side
    }

    // Ensure minimum distance from edges
    x = Math.max(10, Math.min(x, viewportWidth - cardWidth - 10));
    y = Math.max(10, Math.min(y, viewportHeight - cardHeight - 10));

    return { x, y };
  });

  constructor() {
    // Effect to append/remove the component from document body
    effect(() => {
      const data = this.dragData();
      if (data) {
        // Append to body for proper z-index layering
        document.body.appendChild(this.elementRef.nativeElement);
      } else {
        // Remove from body when not dragging
        if (this.elementRef.nativeElement.parentNode === document.body) {
          document.body.removeChild(this.elementRef.nativeElement);
        }
      }
    });
  }

  ngOnInit() {
    // Set initial z-index to be above everything else
    this.elementRef.nativeElement.style.zIndex = "10000";
    this.elementRef.nativeElement.style.position = "fixed";
    this.elementRef.nativeElement.style.pointerEvents = "none";
  }

  ngOnDestroy() {
    // Clean up - remove from body if still attached
    if (this.elementRef.nativeElement.parentNode === document.body) {
      document.body.removeChild(this.elementRef.nativeElement);
    }
  }

  formatTime(timeString: string): string {
    try {
      // Handle ISO format strings
      const date = new Date(timeString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        // Try parsing as time only (HH:MM format)
        const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})$/);
        if (timeMatch) {
          const [, hours, minutes] = timeMatch;
          return `${hours.padStart(2, "0")}:${minutes}`;
        }
        return timeString; // Return original string if parsing fails
      }

      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      console.warn("Error formatting time:", timeString, error);
      return timeString;
    }
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if parsing fails
      }

      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.warn("Error formatting date:", dateString, error);
      return dateString;
    }
  }
}
