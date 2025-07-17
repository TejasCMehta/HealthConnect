import {
  Component,
  input,
  output,
  computed,
  signal,
  inject,
  OnInit,
  OnChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Appointment } from "../../../../shared/models/appointment.model";
import {
  SettingsService,
  Settings,
} from "../../../settings/services/settings.service";

export interface PopoverPosition {
  x: number;
  y: number;
  triggerRect?: DOMRect;
  placement?: "top" | "bottom" | "left" | "right";
}

@Component({
  selector: "app-appointment-popover",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./appointment-popover.component.html",
  styleUrl: "./appointment-popover.component.scss",
})
export class AppointmentPopoverComponent implements OnInit, OnChanges {
  private settingsService = inject(SettingsService);

  // Settings signal
  private settingsSignal = signal<Settings | null>(null);

  public appointment = input.required<Appointment>();
  public isOpen = input<boolean>(false);
  public position = input<PopoverPosition>({ x: 0, y: 0 });
  public isPastAppointment = input<boolean>(false);

  public edit = output<void>();
  public delete = output<void>();
  public close = output<void>();

  // Animation state
  private animationState = signal<"closed" | "opening" | "open" | "closing">(
    "closed"
  );

  // Computed properties for positioning and animation
  public popoverClasses = computed(() => {
    const state = this.animationState();
    const baseClasses =
      "fixed z-50 w-80 max-h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 transform transition-all duration-300 ease-out overflow-visible";

    switch (state) {
      case "opening":
        return `${baseClasses} scale-95 opacity-0`;
      case "open":
        return `${baseClasses} scale-100 opacity-100`;
      case "closing":
        return `${baseClasses} scale-95 opacity-0`;
      default:
        return `${baseClasses} scale-95 opacity-0`;
    }
  });
  public diamondPointerStyles = computed(() => {
    const pos = this.position();
    if (!pos.triggerRect) {
      return { display: "none" };
    }

    const triggerRect = pos.triggerRect;
    // Use getOptimalPlacement if placement is not provided
    const placement =
      pos.placement ||
      this.getOptimalPlacement(triggerRect, { x: pos.x, y: pos.y });

    // Calculate the center of the trigger element
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    const triggerCenterY = triggerRect.top + triggerRect.height / 2;

    let pointerStyles: any = {
      display: "block",
    };

    // Triangle arrow dimensions: 24px wide (12px + 12px), 16px tall
    // For centering: -12px for width, -8px for height
    const triangleHalfWidth = 12;
    const triangleHeight = 16;

    // Position the triangle arrow to point toward appointment
    switch (placement) {
      case "top":
        // Popover is below trigger, arrow points UP toward the appointment
        const leftPosition = Math.max(
          16, // Minimum distance from left edge
          Math.min(triggerCenterX - pos.x - triangleHalfWidth, 320 - 32) // Maximum distance from right edge
        );
        pointerStyles = {
          ...pointerStyles,
          top: `-${triangleHeight}px`,
          left: `${leftPosition}px`,
        };
        break;
      case "bottom":
        // Popover is above trigger, arrow points DOWN toward the appointment
        const leftPositionBottom = Math.max(
          16,
          Math.min(triggerCenterX - pos.x - triangleHalfWidth, 320 - 32)
        );
        pointerStyles = {
          ...pointerStyles,
          bottom: `-${triangleHeight}px`,
          left: `${leftPositionBottom}px`,
        };
        break;
      case "left":
        // Popover is to the right of trigger, arrow points LEFT toward the appointment
        const topPositionLeft = Math.max(
          16,
          Math.min(triggerCenterY - pos.y - triangleHalfWidth, 350 - 32)
        );
        pointerStyles = {
          ...pointerStyles,
          left: `-${triangleHeight}px`,
          top: `${topPositionLeft}px`,
        };
        break;
      case "right":
        // Popover is to the left of trigger, arrow points RIGHT toward the appointment
        const topPositionRight = Math.max(
          16,
          Math.min(triggerCenterY - pos.y - triangleHalfWidth, 350 - 32)
        );
        pointerStyles = {
          ...pointerStyles,
          right: `-${triangleHeight}px`,
          top: `${topPositionRight}px`,
        };
        break;
    }

    return pointerStyles;
  });

  public arrowClasses = computed(() => {
    const pos = this.position();
    if (!pos.triggerRect) {
      return "popover-arrow";
    }

    // Use getOptimalPlacement if placement is not provided
    const placement =
      pos.placement ||
      this.getOptimalPlacement(pos.triggerRect, { x: pos.x, y: pos.y });

    return `popover-arrow popover-arrow-${placement}`;
  });

  private getPopoverRect(): DOMRect | null {
    // This would be set by the component after it's rendered
    // For now, return approximate dimensions
    return {
      width: 320,
      height: 350,
      top: this.position().y,
      left: this.position().x,
      bottom: this.position().y + 350,
      right: this.position().x + 320,
      x: this.position().x,
      y: this.position().y,
    } as DOMRect;
  }

