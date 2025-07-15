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
      <div class="floating-card">
        <div class="card-header">
          <h4 class="appointment-title">{{ dragData()!.appointment.title }}</h4>
          <div class="patient-name">
            {{ dragData()!.appointment.patient?.name || "Patient" }}
          </div>
        </div>
        <div class="time-info">
          @if (dragData()!.viewType === 'month') {
          <div class="date-info">
            <span class="label">New Date:</span>
            <span class="value">{{
              formatDate(dragData()!.newDate || dragData()!.newStartTime)
            }}</span>
          </div>
          <div class="time-range">
            <span class="value"
              >{{ formatTime(originalStartTime()) }} –
              {{ formatTime(originalEndTime()) }}</span
            >
          </div>
          } @else {
          <div class="date-info">
            <span class="label">Date:</span>
            <span class="value">{{
              formatDate(dragData()!.newStartTime)
            }}</span>
          </div>
          <div class="time-range">
            <span class="label">Time:</span>
            <span class="value"
              >{{ formatTime(dragData()!.newStartTime) }} –
              {{ formatTime(dragData()!.newEndTime) }}</span
            >
          </div>
          }
        </div>
        <div class="status-indicator">
          @if (dragData()!.isValidTarget) {
          <i class="ri-check-line status-icon valid"></i>
          <span class="status-text">Valid position</span>
          } @else {
          <i class="ri-close-line status-icon invalid"></i>
          <span class="status-text">{{
            dragData()!.errorMessage || "Invalid position"
          }}</span>
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
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
}
