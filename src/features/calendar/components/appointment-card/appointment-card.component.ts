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
import { Doctor } from "../../../../shared/models/doctor.model";
import { AppointmentResizeService } from "../../services/appointment-resize.service";
import { AppointmentDragDropService } from "../../services/appointment-drag-drop.service";

@Component({
  selector: "app-appointment-card",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./appointment-card.component.html",
  styleUrl: "./appointment-card.component.scss",
})
export class AppointmentCardComponent implements OnDestroy {
  private resizeService = inject(AppointmentResizeService);
  private dragDropService = inject(AppointmentDragDropService);

  public appointment = input.required<Appointment>();
  public compact = input<boolean>(false);
  public enableResize = input<boolean>(true);
  public enableDrag = input<boolean>(true);
  public disableHover = input<boolean>(false); // Disable hover effects (useful for month view)
  public slotHeight = input<number>(30); // Height of each 30-minute slot
  public doctors = input<Doctor[]>([]); // Available doctors for horizontal drag
  public gridContainer = input<HTMLElement | null>(null); // Grid container for drag calculations
  public weekDays = input<Date[]>([]); // Week days array for cross-day dragging in week view

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

  // Drag and drop outputs
  public dragStart = output<{
    appointment: Appointment;
    startX: number;
    startY: number;
  }>();
  public dragUpdate = output<{
    appointment: Appointment;
    newStartTime: string;
    newEndTime: string;
    newDoctorId: number;
    isValidTarget: boolean;
  }>();
  public dragComplete = output<{
    appointment: Appointment;
    newStartTime: string;
    newEndTime: string;
    newDoctorId: number;
  }>();

  public isResizing = signal<boolean>(false);
  public isDragging = signal<boolean>(false);
  public currentEndTime = signal<string>("");
  public dragPreview = signal<{
    newStartTime: string;
    newEndTime: string;
    newDoctorId: number;
    isValidTarget: boolean;
  } | null>(null);

  private resizeStartY = 0;
  private resizeListeners: (() => void)[] = [];

  // Drag and drop properties
  private dragStartX = 0;
  private dragStartY = 0;
  private dragListeners: (() => void)[] = [];
  private dragThreshold = 5; // Minimum pixels to move before starting drag

  ngOnInit() {
    this.currentEndTime.set(this.appointment().endTime);
  }

  ngOnDestroy() {
    this.cleanupResizeListeners();
    this.cleanupDragListeners();

    // Clean up global classes if this component is destroyed during resize
    if (this.isResizing()) {
      document.body.classList.remove("appointment-resizing");
      document
        .querySelectorAll(".appointment-card.actively-resizing")
        .forEach((el) => {
          el.classList.remove("actively-resizing");
        });
    }

    // Clean up global classes if this component is destroyed during drag
    if (this.isDragging()) {
      document.body.classList.remove("appointment-dragging");
      document
        .querySelectorAll(".appointment-card.actively-dragging")
        .forEach((el) => {
          el.classList.remove("actively-dragging");
        });
    }
  }