  private getOptimalPlacement(
    triggerRect: DOMRect,
    popoverPos: { x: number; y: number }
  ): "top" | "bottom" | "left" | "right" {
    // Determine placement based on the actual position relationship
    const popoverBottom = popoverPos.y + 350;
    const popoverRight = popoverPos.x + 320;

    // Check if popover is positioned below the trigger (most common case)
    if (popoverPos.y >= triggerRect.bottom) {
      return "top"; // Pointer should point up to the trigger
    }
    // Check if popover is positioned above the trigger
    else if (popoverBottom <= triggerRect.top) {
      return "bottom"; // Pointer should point down to the trigger
    }
    // Check if popover is positioned to the right of the trigger
    else if (popoverPos.x >= triggerRect.right) {
      return "left"; // Pointer should point left to the trigger
    }
    // Popover is positioned to the left of the trigger
    else {
      return "right"; // Pointer should point right to the trigger
    }
  }

  // Animation and lifecycle management
  ngOnInit() {
    if (this.isOpen()) {
      this.startOpenAnimation();
    }

    // Load settings for status colors
    this.settingsService.getSettings().subscribe({
      next: (settings) => {
        this.settingsSignal.set(settings);
      },
      error: (error) => {
        console.error("Error loading settings in appointment popover:", error);
        this.settingsSignal.set(null);
      },
    });
  }

  ngOnChanges() {
    if (this.isOpen() && this.animationState() === "closed") {
      this.startOpenAnimation();
    } else if (!this.isOpen() && this.animationState() === "open") {
      this.startCloseAnimation();
    }
  }

  private startOpenAnimation() {
    this.animationState.set("opening");
    // Small delay to ensure the DOM is ready
    setTimeout(() => {
      this.animationState.set("open");
    }, 10);
  }

  private startCloseAnimation() {
    this.animationState.set("closing");
    setTimeout(() => {
      this.animationState.set("closed");
    }, 300); // Match the CSS transition duration
  }

  isPointingUp(): boolean {
    // Check if popover is positioned above the clicked element
    // This would be true when we had to flip the popover to avoid bottom overflow
    const popoverY = this.position().y;
    const viewportHeight = window.innerHeight;
    const popoverHeight = 350; // approximate

    // If the popover would extend beyond the bottom of the viewport,
    // it was likely positioned above the element (pointing down)
    return popoverY + popoverHeight > viewportHeight - 50;
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatDateRange(): string {
    const startDate = new Date(this.appointment().startTime);
    const endDate = new Date(this.appointment().endTime);

    // Format the date part
    const dateStr = startDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // Format the time range
    const startTime = startDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const endTime = endDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${dateStr}, ${startTime} - ${endTime}`;
  }

  formatDate(): string {
    const startDate = new Date(this.appointment().startTime);

    return startDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  formatTimeRange(): string {
    const startDate = new Date(this.appointment().startTime);
    const endDate = new Date(this.appointment().endTime);

    const startTime = startDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const endTime = endDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${startTime} - ${endTime}`;
  }

  getPatientName(): string {
    return (
      this.appointment().patient?.name ||
      `Patient ID: ${this.appointment().patientId}`
    );
  }

  getDoctorName(): string {
    return (
      this.appointment().doctor?.name ||
      `Doctor ID: ${this.appointment().doctorId}`
    );
  }

  onEdit(): void {
    this.edit.emit();
    this.startCloseAnimation();
    setTimeout(() => this.close.emit(), 300);
  }

  onDelete(): void {
    this.delete.emit();
    this.startCloseAnimation();
    setTimeout(() => this.close.emit(), 300);
  }

  onBackdropClick(): void {
    this.startCloseAnimation();
    setTimeout(() => this.close.emit(), 300);
  }

  onCloseClick(): void {
    this.startCloseAnimation();
    setTimeout(() => this.close.emit(), 300);
  }

  getStatusColor(): string {
    const settings = this.settingsSignal();
    const status = this.appointment().status.toLowerCase();

    if (settings && settings.appointments.statusColors) {
      const statusKey =
        status as keyof typeof settings.appointments.statusColors;
      const color = settings.appointments.statusColors[statusKey];

      if (color) {
        // Convert hex color to Tailwind-like classes
        return this.getStatusClassFromColor(color, status);
      }
    }

    // Fallback to default status colors
    switch (status) {
      case "scheduled":
      case "schedule":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "completed":
      case "complete":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
      case "canceled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "confirmed":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "no-show":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  }

  private getStatusClassFromColor(hexColor: string, status: string): string {
    // Map common colors to Tailwind classes
    const colorMap: { [key: string]: string } = {
      "#3B82F6":
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "#10B981":
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      "#EF4444": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "#059669":
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "#9CA3AF":
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      "#F59E0B":
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };

    const upperColor = hexColor.toUpperCase();
    if (colorMap[upperColor]) {
      return colorMap[upperColor];
    }

    // Default fallback based on status
    switch (status) {
      case "scheduled":
      case "schedule":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "completed":
      case "complete":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
      case "canceled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "confirmed":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "no-show":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  }
}
