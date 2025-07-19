import {
  Component,
  input,
  output,
  inject,
  signal,
  OnInit,
  OnDestroy,
  HostBinding,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Appointment } from "../../../../shared/models/appointment.model";
import { Doctor } from "../../../../shared/models/doctor.model";
import { AppointmentResizeService } from "../../services/appointment-resize.service";
import { AppointmentDragDropService } from "../../services/appointment-drag-drop.service";
import { AppointmentColorsService } from "../../../../shared/services/appointment-colors.service";
import {
  SettingsService,
  Settings,
} from "../../../settings/services/settings.service";
import {
  FloatingDragPreviewComponent,
  FloatingDragData,
} from "../floating-drag-preview/floating-drag-preview.component";

@Component({
  selector: "app-appointment-card",
  standalone: true,
  imports: [CommonModule, FloatingDragPreviewComponent],
  templateUrl: "./appointment-card.component.html",
  styleUrl: "./appointment-card.component.scss",
})
export class AppointmentCardComponent implements OnInit, OnDestroy {
  private resizeService = inject(AppointmentResizeService);
  private dragDropService = inject(AppointmentDragDropService);
  private settingsService = inject(SettingsService);
  private appointmentColorsService = inject(AppointmentColorsService);

  // Settings signal
  private settingsSignal = signal<Settings | null>(null);

  public appointment = input.required<Appointment>();
  public settings = input<Settings | null>(null); // Add settings input
  public compact = input<boolean>(false);
  public enableResize = input<boolean>(true);
  public enableDrag = input<boolean>(true);
  public disableHover = input<boolean>(false); // Disable hover effects (useful for month view)
  public slotHeight = input<number>(30); // Height of each 30-minute slot
  public doctors = input<Doctor[]>([]); // Available doctors for horizontal drag
  public gridContainer = input<HTMLElement | null>(null); // Grid container for drag calculations
  public weekDays = input<Date[]>([]); // Week days array for cross-day dragging in week view
  public monthDays = input<Date[]>([]); // Month days array for cross-day dragging in month view
  public viewType = input<"week" | "day" | "month">("day"); // Current view type

