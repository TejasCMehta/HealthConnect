import {
  Component,
  input,
  output,
  inject,
  signal,
  OnDestroy,
  HostBinding,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Appointment } from "../../../../shared/models/appointment.model";
import { AppointmentResizeService } from "../../services/appointment-resize.service";

@Component({
  selector: "app-appointment-card",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./appointment-card.component.html",
  styleUrl: "./appointment-card.component.scss",
})
export class AppointmentCardComponent implements OnDestroy {
  private resizeService = inject(AppointmentResizeService);

  public appointment = input.required<Appointment>();
  public compact = input<boolean>(false);
  public enableResize = input<boolean>(true);
  public disableHover = input<boolean>(false); // Disable hover effects (useful for month view)
  public slotHeight = input<number>(30); // Height of each 30-minute slot

  @HostBinding("class.compact") get isCompact() {
    return this.compact();
  }
  @HostBinding("class.disable-hover") get isHoverDisabled() {
    return this.disableHover();
  }

  public resizeStart = output<{ appointment: Appointment; startY: number }>();
  public resizeUpdate = output<{
    appointment: Appointment;
    newEndTime: string;
  }>();
  public resizeComplete = output<{
    appointment: Appointment;
    newEndTime: string;
  }>();

  public isResizing = signal<boolean>(false);
  public currentEndTime = signal<string>("");

  private resizeStartY = 0;
  private resizeListeners: (() => void)[] = [];

  ngOnInit() {
    this.currentEndTime.set(this.appointment().endTime);
  }

  ngOnDestroy() {
    this.cleanupResizeListeners();
    // Clean up global classes if this component is destroyed during resize
    if (this.isResizing()) {
      document.body.classList.remove("appointment-resizing");
      document
        .querySelectorAll(".appointment-card.actively-resizing")
        .forEach((el) => {
          el.classList.remove("actively-resizing");
        });
    }
  }

  get startTime(): string {
    const date = new Date(this.appointment().startTime);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  get endTime(): string {
    // Use current end time during resizing, otherwise use original
    const timeToUse = this.isResizing()
      ? this.currentEndTime()
      : this.appointment().endTime;
    const date = new Date(timeToUse);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  get duration(): number {
    const start = new Date(this.appointment().startTime);
    const timeToUse = this.isResizing()
      ? this.currentEndTime()
      : this.appointment().endTime;
    const end = new Date(timeToUse);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
  }

  /**
   * Calculate dynamic height based on current end time (for real-time resize)
   */
  get dynamicHeight(): number {
    const start = new Date(this.appointment().startTime);
    const timeToUse = this.isResizing()
      ? this.currentEndTime()
      : this.appointment().endTime;
    const end = new Date(timeToUse);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    // Calculate exact number of 30-minute slots this appointment spans
    const slotsSpanned = durationMinutes / 30;

    // Each 30-minute slot has a height based on slotHeight input
    const totalHeight = slotsSpanned * this.slotHeight();

    return Math.max(this.slotHeight(), totalHeight);
  }

  get statusColor(): string {
    switch (this.appointment().status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  }

  /**
   * Start resize operation
   */
  onResizeStart(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    // Cancel any existing resize operation first
    const existingResizing = document.querySelector(
      ".appointment-card.actively-resizing"
    );
    if (
      existingResizing &&
      existingResizing !==
        (event.target as HTMLElement).closest(".appointment-card")
    ) {
      // Force complete the existing resize operation
      existingResizing.classList.remove("actively-resizing");
    }

    this.resizeStartY = event.clientY;
    this.isResizing.set(true);

    // Add global class to document body to indicate resize mode
    document.body.classList.add("appointment-resizing");

    // Add unique class to this appointment to identify it as the active one
    const appointmentElement = (event.target as HTMLElement).closest(
      ".appointment-card"
    );
    if (appointmentElement) {
      appointmentElement.classList.add("actively-resizing");
    }

    // Start resize in service
    this.resizeService.startResize(
      this.appointment(),
      this.resizeStartY,
      this.slotHeight()
    );

    // Emit resize start event
    this.resizeStart.emit({
      appointment: this.appointment(),
      startY: this.resizeStartY,
    });

    // Add global mouse listeners
    this.addResizeListeners();
  }

  /**
   * Handle mouse move during resize
   */
  private onResizeMove = (event: MouseEvent): void => {
    if (!this.isResizing()) return;

    const newEndTime = this.resizeService.updateResize(event.clientY);
    this.currentEndTime.set(newEndTime);

    this.resizeUpdate.emit({
      appointment: this.appointment(),
      newEndTime,
    });
  };

  /**
   * Handle mouse up - complete resize
   */
  private onResizeEnd = (event: MouseEvent): void => {
    if (!this.isResizing()) return;

    this.isResizing.set(false);
    this.cleanupResizeListeners();

    // Remove global classes
    document.body.classList.remove("appointment-resizing");
    document
      .querySelectorAll(".appointment-card.actively-resizing")
      .forEach((el) => {
        el.classList.remove("actively-resizing");
      });

    const validation = this.resizeService.validateResize();
    if (!validation.isValid) {
      // Reset to original end time
      this.currentEndTime.set(this.appointment().endTime);
      this.resizeService.cancelResize();
      return;
    }

    this.resizeComplete.emit({
      appointment: this.appointment(),
      newEndTime: this.currentEndTime(),
    });
  };

  /**
   * Add global mouse listeners for resize
   */
  private addResizeListeners(): void {
    const onMouseMove = this.onResizeMove;
    const onMouseUp = this.onResizeEnd;

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseUp);

    this.resizeListeners = [
      () => document.removeEventListener("mousemove", onMouseMove),
      () => document.removeEventListener("mouseup", onMouseUp),
      () => document.removeEventListener("mouseleave", onMouseUp),
    ];
  }

  /**
   * Clean up resize listeners
   */
  private cleanupResizeListeners(): void {
    this.resizeListeners.forEach((cleanup) => cleanup());
    this.resizeListeners = [];
  }
}
