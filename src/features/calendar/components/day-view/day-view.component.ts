import { Component, input, output, inject, signal, ViewChild, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Appointment } from "../../../../shared/models/appointment.model";
import { Doctor } from "../../../../shared/models/doctor.model";
import { AppointmentCardComponent } from "../appointment-card/appointment-card.component";
import { ResizeConfirmationModalComponent } from "../resize-confirmation-modal/resize-confirmation-modal.component";
import { DragDropConfirmationComponent } from "../drag-drop-confirmation/drag-drop-confirmation.component";
import { CalendarService } from "../../services/calendar.service";
import { AppointmentResizeService } from "../../services/appointment-resize.service";
import { AppointmentDragDropService, DragDropConfirmation } from "../../services/appointment-drag-drop.service";
import { DoctorService } from "../../../doctors/services/doctor.service";
import { ToasterService } from "../../../../shared/services/toaster.service";

@Component({
  selector: "app-day-view",
  standalone: true,
  imports: [
    CommonModule,
    AppointmentCardComponent,
    ResizeConfirmationModalComponent,
    DragDropConfirmationComponent,
  ],
  templateUrl: "./day-view.component.html",
  styleUrl: "./day-view.component.scss",
})
export class DayViewComponent {
  private calendarService = inject(CalendarService);
  private resizeService = inject(AppointmentResizeService);
  private dragDropService = inject(AppointmentDragDropService);
  private doctorService = inject(DoctorService);
  private toasterService = inject(ToasterService);

  @ViewChild('gridContainer', { static: false }) gridContainer!: ElementRef<HTMLElement>;

  public currentDate = input<Date>(new Date());
  public appointments = input<Appointment[]>([]);
  public doctors = input<Doctor[]>([]);

  public appointmentSelect = output<Appointment>();
  public timeSlotSelect = output<{ date: Date; time: string }>();
  public appointmentUpdate = output<Appointment>();

  // Resize confirmation modal state
  public showResizeModal = signal<boolean>(false);
  public resizeAppointment = signal<Appointment | null>(null);
  public newEndTime = signal<string>("");

  // Drag and drop confirmation modal state
  public showDragDropModal = signal<boolean>(false);
  public dragDropConfirmation = signal<DragDropConfirmation | null>(null);
  public isDragDropLoading = signal<boolean>(false);

  get timeSlots(): string[] {
    const slots: string[] = [];
    for (let hour = 8; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return slots;
  }

  get dayAppointments(): Appointment[] {
    const dateStr = this.calendarService.formatDateForFiltering(
      this.currentDate()
    );
    return this.appointments().filter((apt) =>
      apt.startTime.startsWith(dateStr)
    );
  }

  getAppointmentsForTimeSlot(timeSlot: string): Appointment[] {
    const date = this.currentDate();
    const [hour, minute] = timeSlot.split(":").map(Number);

    return this.dayAppointments.filter((apt) => {
      const aptStart = new Date(apt.startTime);
      const slotTime = new Date(date);
      slotTime.setHours(hour, minute, 0, 0);

      // Only show appointment at its starting time slot
      return aptStart.getHours() === hour && aptStart.getMinutes() === minute;
    });
  }

  getOverlappingAppointments(
    appointments: Appointment[]
  ): { appointment: Appointment; column: number; totalColumns: number }[] {
    if (appointments.length <= 1) {
      return appointments.map((apt) => ({
        appointment: apt,
        column: 0,
        totalColumns: 1,
      }));
    }

    // Sort appointments by start time
    const sortedAppointments = [...appointments].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const result: {
      appointment: Appointment;
      column: number;
      totalColumns: number;
    }[] = [];

    // For overlapping appointments, assign columns
    sortedAppointments.forEach((apt, index) => {
      result.push({
        appointment: apt,
        column: index,
        totalColumns: sortedAppointments.length,
      });
    });

    return result;
  }

  isTimeSlotOccupied(timeSlot: string): boolean {
    const date = this.currentDate();
    const [hour, minute] = timeSlot.split(":").map(Number);

    return this.dayAppointments.some((apt) => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      const slotTime = new Date(date);
      slotTime.setHours(hour, minute, 0, 0);

      return aptStart <= slotTime && aptEnd > slotTime;
    });
  }

