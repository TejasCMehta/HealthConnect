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
  selector: "app-week-view",
  standalone: true,
  imports: [
    CommonModule,
    AppointmentCardComponent,
    ResizeConfirmationModalComponent,
    DragDropConfirmationComponent,
  ],
  templateUrl: "./week-view.component.html",
  styleUrl: "./week-view.component.scss",
})
export class WeekViewComponent {
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
  public appointmentClick = output<{
    appointment: Appointment;
    clickEvent: MouseEvent;
  }>();
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

  get weekDays(): Date[] {
    const date = this.currentDate();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  }

  get timeSlots(): string[] {
    const slots: string[] = [];
    for (let hour = 8; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return slots;
  }

  getAppointmentsForDateAndTime(date: Date, timeSlot: string): Appointment[] {
    const dateStr = this.calendarService.formatDateForFiltering(date);
    const [hour, minute] = timeSlot.split(":").map(Number);

    return this.appointments().filter((apt) => {
      const aptStart = new Date(apt.startTime);

      return (
        apt.startTime.startsWith(dateStr) &&
        aptStart.getHours() === hour &&
        aptStart.getMinutes() === minute
      );
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

  isTimeSlotOccupied(date: Date, timeSlot: string): boolean {
    const dateStr = this.calendarService.formatDateForFiltering(date);
    const [hour, minute] = timeSlot.split(":").map(Number);

    return this.appointments().some((apt) => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      const slotTime = new Date(date);
      slotTime.setHours(hour, minute, 0, 0);

      return (
        apt.startTime.startsWith(dateStr) &&
        aptStart <= slotTime &&
        aptEnd > slotTime
      );
    });
  }

  getAppointmentHeight(appointment: Appointment): number {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    // Calculate exact number of 30-minute slots this appointment spans
    const slotsSpanned = durationMinutes / 30;

    // Each 30-minute slot has a height of 60px in week view
    const slotHeight = 60;

    // For appointments spanning multiple slots, we need the full height
    const totalHeight = slotsSpanned * slotHeight;

    return Math.max(30, totalHeight);
  }

  getAppointmentTopOffset(appointment: Appointment, timeSlot: string): number {
    const aptStart = new Date(appointment.startTime);
    const [slotHour, slotMinute] = timeSlot.split(":").map(Number);

    // Calculate the minute offset within the time slot
    const aptMinute = aptStart.getMinutes();
    const slotStartMinute = slotMinute;

    // If appointment starts exactly at slot time, offset it up slightly to align with border
    if (aptMinute === slotStartMinute) {
      return -4; // Move up by 4px to align with slot border better (smaller offset for week view)
    }

    // Calculate offset based on minutes past the slot start
    const minuteOffset = aptMinute - slotStartMinute;
    // Each minute = slotHeight / 30 (since each slot is 30 minutes)
    const slotHeight = 60;
    const offsetPixels = (minuteOffset / 30) * slotHeight - 4; // Reduce top position by 4px

    return offsetPixels;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isPastTimeSlot(date: Date, timeSlot: string): boolean {
    const now = new Date();
    const [hour, minute] = timeSlot.split(":").map(Number);
    const slotTime = new Date(date);
    slotTime.setHours(hour, minute, 0, 0);

    return slotTime < now;
  }

  onAppointmentClick(appointment: Appointment, event: MouseEvent): void {
    event.stopPropagation();
    this.appointmentClick.emit({ appointment, clickEvent: event });
  }

  onTimeSlotClick(date: Date, timeSlot: string): void {
    // Don't allow clicking on past time slots
    if (this.isPastTimeSlot(date, timeSlot)) {
      return;
    }

    this.timeSlotSelect.emit({
      date: date,
      time: timeSlot,
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
  isTimeSlotBlocked(date: Date, timeSlot: string): boolean {
    return this.dragDropService.isTimeSlotBlocked(date, timeSlot);
  }
}