  get startTime(): string {
    // Use drag preview start time during dragging, otherwise use original
    let timeToUse = this.appointment().startTime;
    if (this.isDragging() && this.dragPreview()) {
      timeToUse = this.dragPreview()!.newStartTime;
    }

    const date = new Date(timeToUse);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  get endTime(): string {
    // Use drag preview or current end time during operations, otherwise use original
    let timeToUse = this.appointment().endTime;

    if (this.isDragging() && this.dragPreview()) {
      timeToUse = this.dragPreview()!.newEndTime;
    } else if (this.isResizing()) {
      timeToUse = this.currentEndTime();
    }

    const date = new Date(timeToUse);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  get duration(): number {
    let startTimeToUse = this.appointment().startTime;
    let endTimeToUse = this.appointment().endTime;

    if (this.isDragging() && this.dragPreview()) {
      startTimeToUse = this.dragPreview()!.newStartTime;
      endTimeToUse = this.dragPreview()!.newEndTime;
    } else if (this.isResizing()) {
      endTimeToUse = this.currentEndTime();
    }

    const start = new Date(startTimeToUse);
    const end = new Date(endTimeToUse);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
  }

  /**
   * Calculate dynamic height based on current end time (for real-time resize/drag)
   */
  get dynamicHeight(): number {
    let startTimeToUse = this.appointment().startTime;
    let endTimeToUse = this.appointment().endTime;

    if (this.isDragging() && this.dragPreview()) {
      startTimeToUse = this.dragPreview()!.newStartTime;
      endTimeToUse = this.dragPreview()!.newEndTime;
    } else if (this.isResizing()) {
      endTimeToUse = this.currentEndTime();
    }

    const start = new Date(startTimeToUse);
    const end = new Date(endTimeToUse);
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

  /**
   * Handle mouse down for potential drag start
   */
  onMouseDown(event: MouseEvent): void {
    // Don't start drag if clicking on resize handle or if resize is disabled
    if (!this.enableDrag() || this.isResizing()) return;

    const target = event.target as HTMLElement;
    if (target.closest(".resize-handle")) return;

    event.preventDefault();

    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    // Add temporary listeners to detect if this becomes a drag
    const onMouseMove = (e: MouseEvent) => this.onPotentialDragMove(e);
    const onMouseUp = () => this.onPotentialDragEnd();

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    this.dragListeners = [
      () => document.removeEventListener("mousemove", onMouseMove),
      () => document.removeEventListener("mouseup", onMouseUp),
    ];
  }

  /**
   * Handle potential drag movement
   */
  private onPotentialDragMove(event: MouseEvent): void {
    const deltaX = Math.abs(event.clientX - this.dragStartX);
    const deltaY = Math.abs(event.clientY - this.dragStartY);

    // Check if movement exceeds threshold to start drag
    if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
      this.startDrag(event);
    }
  }

  /**
   * Handle potential drag end (if drag never started)
   */
  private onPotentialDragEnd(): void {
    this.cleanupDragListeners();
  }

  /**
   * Start drag operation
   */
  private startDrag(event: MouseEvent): void {
    this.cleanupDragListeners(); // Clean up potential drag listeners

    this.isDragging.set(true);

    // Add global class to document body to indicate drag mode
    document.body.classList.add("appointment-dragging");

    // Add unique class to this appointment to identify it as the active one
    const appointmentElement = (event.target as HTMLElement).closest(
      ".appointment-card"
    );
    if (appointmentElement) {
      appointmentElement.classList.add("actively-dragging");
    }

    // Start drag in service
    this.dragDropService.startDrag(
      this.appointment(),
      this.dragStartX,
      this.dragStartY,
      this.slotHeight()
    );

    // Emit drag start event
    this.dragStart.emit({
      appointment: this.appointment(),
      startX: this.dragStartX,
      startY: this.dragStartY,
    });

    // Add global mouse listeners for drag
    this.addDragListeners();
  }

  /**
   * Handle mouse move during drag
   */
  private onDragMove = (event: MouseEvent): void => {
    if (!this.isDragging()) return;

    const gridContainer = this.gridContainer();
    if (!gridContainer) return;

    const result = this.dragDropService.updateDrag(
      event.clientX,
      event.clientY,
      gridContainer,
      this.doctors(),
      this.weekDays()
    );

    // Update preview
    this.dragPreview.set(result);

    this.dragUpdate.emit({
      appointment: this.appointment(),
      newStartTime: result.newStartTime,
      newEndTime: result.newEndTime,
      newDoctorId: result.newDoctorId,
      isValidTarget: result.isValidTarget,
    });
  };

  /**
   * Handle mouse up - complete drag
   */
  private onDragEnd = (event: MouseEvent): void => {
    if (!this.isDragging()) return;

    this.isDragging.set(false);
    this.cleanupDragListeners();

    // Remove global classes
    document.body.classList.remove("appointment-dragging");
    document
      .querySelectorAll(".appointment-card.actively-dragging")
      .forEach((el) => {
        el.classList.remove("actively-dragging");
      });

    const preview = this.dragPreview();
    if (preview && preview.isValidTarget) {
      this.dragComplete.emit({
        appointment: this.appointment(),
        newStartTime: preview.newStartTime,
        newEndTime: preview.newEndTime,
        newDoctorId: preview.newDoctorId,
      });
    } else {
      // Reset drag state
      this.dragDropService.cancelDrag();
    }

    this.dragPreview.set(null);
  };

  /**
   * Add global mouse listeners for drag
   */
  private addDragListeners(): void {
    const onMouseMove = this.onDragMove;
    const onMouseUp = this.onDragEnd;

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseUp);

    this.dragListeners = [
      () => document.removeEventListener("mousemove", onMouseMove),
      () => document.removeEventListener("mouseup", onMouseUp),
      () => document.removeEventListener("mouseleave", onMouseUp),
    ];
  }

  /**
   * Clean up drag listeners
   */
  private cleanupDragListeners(): void {
    this.dragListeners.forEach((cleanup) => cleanup());
    this.dragListeners = [];
  }
}