  getAppointmentHeight(appointment: Appointment): number {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    // Calculate exact number of 30-minute slots this appointment spans
    const slotsSpanned = durationMinutes / 30;

    // Each time slot has: py-3 (24px total padding) + min-h-[40px] + border-b (1px) = 65px
    const slotHeight = 65;

    // For appointments spanning multiple slots, we need the full height including borders
    const totalHeight = slotsSpanned * slotHeight;

    return Math.max(40, totalHeight);
  }

  getAppointmentTopOffset(appointment: Appointment, timeSlot: string): number {
    const aptStart = new Date(appointment.startTime);
    const [slotHour, slotMinute] = timeSlot.split(":").map(Number);

    // Calculate the minute offset within the time slot
    const aptMinute = aptStart.getMinutes();
    const slotStartMinute = slotMinute;

    // If appointment starts exactly at slot time, offset it up slightly to align with border
    if (aptMinute === slotStartMinute) {
      return -12; // Move up by 12px to align with slot border better
    }

    // Calculate offset based on minutes past the slot start
    const minuteOffset = aptMinute - slotStartMinute;
    // Each minute = slotHeight / 30 (since each slot is 30 minutes)
    const slotHeight = 65;
    const offsetPixels = (minuteOffset / 30) * slotHeight - 12; // Reduce top position by 12px

    return offsetPixels;
  }

  isPastTimeSlot(timeSlot: string): boolean {
    const now = new Date();
    const date = this.currentDate();
    const [hour, minute] = timeSlot.split(":").map(Number);
    const slotTime = new Date(date);
    slotTime.setHours(hour, minute, 0, 0);

    return slotTime < now;
  }

  onAppointmentClick(appointment: Appointment): void {
    this.appointmentSelect.emit(appointment);
  }

  onTimeSlotClick(timeSlot: string): void {
    // Don't allow clicking on past time slots
    if (this.isPastTimeSlot(timeSlot)) {
      return;
    }

    this.timeSlotSelect.emit({
      date: this.currentDate(),
      time: timeSlot,
    });
  }

  // Debug method to understand appointment duration and positioning
  debugAppointment(appointment: Appointment): void {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const height = this.getAppointmentHeight(appointment);
    const slotsSpanned = durationMinutes / 30;

    // Find the corresponding time slot
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const timeSlot = `${startHour.toString().padStart(2, "0")}:${startMinute
      .toString()
      .padStart(2, "0")}`;
    const topOffset = this.getAppointmentTopOffset(appointment, timeSlot);

    console.log("Appointment Debug:", {
      title: appointment.title,
      startTime: start.toLocaleString(),
      endTime: end.toLocaleString(),
      durationMinutes,
      slotsSpanned,
      calculatedHeight: height,
      topOffset: topOffset + "px (reduced by 12px for better alignment)",
      timeSlot,
      exactSlotAlignment:
        startMinute % 30 === 0
          ? "Aligned with 12px offset"
          : "Offset by " + (startMinute % 30) + " minutes + 12px adjustment",
      zIndex: "30 (lower than forms which use 50+)",
    });
  }

  /**
   * Handle resize start event from appointment card
   */
  onResizeStart(event: { appointment: Appointment; startY: number }): void {
    console.log("Resize started for appointment:", event.appointment.title);
  }

  /**
   * Handle resize update event from appointment card
   */
  onResizeUpdate(event: {
    appointment: Appointment;
    newEndTime: string;
  }): void {
    console.log(
      "Resize updated:",
      event.appointment.title,
      "New end time:",
      event.newEndTime
    );
  }

  /**
   * Handle resize complete event from appointment card
   */
  onResizeComplete(event: {
    appointment: Appointment;
    newEndTime: string;
  }): void {
    this.resizeAppointment.set(event.appointment);
    this.newEndTime.set(event.newEndTime);
    this.showResizeModal.set(true);
  }

  /**
   * Confirm resize operation
   */
  onResizeConfirm(): void {
    const resizeOperation = this.resizeService.completeResize();
    if (resizeOperation) {
      resizeOperation.subscribe({
        next: (updatedAppointment) => {
          this.appointmentUpdate.emit(updatedAppointment);
          this.toasterService.showSuccess(
            "Appointment Resized",
            "The appointment duration has been updated successfully."
          );
          this.closeResizeModal();
        },
        error: (error) => {
          console.error("Failed to resize appointment:", error);
          this.toasterService.showError(
            "Resize Failed",
            "Failed to update appointment. Please try again."
          );
          this.closeResizeModal();
        },
      });
    } else {
      this.closeResizeModal();
    }
  }