  @HostBinding("class.compact") get isCompact() {
    return this.compact();
  }
  @HostBinding("class.disable-hover") get isHoverDisabled() {
    return this.disableHover();
  }
  @HostBinding("class.disable-resize") get isResizeDisabled() {
    return !this.enableResize();
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
  public resizeValidationError = signal<string | null>(null);
  public dragPreview = signal<{
    newStartTime: string;
    newEndTime: string;
    newDoctorId: number;
    isValidTarget: boolean;
  } | null>(null);
  public floatingDragData = signal<FloatingDragData | null>(null);

  private resizeStartY = 0;
  private resizeListeners: (() => void)[] = [];

  // Drag and drop properties
  private dragStartX = 0;
  private dragStartY = 0;
  private dragListeners: (() => void)[] = [];
  private dragThreshold = 5; // Minimum pixels to move before starting drag

  ngOnInit() {
    this.currentEndTime.set(this.appointment().endTime);

    // Only load settings if they weren't passed as input
    if (!this.settings()) {
      // Load settings for status colors
      this.settingsService.getSettings().subscribe({
        next: (settings) => {
          this.settingsSignal.set(settings);
        },
        error: (error) => {
          console.error("Error loading settings in appointment card:", error);
          this.settingsSignal.set(null);
        },
      });
    }
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
    // Use input settings first, then fallback to loaded settings
    const settings = this.settings() || this.settingsSignal();
    const status = this.appointment().status.toLowerCase();

    if (settings && settings.appointments.statusColors) {
      const statusKey =
        status as keyof typeof settings.appointments.statusColors;
      const colorValue = settings.appointments.statusColors[statusKey];

      if (colorValue) {
        const colorClasses =
          this.appointmentColorsService.getStatusColorClasses(colorValue);
        return `${colorClasses.background} ${colorClasses.text}`;
      }
    }

    // Fallback to default status colors using the service
    const defaultColors =
      this.appointmentColorsService.getDefaultStatusColors();
    const defaultColorValue =
      defaultColors[status as keyof typeof defaultColors] || "gray";
    const colorClasses =
      this.appointmentColorsService.getStatusColorClasses(defaultColorValue);
    return `${colorClasses.background} ${colorClasses.text}`;
  }

  get statusBorderColor(): string {
    // Use input settings first, then fallback to loaded settings
    const settings = this.settings() || this.settingsSignal();
    const status = this.appointment().status.toLowerCase();

    if (settings && settings.appointments.statusColors) {
      const statusKey =
        status as keyof typeof settings.appointments.statusColors;
      const colorValue = settings.appointments.statusColors[statusKey];

      if (colorValue) {
        const colorClasses =
          this.appointmentColorsService.getStatusColorClasses(colorValue);
        return colorClasses.border;
      }
    }

    // Fallback to default border colors using the service
    const defaultColors =
      this.appointmentColorsService.getDefaultStatusColors();
    const defaultColorValue =
      defaultColors[status as keyof typeof defaultColors] || "gray";
    const colorClasses =
      this.appointmentColorsService.getStatusColorClasses(defaultColorValue);
    return colorClasses.border;
  }

  get doctorBorderColor(): string {
    const doctor = this.doctors().find(
      (d) => d.id === this.appointment().doctorId
    );
    if (doctor && doctor.color) {
      // Convert hex color to border class
      const color = doctor.color.toLowerCase();
      if (color.startsWith("#")) {
        // Convert hex to Tailwind border class
        const hexToTailwindMap: { [hex: string]: string } = {
          "#3b82f6": "border-l-blue-500",
          "#10b981": "border-l-green-500",
          "#ef4444": "border-l-red-500",
          "#f59e0b": "border-l-yellow-500",
          "#8b5cf6": "border-l-purple-500",
          "#ec4899": "border-l-pink-500",
          "#6366f1": "border-l-indigo-500",
          "#059669": "border-l-emerald-500",
          "#ea580c": "border-l-orange-500",
          "#6b7280": "border-l-gray-500",
        };
        return hexToTailwindMap[color] || "border-l-gray-500";
      }
      // If it's already a color name, convert to border class
      return `border-l-${color}-500`;
    }
    return "border-l-gray-400"; // Default border color
  }

  getDoctorColor(): string {
    const doctor = this.doctors().find(
      (d) => d.id === this.appointment().doctorId
    );
    return doctor?.color || "#6b7280"; // Default to gray if no doctor color
  }

  getDoctorFirstName(): string {
    const doctor = this.doctors().find(
      (d) => d.id === this.appointment().doctorId
    );
    return doctor?.name?.split(" ")[0] || "Unknown";
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
    this.resizeValidationError.set(null); // Clear any previous validation errors

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

    // Check validation and provide feedback
    const validation = this.resizeService.validateResize();
    if (!validation.isValid) {
      this.resizeValidationError.set(
        validation.errorMessage || "Invalid resize"
      );
    } else {
      this.resizeValidationError.set(null);
    }

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
    this.resizeValidationError.set(null); // Clear validation errors
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
    // Don't start drag if already dragging, resizing, or drag is disabled
    if (!this.enableDrag() || this.isResizing() || this.isDragging()) return;

    const target = event.target as HTMLElement;
    if (target.closest(".resize-handle")) return;

    event.preventDefault();
    event.stopPropagation();

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
    // Prevent multiple drag starts
    if (this.isDragging()) return;

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
      this.slotHeight(),
      this.viewType()
    );

    // Initialize floating drag preview
    this.updateFloatingPreview(event.clientX, event.clientY);

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
    if (!gridContainer) {
      // If no grid container, mark as invalid
      this.dragPreview.set({
        newStartTime: this.appointment().startTime,
        newEndTime: this.appointment().endTime,
        newDoctorId: this.appointment().doctorId,
        isValidTarget: false,
      });
      return;
    }

    // Check if mouse is outside the grid container bounds
    const rect = gridContainer.getBoundingClientRect();
    const mouseOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (mouseOutside) {
      // Mouse is outside the valid drop area
      this.dragPreview.set({
        newStartTime: this.appointment().startTime,
        newEndTime: this.appointment().endTime,
        newDoctorId: this.appointment().doctorId,
        isValidTarget: false,
      });

      this.dragUpdate.emit({
        appointment: this.appointment(),
        newStartTime: this.appointment().startTime,
        newEndTime: this.appointment().endTime,
        newDoctorId: this.appointment().doctorId,
        isValidTarget: false,
      });

      // Update floating preview for invalid position
      this.updateFloatingPreview(event.clientX, event.clientY);
      return;
    }

    // Mouse is within bounds, proceed with normal drag calculation
    const result = this.dragDropService.updateDrag(
      event.clientX,
      event.clientY,
      gridContainer,
      this.doctors(),
      this.weekDays(),
      this.monthDays()
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

    // Update floating preview
    this.updateFloatingPreview(event.clientX, event.clientY);
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

    // Only emit dragComplete if the drop target is valid
    if (preview && preview.isValidTarget) {
      this.dragComplete.emit({
        appointment: this.appointment(),
        newStartTime: preview.newStartTime,
        newEndTime: preview.newEndTime,
        newDoctorId: preview.newDoctorId,
      });
    } else {
      // Drag was canceled or dropped in invalid location
      console.log("Drag canceled - invalid drop target or outside bounds");

      // Reset drag state in service
      this.dragDropService.cancelDrag();

      // Reset visual state
      this.dragPreview.set(null);

      // You could emit a dragCancel event here if needed
      // this.dragCancel.emit({ appointment: this.appointment() });
    }

    // Always reset preview after handling
    this.dragPreview.set(null);

    // Clear floating preview
    this.floatingDragData.set(null);
  };

  /**
   * Add global mouse listeners for drag
   */
  private addDragListeners(): void {
    const onMouseMove = this.onDragMove;
    const onMouseUp = this.onDragEnd;
    const onMouseLeave = this.onDragEnd;

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    // Add mouseleave to window and key elements to handle drag cancellation
    window.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseleave", onMouseLeave);

    // Add escape key listener to cancel drag
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        this.onDragEnd(new MouseEvent("mouseup"));
      }
    };
    document.addEventListener("keydown", onKeyDown);

    this.dragListeners = [
      () => document.removeEventListener("mousemove", onMouseMove),
      () => document.removeEventListener("mouseup", onMouseUp),
      () => window.removeEventListener("mouseleave", onMouseLeave),
      () => document.removeEventListener("mouseleave", onMouseLeave),
      () => document.removeEventListener("keydown", onKeyDown),
    ];
  }

  /**
   * Clean up drag listeners
   */
  private cleanupDragListeners(): void {
    this.dragListeners.forEach((cleanup) => cleanup());
    this.dragListeners = [];
  }

  /**
   * Update floating drag preview
   */
  private updateFloatingPreview(mouseX: number, mouseY: number): void {
    if (!this.isDragging()) {
      this.floatingDragData.set(null);
      return;
    }

    const previewData = this.dragDropService.getFloatingDragData(
      mouseX,
      mouseY
    );
    this.floatingDragData.set(previewData);
  }
}