  /**
   * Cancel resize operation
   */
  onResizeCancel(): void {
    this.resizeService.cancelResize();
    this.closeResizeModal();
  }

  /**
   * Close resize modal
   */
  private closeResizeModal(): void {
    this.showResizeModal.set(false);
    this.resizeAppointment.set(null);
    this.newEndTime.set("");
  }

  // Drag and Drop Methods

  /**
   * Handle drag start event from appointment card
   */
  onDragStart(event: { appointment: Appointment; startX: number; startY: number }): void {
    console.log("Drag started:", event);
  }

  /**
   * Handle drag update event from appointment card
   */
  onDragUpdate(event: {
    appointment: Appointment;
    newStartTime: string;
    newEndTime: string;
    newDoctorId: number;
    isValidTarget: boolean;
  }): void {
    // Update visual feedback if needed
    console.log("Drag update:", event);
  }

  /**
   * Handle drag complete event from appointment card
   */
  onDragComplete(event: {
    appointment: Appointment;
    newStartTime: string;
    newEndTime: string;
    newDoctorId: number;
  }): void {
    // Get confirmation data from the drag drop service
    const confirmationData = this.dragDropService.getDragConfirmation();
    if (confirmationData) {
      // If doctor changed, fetch the new doctor details
      if (confirmationData.changes.doctorChanged) {
        this.doctorService.getDoctor(confirmationData.newDoctorId).subscribe({
          next: (doctor) => {
            confirmationData.newDoctor = doctor;
            this.dragDropConfirmation.set(confirmationData);
            this.showDragDropModal.set(true);
          },
          error: (error) => {
            console.error("Failed to fetch doctor details:", error);
            this.toasterService.showError(
              "Error",
              "Failed to fetch doctor details. Please try again."
            );
            this.dragDropService.cancelDrag();
          }
        });
      } else {
        this.dragDropConfirmation.set(confirmationData);
        this.showDragDropModal.set(true);
      }
    }
  }

  /**
   * Confirm drag and drop operation
   */
  onDragDropConfirm(): void {
    this.isDragDropLoading.set(true);
    
    // First validate with doctor availability check
    this.dragDropService.validateDragComplete().subscribe({
      next: (validation) => {
        if (validation.isValid) {
          // Complete the drag operation
          this.dragDropService.completeDrag().subscribe({
            next: (updatedAppointment) => {
              this.appointmentUpdate.emit(updatedAppointment);
              const confirmationData = this.dragDropConfirmation();
              let message = "Appointment moved successfully.";
              
              if (confirmationData?.changes.timeChanged && confirmationData?.changes.doctorChanged) {
                message = "Appointment time and doctor updated successfully.";
              } else if (confirmationData?.changes.timeChanged) {
                message = "Appointment time updated successfully.";
              } else if (confirmationData?.changes.doctorChanged) {
                message = "Appointment doctor updated successfully.";
              }
              
              this.toasterService.showSuccess("Appointment Updated", message);
              this.closeDragDropModal();
            },
            error: (error) => {
              console.error("Failed to update appointment:", error);
              this.toasterService.showError(
                "Update Failed",
                "Failed to update appointment. Please try again."
              );
              this.closeDragDropModal();
            }
          });
        } else {
          this.toasterService.showError(
            "Invalid Position",
            validation.errorMessage || "Cannot move appointment to this position."
          );
          this.closeDragDropModal();
        }
      },
      error: (error) => {
        console.error("Failed to validate appointment position:", error);
        this.toasterService.showError(
          "Validation Failed",
          "Failed to validate appointment position. Please try again."
        );
        this.closeDragDropModal();
      }
    });
  }

  /**
   * Cancel drag and drop operation
   */
  onDragDropCancel(): void {
    this.dragDropService.cancelDrag();
    this.closeDragDropModal();
  }

  /**
   * Close drag drop modal
   */
  private closeDragDropModal(): void {
    this.isDragDropLoading.set(false);
    this.showDragDropModal.set(false);
    this.dragDropConfirmation.set(null);
  }

  /**
   * Check if a time slot is blocked for drag and drop
   */
  isTimeSlotBlocked(timeSlot: string): boolean {
    const [hour, minute] = timeSlot.split(':').map(Number);
    const slotDateTime = new Date(this.currentDate());
    slotDateTime.setHours(hour, minute, 0, 0);
    
    return this.dragDropService.isTimeSlotBlocked(this.currentDate(), timeSlot);
  }
}
